import { UserProfile } from '@/data/types';

export const GEMINI_LIVE_CONFIG = {
    model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
    audio: {
        inputSampleRate: 16000,
        outputSampleRate: 24000,
        inputChannels: 1,
    }
};

// Simple system instruction
const BASE_INSTRUCTION = `You are a female helpful AI assistant.`;

//Build prompt - simplified, just returns base instruction
export function buildPersonalizedPrompt(userProfile?: UserProfile | null): string {
    return BASE_INSTRUCTION;
}

// Legacy export
export { BASE_INSTRUCTION as systemInstruction };
