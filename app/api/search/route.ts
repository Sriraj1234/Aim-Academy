import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { query, type = 'text' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[Search API] ${type === 'image' ? 'Image' : 'Text'} search for: ${query}`);

        // Helper function to run the script
        const runScraper = () => new Promise<any>((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'scripts', 'scrape.cjs');
            execFile('node', [scriptPath, query, type], (error, stdout, stderr) => {
                if (error) {
                    console.error("Scraper Error:", stderr);
                    reject(error);
                    return;
                }
                try {
                    const data = JSON.parse(stdout);
                    resolve(data);
                } catch (parseError) {
                    console.error("JSON Parse Error:", stdout);
                    reject(parseError);
                }
            });
        });

        // Run the isolated scraper
        let rawResults: any[] = [];
        try {
            rawResults = await runScraper();
        } catch (e: any) {
            console.error("Failed to run scraper:", e);
            // Fallback to empty if script fails
            rawResults = [];
        }

        if (type === 'image') {
            if (rawResults && rawResults.length > 0) {
                // Map to consistent format
                const images = rawResults.map((r: any) => ({
                    title: r.title || "Image",
                    image: r.url,
                    thumbnail: r.thumbnail || r.url,
                    url: r.url
                }));
                return NextResponse.json({ results: images });
            } else {
                return NextResponse.json({ results: [] });
            }

        } else {
            // Text Search Fallback (Using Image Meta)
            if (rawResults && rawResults.length > 0) {
                const snippets = rawResults.map((r: any) => {
                    let hostname = "";
                    try { hostname = new URL(r.originalUrl).hostname; } catch (e) { }

                    return {
                        title: r.title,
                        description: `Source: ${hostname} (Visual Match)`, // Mock description
                        url: r.originalUrl,
                    };
                });
                return NextResponse.json({ results: snippets });
            } else {
                return NextResponse.json({ results: [] });
            }
        }

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch search results" }, { status: 500 });
    }
}
