
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface QuizResult {
    subject: string;
    chapter: string;
    score: number;
    total: number;
    date: string;
}

interface AnalyzeRequest {
    quizResults: QuizResult[];
    currentStreak: number;
    totalXP: number;
    level: number;
}

export async function POST(request: NextRequest) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured' },
                { status: 500 }
            );
        }

        const body: AnalyzeRequest = await request.json();

        if (!body.quizResults || body.quizResults.length === 0) {
            return NextResponse.json({
                success: true,
                insights: {
                    summary: 'Start taking quizzes to get personalized insights! 📚',
                    strengths: [],
                    weakAreas: [],
                    recommendations: ['Take your first quiz to get started'],
                    predictedImprovement: null
                }
            });
        }

        // Calculate statistics
        const subjectStats: Record<string, { correct: number; total: number; chapters: Set<string> }> = {};

        body.quizResults.forEach(result => {
            if (!subjectStats[result.subject]) {
                subjectStats[result.subject] = { correct: 0, total: 0, chapters: new Set() };
            }
            subjectStats[result.subject].correct += result.score;
            subjectStats[result.subject].total += result.total;
            subjectStats[result.subject].chapters.add(result.chapter);
        });

        // Find strengths and weaknesses
        const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
            subject,
            accuracy: Math.round((stats.correct / stats.total) * 100),
            questionsAttempted: stats.total,
            chapters: Array.from(stats.chapters)
        }));

        subjectPerformance.sort((a, b) => b.accuracy - a.accuracy);

        const strengths = subjectPerformance.filter(s => s.accuracy >= 70).slice(0, 3);
        const weakAreas = subjectPerformance.filter(s => s.accuracy < 60).slice(0, 3);

        // Build prompt for AI
        const dataForAI = {
            totalQuizzes: body.quizResults.length,
            overallAccuracy: Math.round(
                (body.quizResults.reduce((acc, r) => acc + r.score, 0) /
                    body.quizResults.reduce((acc, r) => acc + r.total, 0)) * 100
            ),
            streak: body.currentStreak,
            level: body.level,
            xp: body.totalXP,
            subjectPerformance: subjectPerformance.slice(0, 5),
            strengths: strengths.map(s => s.subject),
            weakAreas: weakAreas.map(s => `${s.subject} (${s.accuracy}%)`)
        };

        const systemPrompt = `You are an AI study coach for Indian students. Analyze their quiz performance and give brief, actionable insights.
Keep your response in this exact JSON format:
{
    "summary": "One sentence summarizing their performance in Hinglish",
    "tip": "One specific study tip based on their weak areas",
    "motivation": "One short motivational message with emoji"
}
Be concise! Each field should be 1 short sentence max.`;

        const userPrompt = `Student's quiz performance data:
- Total quizzes: ${dataForAI.totalQuizzes}
- Overall accuracy: ${dataForAI.overallAccuracy}%
- Current streak: ${dataForAI.streak} days
- Level: ${dataForAI.level}
- Strong subjects: ${dataForAI.strengths.join(', ') || 'None identified yet'}
- Weak subjects: ${dataForAI.weakAreas.join(', ') || 'None identified yet'}

Analyze and respond in JSON format only.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            throw new Error('AI API error');
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || '';

        // Parse AI response
        let aiInsights = { summary: '', tip: '', motivation: '' };
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiInsights = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Use defaults if parsing fails
            aiInsights = {
                summary: `${dataForAI.overallAccuracy}% accuracy across ${dataForAI.totalQuizzes} quizzes!`,
                tip: weakAreas.length > 0 ? `Focus on ${weakAreas[0].subject} - practice daily!` : 'Keep up the good work!',
                motivation: 'You are doing great! Keep practicing! 💪'
            };
        }

        return NextResponse.json({
            success: true,
            insights: {
                ...aiInsights,
                strengths: strengths.map(s => ({ subject: s.subject, accuracy: s.accuracy })),
                weakAreas: weakAreas.map(s => ({ subject: s.subject, accuracy: s.accuracy })),
                stats: {
                    totalQuizzes: dataForAI.totalQuizzes,
                    overallAccuracy: dataForAI.overallAccuracy,
                    streak: dataForAI.streak,
                    level: dataForAI.level
                }
            }
        });
    } catch (error) {
        console.error('Analyze API error:', error);
        return NextResponse.json(
            { success: false, error: 'Analysis failed' },
            { status: 500 }
        );
    }
}
