'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaRedo, FaBrain, FaHome, FaTimes, FaExpand } from 'react-icons/fa';
import confetti from 'canvas-confetti';

interface PuzzleGameProps {
    imageUrl: string;
    difficulty: 'easy' | 'medium' | 'hard';
    onComplete: (moves: number) => void;
    onExit: () => void;
}

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE; // 16

export default function PuzzleGame({ imageUrl, difficulty, onComplete, onExit }: PuzzleGameProps) {
    const [showFullImage, setShowFullImage] = useState(false);

    const [tiles, setTiles] = useState<number[]>([]);
    const [emptyIndex, setEmptyIndex] = useState(TOTAL_TILES - 1);
    const [moves, setMoves] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [isShuffling, setIsShuffling] = useState(true);

    // Initialize Solved State
    const getSolvedState = () => Array.from({ length: TOTAL_TILES }, (_, i) => i);

    // Check if Solved
    const checkWin = (currentTiles: number[]) => {
        const win = currentTiles.every((tile, index) => tile === index);
        if (win && !isShuffling) {
            setIsSolved(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            onComplete(moves + 1); // +1 because strict mode might lag updates
        }
        return win;
    };

    // Shuffle Logic (Reverse Walk to guarantee solvability)
    const shuffleTiles = useCallback(async () => {
        setIsShuffling(true);
        setIsSolved(false);
        setMoves(0);

        let currentWrapper = [...getSolvedState()];
        let currentEmpty = TOTAL_TILES - 1;
        let previousMove = -1;

        const shuffleCount = difficulty === 'hard' ? 80 : difficulty === 'medium' ? 40 : 15;

        // Perform Shuffle
        for (let i = 0; i < shuffleCount; i++) {
            const possibleMoves = [];
            const row = Math.floor(currentEmpty / GRID_SIZE);
            const col = currentEmpty % GRID_SIZE;

            if (row > 0) possibleMoves.push(currentEmpty - GRID_SIZE); // Up
            if (row < GRID_SIZE - 1) possibleMoves.push(currentEmpty + GRID_SIZE); // Down
            if (col > 0) possibleMoves.push(currentEmpty - 1); // Left
            if (col < GRID_SIZE - 1) possibleMoves.push(currentEmpty + 1); // Right

            // Filter out 'undo' move to ensure effective shuffling
            const validMoves = possibleMoves.filter(m => m !== previousMove);
            const nextEmpty = validMoves[Math.floor(Math.random() * validMoves.length)];

            // Swap
            currentWrapper[currentEmpty] = currentWrapper[nextEmpty];
            currentWrapper[nextEmpty] = TOTAL_TILES - 1;

            previousMove = currentEmpty;
            currentEmpty = nextEmpty;
        }

        setTiles(currentWrapper);
        setEmptyIndex(currentEmpty);
        setIsShuffling(false);
    }, [difficulty]);

    useEffect(() => {
        shuffleTiles();
    }, [shuffleTiles]);

    const handleTileClick = (index: number) => {
        if (isSolved || isShuffling) return;

        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
        const emptyCol = emptyIndex % GRID_SIZE;

        const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

        if (isAdjacent) {
            const newTiles = [...tiles];
            // Swap logic
            newTiles[emptyIndex] = newTiles[index];
            newTiles[index] = TOTAL_TILES - 1; // 15 is empty

            setTiles(newTiles);
            setEmptyIndex(index);
            setMoves(m => m + 1);
            checkWin(newTiles);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-md mx-auto p-4">
            {/* Header / Stats */}
            <div className="w-full flex justify-between items-center mb-6">
                <button onClick={onExit} className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800">
                    <FaHome />
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-gray-600 font-bold bg-white px-4 py-1 rounded-full shadow-sm border border-gray-100">
                        Moves: <span className="text-purple-600">{moves}</span>
                    </div>
                </div>
                <button onClick={shuffleTiles} className="p-2 bg-purple-50 rounded-lg text-purple-600 hover:bg-purple-100" title="Restart">
                    <FaRedo />
                </button>
            </div>

            {/* Game Board */}
            <div className="relative bg-gray-800 p-2 rounded-2xl shadow-xl shadow-purple-900/20 border-4 border-gray-700">
                <div
                    className="grid grid-cols-4 gap-1 w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] bg-gray-900 rounded-xl overflow-hidden"
                >
                    {tiles.map((tileNumber, index) => {
                        // Coordinates for background position
                        // Original Position of this tile piece in the 4x4 image
                        const bgRow = Math.floor(tileNumber / GRID_SIZE);
                        const bgCol = tileNumber % GRID_SIZE;
                        const percentX = bgCol * (100 / (GRID_SIZE - 1));
                        const percentY = bgRow * (100 / (GRID_SIZE - 1));

                        const isEmpty = tileNumber === TOTAL_TILES - 1;

                        return (
                            <motion.div
                                key={`${tileNumber}-${isShuffling ? 'shuffle' : 'game'}`} // Reset key on shuffle to prevent animation weirdness
                                layout={!isShuffling && !isSolved} // animate layout changes unless shuffling
                                onClick={() => handleTileClick(index)}
                                className={`
                                    relative w-full h-full rounded-md overflow-hidden cursor-pointer
                                    ${isEmpty ? 'opacity-0 pointer-events-none' : 'shadow-inner'}
                                `}
                                style={{
                                    backgroundImage: isEmpty ? 'none' : `url(${imageUrl})`,
                                    backgroundSize: '400% 400%',
                                    backgroundPosition: `${percentX}% ${percentY}%`
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                {/* Active State Highlight */}
                                {!isEmpty && !isSolved && (
                                    <div className="absolute inset-0 hover:bg-white/10 transition-colors" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {isSolved && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl animate-in fade-in duration-500">
                        <div className="bg-white p-6 rounded-2xl text-center shadow-2xl transform scale-110">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                                <FaTrophy />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">Excellent!</h2>
                            <p className="text-gray-500 text-sm mb-4">Brain is warmed up & ready.</p>
                            <button onClick={onExit} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">
                                Go Study Now
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reference Image (Small) */}
            <div className="mt-8 flex flex-col items-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tap to View</p>
                <div
                    onClick={() => setShowFullImage(true)}
                    className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm cursor-pointer hover:border-purple-500 hover:shadow-md transition-all relative group"
                >
                    <img src={imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Reference" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <FaExpand className="text-white drop-shadow-md" />
                    </div>
                </div>
            </div>

            {/* Full Image Modal */}
            <AnimatePresence>
                {showFullImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFullImage(false)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={imageUrl} className="w-full h-full object-contain max-h-[85vh]" alt="Full Size Reference" />
                            <button
                                onClick={() => setShowFullImage(false)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
