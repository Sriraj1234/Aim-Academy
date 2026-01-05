/**
 * Web Search API with DuckDuckGo Instant Answers + Google Images
 * Refactored to use lib/search.ts
 */

import { NextResponse } from 'next/server';
import { performWebSearch, performImageSearch } from '@/lib/search';

export async function POST(req: Request) {
    try {
        const { query, type = 'text' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[Search API] ${type === 'image' ? 'Image' : 'Text'} search for: ${query}`);

        if (type === 'image') {
            const results = await performImageSearch(query);
            return NextResponse.json({ results });
        } else {
            const results = await performWebSearch(query);
            return NextResponse.json({ results });
        }

    } catch (error: any) {
        console.error("[Search API] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch search results" }, { status: 500 });
    }
}

