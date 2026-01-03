export interface WisdomShlok {
    id: string;
    chapter: number;
    verse: number;
    sanskrit: string;
    hindiMeaning: string;
    englishMeaning: string;
    studentInsight: string;
    audioUrl?: string; // Optional for now
    order: number;
    themes: string[]; // e.g. "Focus", "Discipline"
}
