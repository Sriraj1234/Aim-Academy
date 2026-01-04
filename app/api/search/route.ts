/**
 * Web Search API with DuckDuckGo Instant Answers + Google Images
 * 
 * Handles:
 * - Text Search: DuckDuckGo Instant Answer API (free, no key needed)
 * - Image Search: Google Image Scraping (existing functionality)
 */

import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

// DuckDuckGo Instant Answer API (free, returns Wikipedia-like summaries)
async function searchDuckDuckGo(query: string) {
    try {
        // Use DuckDuckGo Instant Answer API
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AIM-Academy-StudyBot/1.0'
            }
        });

        if (!response.ok) {
            console.error('[DDG] Response not OK:', response.status);
            return [];
        }

        const data = await response.json();
        const results: any[] = [];

        // Extract Abstract (main answer)
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                description: data.AbstractText,
                url: data.AbstractURL || '',
                source: data.AbstractSource || 'DuckDuckGo'
            });
        }

        // Extract Answer (direct answer for factual queries)
        if (data.Answer) {
            results.push({
                title: 'Direct Answer',
                description: data.Answer,
                url: '',
                source: 'DuckDuckGo Instant'
            });
        }

        // Extract Related Topics for more context
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
                if (topic.Text && !topic.Topics) { // Skip nested topic groups
                    results.push({
                        title: topic.FirstURL?.split('/').pop()?.replace(/_/g, ' ') || 'Related',
                        description: topic.Text,
                        url: topic.FirstURL || '',
                        source: 'Wikipedia'
                    });
                }
            }
        }

        console.log(`[DDG] Found ${results.length} results for: ${query}`);
        return results;

    } catch (error: any) {
        console.error('[DDG] Search Error:', error.message);
        return [];
    }
}

// Fallback: Scrape Google (existing script)
async function scrapeGoogle(query: string, type: string) {
    return new Promise<any[]>((resolve) => {
        const scriptPath = path.join(process.cwd(), 'scripts', 'scrape.cjs');
        execFile('node', [scriptPath, query, type], { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('[Scraper] Error:', stderr);
                resolve([]);
                return;
            }
            try {
                const data = JSON.parse(stdout);
                resolve(data || []);
            } catch (parseError) {
                console.error('[Scraper] Parse Error:', stdout);
                resolve([]);
            }
        });
    });
}

export async function POST(req: Request) {
    try {
        const { query, type = 'text' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[Search API] ${type === 'image' ? 'Image' : 'Text'} search for: ${query}`);

        if (type === 'image') {
            // Use Google Image Scraper for images
            const rawResults = await scrapeGoogle(query, 'image');

            if (rawResults && rawResults.length > 0) {
                const images = rawResults.map((r: any) => ({
                    title: r.title || "Image",
                    image: r.url,
                    thumbnail: r.thumbnail || r.url,
                    url: r.url
                }));
                return NextResponse.json({ results: images });
            }
            return NextResponse.json({ results: [] });

        } else {
            // Use DuckDuckGo for text search
            const ddgResults = await searchDuckDuckGo(query);

            if (ddgResults.length > 0) {
                return NextResponse.json({ results: ddgResults });
            }

            // Fallback: Try Google scraper as last resort
            console.log('[Search API] DDG returned empty, trying scraper fallback...');
            const scraperResults = await scrapeGoogle(query, 'text');

            if (scraperResults && scraperResults.length > 0) {
                const snippets = scraperResults.map((r: any) => ({
                    title: r.title || 'Result',
                    description: `Source: ${r.originalUrl || 'Web'}`,
                    url: r.originalUrl || '',
                    source: 'Google'
                }));
                return NextResponse.json({ results: snippets });
            }

            return NextResponse.json({ results: [] });
        }

    } catch (error: any) {
        console.error("[Search API] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch search results" }, { status: 500 });
    }
}
