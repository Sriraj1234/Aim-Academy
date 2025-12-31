import { NextRequest, NextResponse } from 'next/server';

interface AdaptiveRequest {
    recentScores: number[]; // Array of recent quiz scores (0-100)
    currentDifficulty?: 'easy' | 'medium' | 'hard';
    totalQuizzes?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: AdaptiveRequest = await request.json();
        const { recentScores = [], currentDifficulty = 'medium' } = body;

        if (recentScores.length === 0) {
            return NextResponse.json({
                success: true,
                recommendedDifficulty: 'medium',
                reason: 'No quiz history - starting at medium difficulty',
                confidence: 0.5
            });
        }

        // Calculate average of recent scores
        const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

        // Calculate trend (are they improving?)
        let trend = 0;
        if (recentScores.length >= 3) {
            const recentHalf = recentScores.slice(-Math.floor(recentScores.length / 2));
            const olderHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
            const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
            const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
            trend = recentAvg - olderAvg;
        }

        // Adaptive logic
        let recommendedDifficulty: 'easy' | 'medium' | 'hard' = currentDifficulty;
        let reason = '';
        let confidence = 0.7;

        if (avgScore >= 80) {
            // Student is doing very well
            if (currentDifficulty === 'easy') {
                recommendedDifficulty = 'medium';
                reason = 'Great scores! Time to level up to medium difficulty 🚀';
            } else if (currentDifficulty === 'medium' && trend >= 5) {
                recommendedDifficulty = 'hard';
                reason = 'You are on fire! Ready for harder challenges 🔥';
                confidence = 0.8;
            } else if (currentDifficulty === 'hard') {
                recommendedDifficulty = 'hard';
                reason = 'Excellent! Keep crushing it at the highest level 👑';
            }
        } else if (avgScore >= 60) {
            // Student is doing okay
            if (currentDifficulty === 'hard' && trend < -10) {
                recommendedDifficulty = 'medium';
                reason = 'Let\'s consolidate your learning at medium difficulty 📚';
                confidence = 0.75;
            } else {
                recommendedDifficulty = 'medium';
                reason = 'Good progress! Keep practicing at this level 💪';
            }
        } else if (avgScore >= 40) {
            // Student is struggling a bit
            if (currentDifficulty !== 'easy') {
                recommendedDifficulty = 'easy';
                reason = 'Let\'s build your foundation with easier questions first 🌱';
                confidence = 0.85;
            } else {
                recommendedDifficulty = 'easy';
                reason = 'Keep practicing! You are learning 📖';
            }
        } else {
            // Student needs more practice
            recommendedDifficulty = 'easy';
            reason = 'Focus on basics first. Every expert was once a beginner! ✨';
            confidence = 0.9;
        }

        // Consider consistency
        const consistency = calculateConsistency(recentScores);

        return NextResponse.json({
            success: true,
            recommendedDifficulty,
            reason,
            confidence,
            stats: {
                averageScore: Math.round(avgScore),
                trend: trend > 5 ? 'improving' : trend < -5 ? 'needs-practice' : 'stable',
                consistency: consistency > 70 ? 'consistent' : 'variable',
                quizzesAnalyzed: recentScores.length
            }
        });
    } catch (error) {
        console.error('Adaptive API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate difficulty' },
            { status: 500 }
        );
    }
}

function calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 100;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (100 = perfectly consistent)
    const consistency = Math.max(0, 100 - stdDev);
    return Math.round(consistency);
}
