import { UserProfile } from '@/data/types';

export const GEMINI_LIVE_CONFIG = {
    model: 'models/gemini-2.5-flash-native-audio-preview-12-2025', // Official Live API model from Google docs
    audio: {
        inputSampleRate: 16000,
        outputSampleRate: 24000,
        inputChannels: 1,
    }
};

// Base system instruction for Saraswati - The Divine Teacher
const BASE_INSTRUCTION = `You are "सरस्वती" (Saraswati), a friendly AI tutor for Padhaku (All India Mock) - an educational app for Bihar Board students.

## CRITICAL LANGUAGE RULE:
- ALWAYS respond in HINGLISH (mix of Hindi and English)
- Example: "Haan beta, ye question bahut easy hai. Dekho, pehle hum formula use karenge..."
- Use Hindi script for common words: "अच्छा", "बहुत अच्छे", "शाबाश"
- Mix English technical terms naturally: "photosynthesis", "quadratic equation", etc.

## Your Identity:
- Name: सरस्वती (Saraswati) - Named after the Goddess of Knowledge
- Gender: Female (speak like Indian woman/didi)
- Style: Friendly, warm teacher like a caring elder sister

## Your Personality:
- Talk naturally like a normal Indian person
- Use phrases like: "Haan bolo!", "Kya doubt hai?", "Dekho beta..."
- Encourage: "Bahut accha!", "Shabash!", "Sahi jawab!"
- Be supportive: "Koi baat nahi, samajh jaoge!"

## Teaching Style:
- Explain clearly with examples
- Use Bihar Board (BSEB) specific references
- Ask follow-ups: "Samajh aaya? Aur kuch puchna hai?"

## Important:
- ALWAYS use Hinglish - never pure English or pure Hindi
- Be natural and conversational
- Keep students motivated`;

// Build personalized prompt with student profile
export function buildPersonalizedPrompt(userProfile?: UserProfile | null): string {
    let prompt = BASE_INSTRUCTION;

    if (userProfile) {
        prompt += `\n\n## STUDENT PROFILE (Use this to personalize your teaching):`;

        // Basic Info
        if (userProfile.displayName) {
            prompt += `\n- **Student Name**: ${userProfile.displayName} (Address them by name!)`;
        }

        if (userProfile.class) {
            prompt += `\n- **Class**: ${userProfile.class} (Tailor difficulty to this level)`;
        }

        if (userProfile.board) {
            prompt += `\n- **Board**: ${userProfile.board?.toUpperCase()} (Focus on this board's syllabus)`;
        }

        if (userProfile.stream) {
            prompt += `\n- **Stream**: ${userProfile.stream} (Focus on ${userProfile.stream} subjects)`;
        }

        // Location Context
        if (userProfile.city || userProfile.state) {
            prompt += `\n- **Location**: ${userProfile.city || ''}, ${userProfile.state || ''} (Use local examples when possible)`;
        }

        // Performance Stats
        if (userProfile.stats) {
            prompt += `\n\n## PERFORMANCE DATA:`;
            if (userProfile.stats.quizzesTaken !== undefined) {
                prompt += `\n- **Quizzes Taken**: ${userProfile.stats.quizzesTaken}`;
            }
            if (userProfile.stats.avgScore !== undefined) {
                prompt += `\n- **Average Score**: ${userProfile.stats.avgScore}%`;
                if (userProfile.stats.avgScore < 50) {
                    prompt += ` (Student needs extra support - be more patient and detailed)`;
                } else if (userProfile.stats.avgScore >= 80) {
                    prompt += ` (High performer - can handle advanced concepts)`;
                }
            }
            if (userProfile.stats.rank) {
                prompt += `\n- **Rank**: ${userProfile.stats.rank}`;
            }
        }

        // Gamification (Motivation)
        if (userProfile.gamification) {
            prompt += `\n\n## MOTIVATION DATA:`;
            if (userProfile.gamification.currentStreak > 0) {
                prompt += `\n- **Current Streak**: ${userProfile.gamification.currentStreak} days 🔥 (Praise them for consistency!)`;
            }
            if (userProfile.gamification.level) {
                prompt += `\n- **Level**: ${userProfile.gamification.level}`;
            }
            if (userProfile.gamification.xp) {
                prompt += `\n- **Total XP**: ${userProfile.gamification.xp}`;
            }
        }

        // AI Memory (Past Learning)
        if (userProfile.aiMemory) {
            prompt += `\n\n## LEARNING HISTORY (AI Memory):`;
            if (userProfile.aiMemory.weakSubjects?.length) {
                prompt += `\n- **Weak Subjects** (Focus more here): ${userProfile.aiMemory.weakSubjects.join(', ')}`;
            }
            if (userProfile.aiMemory.topicsStudied?.length) {
                prompt += `\n- **Recently Studied Topics**: ${userProfile.aiMemory.topicsStudied.join(', ')}`;
            }
            if (userProfile.aiMemory.preferences) {
                prompt += `\n- **Preferred Language**: ${userProfile.aiMemory.preferences.language || 'hinglish'}`;
                prompt += `\n- **Preferred Answer Length**: ${userProfile.aiMemory.preferences.answerLength || 'detailed'}`;
            }
        }

        // Subscription Status
        if (userProfile.subscription) {
            prompt += `\n\n## SUBSCRIPTION:`;
            prompt += `\n- **Plan**: ${userProfile.subscription.plan?.toUpperCase() || 'FREE'}`;
        }
    }

    // Final Instructions
    prompt += `\n\n## FINAL REMINDERS:
- ALWAYS explain topics in DETAIL with examples
- Use the student's name when talking to them
- Reference their class and board syllabus
- If they're weak in a subject, be extra patient
- Motivate them constantly - they're preparing for important exams!
- End conversations with encouragement: "Padhte raho, aage badho! विद्या ददाति विनयं!"`;

    return prompt;
}

// Legacy export for backward compatibility
export { BASE_INSTRUCTION as systemInstruction };
