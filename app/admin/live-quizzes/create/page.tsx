'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { LiveQuiz, Question, Batch } from '@/data/types';
import { FaSave, FaSearch, FaCheck, FaPlus, FaCalendarAlt, FaClock, FaMinusCircle } from 'react-icons/fa';
import { HiArrowLeft } from 'react-icons/hi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function CreateLiveQuizPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'global' | 'batch'>('global');
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [duration, setDuration] = useState(30);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
    const [targetBoard, setTargetBoard] = useState('cbse'); // Default to CBSE
    const [subject, setSubject] = useState('Mixed');
    const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

    // Question Selection State
    const [creationMode, setCreationMode] = useState<'bank' | 'manual'>('manual'); // Default to manual as per user request
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

    // Manual Question Form State
    const [mqText, setMqText] = useState('');
    const [mqOptions, setMqOptions] = useState(['', '', '', '']);
    const [mqCorrect, setMqCorrect] = useState(0);
    const [mqMarks, setMqMarks] = useState(4);
    const [mqSubject, setMqSubject] = useState('Physics');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterBoard, setFilterBoard] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');

    // Data Headers
    const [batches, setBatches] = useState<Batch[]>([]);

    useEffect(() => {
        // Fetch Batches
        const fetchBatches = async () => {
            const q = query(collection(db, 'batches'));
            const snap = await getDocs(q);
            setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Batch)));
        };
        fetchBatches();
    }, []);

    useEffect(() => {
        // Fetch Questions for Selection
        const fetchQuestions = async () => {
            let constraints: any[] = [limit(500), orderBy('createdAt', 'desc')];

            // Filter by Target Board
            if (targetBoard !== 'all') constraints.push(where('board', '==', targetBoard));

            // Filter by Subject (if selected) - using local input or quiz subject? 
            // Better to keep the Search filter for subject flexibility, 
            // BUT user said "wahi question show honge... jis board or class ko maine select kiya".
            // So Board and Class must be strict. Subject usually follows quiz subject but Mixed quizzes exist.
            // Let's keep subject flexible via filterSubject, but enforce Board and Class.
            if (filterSubject !== 'all') constraints.push(where('subject', '==', filterSubject));

            // Filter by Class (if selected)
            if (selectedClasses.length > 0) {
                // Firestore 'in' query supports up to 10 items
                const classes = selectedClasses.slice(0, 10);
                constraints.push(where('class', 'in', classes));
            }

            const q = query(collection(db, 'questions'), ...constraints);
            try {
                const snap = await getDocs(q);
                setAvailableQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
            } catch (error) {
                console.error("Error fetching questions:", error);
                // Fallback for compound index errors or "in" query limits
            }
        };
        fetchQuestions();
    }, [targetBoard, filterSubject, selectedClasses]);


    const handleToggleQuestion = (question: Question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const handleAddManualQuestion = () => {
        if (!mqText || mqOptions.some(o => !o.trim())) {
            alert("Please fill question and all options");
            return;
        }

        const newQ: Question = {
            id: `manual_${Date.now()}`,
            question: mqText,
            options: mqOptions,
            correctAnswer: mqCorrect,
            marks: mqMarks,
            subject: mqSubject,
            board: 'other',
            class: '12',
            year: new Date().getFullYear(),
            chapter: 'General',
            topic: 'General',
            questionType: 'mcq',
            difficulty: 'medium',
            tags: [],
            explanation: '',
            language: 'english'
        };

        setSelectedQuestions(prev => [...prev, newQ]);
        // Reset Form
        setMqText('');
        setMqOptions(['', '', '', '']);
        setMqCorrect(0);
    };

    const handleCreateQuiz = async () => {
        if (!title || selectedQuestions.length === 0) {
            alert("Please fill all fields and select at least one question.");
            return;
        }

        setLoading(true);
        try {
            const quizData: Omit<LiveQuiz, 'id'> = {
                title,
                description,
                type,
                targetBatches: type === 'batch' ? selectedBatches : [],
                allowedClasses: selectedClasses,
                allowedStreams: selectedStreams,
                subject,
                targetBoard, // Save the board
                startTime: startTime.getTime(),
                endTime: startTime.getTime() + (duration * 60 * 1000) + (10 * 60 * 1000), // End time is technically window close, giving 10 mins buffer or handled via Logic
                duration,
                questions: selectedQuestions,
                totalMarks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
                createdBy: 'admin', // Replace with actual user ID if available in context
                createdAt: Date.now(),
                status: 'scheduled',
                participantsCount: 0
            };

            await addDoc(collection(db, 'live_quizzes'), quizData);
            router.push('/admin/live-quizzes');
        } catch (error) {
            console.error("Error creating quiz:", error);
            alert("Failed to create quiz.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="text-gray-400 font-bold hover:text-pw-indigo flex items-center gap-1 mb-2">
                        <HiArrowLeft /> Back
                    </button>
                    <h1 className="text-3xl font-display font-bold text-pw-violet">Create Live Quiz</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Settings */}
                    <div className="bg-white p-6 rounded-3xl border border-pw-border shadow-sm space-y-6 lg:col-span-1">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Quiz Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium"
                                placeholder="e.g. Weekly Physics Test"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium h-24"
                                placeholder="Optional description..."
                            />
                        </div>

                        {/* Target Board Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Board</label>
                            <select
                                value={targetBoard}
                                onChange={(e) => setTargetBoard(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium capitalize"
                            >
                                <option value="cbse">CBSE</option>
                                <option value="icse">ICSE</option>
                                <option value="bseb">BSEB (Bihar Board)</option>
                                <option value="all">All Boards (Generic)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Quiz Type</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setType('global')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'global' ? 'bg-white text-pw-indigo shadow-sm' : 'text-gray-500'}`}
                                >
                                    Global
                                </button>
                                <button
                                    onClick={() => setType('batch')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'batch' ? 'bg-white text-pw-indigo shadow-sm' : 'text-gray-500'}`}
                                >
                                    Batch Specific
                                </button>
                            </div>
                        </div>

                        {/* Class Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Allowed Classes</label>
                            <div className="flex flex-wrap gap-2">
                                {['9', '10', '11', '12'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            if (selectedClasses.includes(cls)) setSelectedClasses(prev => prev.filter(c => c !== cls));
                                            else setSelectedClasses(prev => [...prev, cls]);
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedClasses.includes(cls) ? 'bg-pw-indigo text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        Class {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stream Selection (Visible only if Class 11 or 12 is selected) */}
                        {(selectedClasses.includes('11') || selectedClasses.includes('12')) && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Allowed Streams</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Science', 'Commerce', 'Arts'].map(stm => (
                                        <button
                                            key={stm}
                                            onClick={() => {
                                                if (selectedStreams.includes(stm)) setSelectedStreams(prev => prev.filter(s => s !== stm));
                                                else setSelectedStreams(prev => [...prev, stm]);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedStreams.includes(stm) ? 'bg-pink-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            {stm}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium capitalize"
                            >
                                <option value="Mixed">Mixed Subjects</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Biology">Biology</option>
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="History">History</option>
                                <option value="Geography">Geography</option>
                                <option value="Political Science">Political Science</option>
                                <option value="Economics">Economics</option>
                                <option value="Accountancy">Accountancy</option>
                                <option value="Business Studies">Business Studies</option>
                                <option value="Sanskrit">Sanskrit</option>
                            </select>
                        </div>

                        {type === 'batch' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Select Batches</label>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
                                    {batches.map(batch => (
                                        <label key={batch.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedBatches.includes(batch.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedBatches(prev => [...prev, batch.id]);
                                                    else setSelectedBatches(prev => prev.filter(id => id !== batch.id));
                                                }}
                                                className="rounded text-pw-indigo"
                                            />
                                            <span className="text-sm font-medium">{batch.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Start Time</label>
                            <DatePicker
                                selected={startTime}
                                onChange={(date: Date | null) => setStartTime(date || new Date())}
                                showTimeSelect
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700">Duration (Minutes)</label>
                                <button
                                    onClick={() => setDuration(Math.ceil((selectedQuestions.length * 30) / 60))}
                                    className="text-xs text-pw-indigo font-bold hover:underline"
                                >
                                    Auto (30s/Q)
                                </button>
                            </div>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium"
                                min="1"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-2">
                                <span>Selected Questions:</span>
                                <span className="bg-pw-indigo text-white px-2 py-0.5 rounded-md">{selectedQuestions.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                                <span>Total Marks:</span>
                                <span>{selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateQuiz}
                            disabled={loading || selectedQuestions.length === 0}
                            className="w-full py-3 bg-pw-indigo text-white rounded-xl font-bold shadow-pw-indigo/20 hover:bg-pw-violet transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Publish Quiz'}
                        </button>
                    </div>

                    {/* Right Column: Question Selection */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Tabs */}
                        <div className="flex p-1 bg-white rounded-xl border border-pw-border w-fit mb-4">
                            <button
                                onClick={() => setCreationMode('manual')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${creationMode === 'manual' ? 'bg-pw-indigo text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <FaPlus className="inline mr-2" /> Create New
                            </button>
                            <button
                                onClick={() => setCreationMode('bank')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${creationMode === 'bank' ? 'bg-pw-indigo text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <FaSearch className="inline mr-2" /> Select from Bank
                            </button>
                        </div>

                        {creationMode === 'manual' ? (
                            <div className="bg-white p-6 rounded-3xl border border-pw-border shadow-sm space-y-4">
                                <h3 className="text-lg font-bold text-pw-violet">Add New Question</h3>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Question Text</label>
                                    <textarea
                                        value={mqText}
                                        onChange={(e) => setMqText(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/20 outline-none font-medium h-24"
                                        placeholder="Type your question here..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mqOptions.map((opt, idx) => (
                                        <div key={idx}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Option {String.fromCharCode(65 + idx)}</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="correctOption"
                                                    checked={mqCorrect === idx}
                                                    onChange={() => setMqCorrect(idx)}
                                                    className="w-4 h-4 text-pw-indigo focus:ring-pw-indigo"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...mqOptions];
                                                        newOpts[idx] = e.target.value;
                                                        setMqOptions(newOpts);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pw-indigo/20 outline-none"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Subject</label>
                                        <select
                                            value={mqSubject}
                                            onChange={(e) => setMqSubject(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none capitalize"
                                        >
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="Biology">Biology</option>
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                            <option value="History">History</option>
                                            <option value="Geography">Geography</option>
                                            <option value="Political Science">Political Science</option>
                                            <option value="Economics">Economics</option>
                                            <option value="Accountancy">Accountancy</option>
                                            <option value="Business Studies">Business Studies</option>
                                            <option value="Sanskrit">Sanskrit</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Marks</label>
                                        <input
                                            type="number"
                                            value={mqMarks}
                                            onChange={(e) => setMqMarks(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddManualQuestion}
                                    className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaPlus /> Add to Quiz
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white p-4 rounded-2xl border border-pw-border shadow-sm flex flex-wrap gap-4">
                                    <div className="flex-1 min-w-[200px] relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search questions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pw-indigo/20"
                                        />
                                    </div>

                                    {/* Board Filter Removed from here as it relies on Quiz Settings now */}
                                    {/* Subject Filter kept for narrowing down */}
                                    <select
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value)}
                                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none capitalize"
                                    >
                                        <option value="all">All Subjects</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Biology">Biology</option>
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="History">History</option>
                                        <option value="Geography">Geography</option>
                                        <option value="Political Science">Political Science</option>
                                        <option value="Economics">Economics</option>
                                        <option value="Accountancy">Accountancy</option>
                                        <option value="Business Studies">Business Studies</option>
                                        <option value="Sanskrit">Sanskrit</option>
                                    </select>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {availableQuestions
                                        .filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(q => {
                                            const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => handleToggleQuestion(q)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${isSelected ? 'bg-pw-indigo/5 border-pw-indigo shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex gap-2 mb-1">
                                                                <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{q.board}</span>
                                                                <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{q.subject}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{q.question}</p>
                                                            {/* Show Options */}
                                                            {/* Show Options - Enhanced Display */}
                                                            {q.options && q.options.length > 0 ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                                                    {q.options.map((opt, idx) => (
                                                                        <div key={idx} className={`text-xs px-3 py-2 rounded-lg border flex items-start gap-2 ${q.correctAnswer === idx ? 'bg-green-50 border-green-200 text-green-800 font-bold shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                                                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${q.correctAnswer === idx ? 'border-green-300 bg-white' : 'border-gray-300 bg-white'}`}>
                                                                                {String.fromCharCode(65 + idx)}
                                                                            </span>
                                                                            <span>{opt}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="mt-2 text-xs text-red-400 italic">No options available for this question</div>
                                                            )}
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-pw-indigo border-pw-indigo text-white' : 'border-gray-200 text-transparent'}`}>
                                                            <FaCheck className="text-xs" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </>
                        )}

                        {/* List of MANUALLY Added Questions (Always Visible if any) to allow remove? 
                            Actually the "Selected Questions" count on the left acts as the cart.
                            Maybe we should show a list of selected questions somewhere?
                            For now, relying on the "Selection List" in the 'Bank' mode is enough, but for manual ones,
                            user needs to see what they added.
                            I'll add a "Selected Questions Review" section below.
                        */}
                        {selectedQuestions.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="font-bold text-gray-700 mb-4">Selected Questions ({selectedQuestions.length})</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {selectedQuestions.map((q, i) => (
                                        <div key={q.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex-1 truncate pr-4">
                                                <span className="text-xs font-bold text-pw-indigo mr-2">Q{i + 1}</span>
                                                <span className="text-sm text-gray-600 font-medium">{q.question}</span>
                                                {/* Options in Selected List for Verification */}
                                                {q.options && q.options.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 ml-8">
                                                        {q.options.map((opt, idx) => (
                                                            <div key={idx} className={`text-[10px] px-2 py-1 rounded border ${q.correctAnswer === idx ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                                                <span className="opacity-50 mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setSelectedQuestions(prev => prev.filter(sq => sq.id !== q.id))}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                            >
                                                <FaMinusCircle />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
