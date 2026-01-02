import { NextResponse } from 'next/server';
import google from 'googlethis';

export async function POST(req: Request) {
    try {
        const { query, type = 'text' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const options = {
            safe: true,
            additional_params: {
                hl: 'en'
            }
        };

        if (type === 'image') {
            const results = await google.image(query, options);

            // Map googlethis results to our format
            const images = results.map((r: any) => ({
                title: r.origin?.title || "Image",
                image: r.url,
                thumbnail: r.url, // googlethis might not give separate thumb
                url: r.url
            })).slice(0, 10);

            return NextResponse.json({ results: images });

        } else {
            // Text Search
            const response = await google.search(query, options);

            // response.results is the array
            const snippets = response.results.map((r: any) => ({
                title: r.title,
                description: r.description,
                url: r.url,
            })).slice(0, 5);

            return NextResponse.json({ results: snippets });
        }

    } catch (error: any) {
        console.error("Search API Error:", error);
        // Fallback or just return error
        return NextResponse.json({ error: error.message || "Failed to fetch search results" }, { status: 500 });
    }
}
