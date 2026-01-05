import { execFile } from 'child_process';
import path from 'path';

// DuckDuckGo Instant Answer API
export async function performWebSearch(query: string): Promise<any[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(url, {
            headers: { 'User-Agent': 'AIM-Academy-StudyBot/1.0' }
        });

        if (!response.ok) return [];

        const data = await response.json();
        const results: any[] = [];

        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                description: data.AbstractText,
                url: data.AbstractURL || '',
                source: data.AbstractSource || 'DuckDuckGo'
            });
        }

        if (data.Answer) {
            results.push({
                title: 'Direct Answer',
                description: data.Answer,
                url: '',
                source: 'DuckDuckGo Instant'
            });
        }

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
                if (topic.Text && !topic.Topics) {
                    results.push({
                        title: topic.FirstURL?.split('/').pop()?.replace(/_/g, ' ') || 'Related',
                        description: topic.Text,
                        url: topic.FirstURL || '',
                        source: 'Wikipedia'
                    });
                }
            }
        }

        // If DDG empty, try scraper
        if (results.length === 0) {
            const scraperResults = await scrapeGoogle(query, 'text');
            if (scraperResults && scraperResults.length > 0) {
                return scraperResults.map((r: any) => ({
                    title: r.title || 'Result',
                    description: `Source: ${r.originalUrl || 'Web'}`,
                    url: r.originalUrl || '',
                    source: 'Google'
                }));
            }
        }

        return results;
    } catch (error) {
        console.error('Web Search Error:', error);
        return [];
    }
}

// Google Image Scraper Helper
async function scrapeGoogle(query: string, type: string): Promise<any[]> {
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
                resolve([]);
            }
        });
    });
}

export async function performImageSearch(query: string): Promise<any[]> {
    const rawResults = await scrapeGoogle(query, 'image');
    if (rawResults && rawResults.length > 0) {
        return rawResults.map((r: any) => ({
            title: r.title || "Image",
            image: r.url,
            thumbnail: r.thumbnail || r.url,
            url: r.url
        }));
    }
    return [];
}
