import { GOOGLE_IMG_SCRAP } from 'google-img-scrap';

// -------------------------------------------------------
// DuckDuckGo Search — Two-layer strategy:
// Layer 1: Instant Answer API (fast, good for famous topics)
// Layer 2: HTML scraping (good for live prices, current affairs, news)
// -------------------------------------------------------

export async function performWebSearch(query: string): Promise<any[]> {
    try {
        // Layer 1: DuckDuckGo Instant Answer API
        const results = await fetchDDGInstantAnswer(query);

        // Layer 2: If Instant Answer returned nothing useful, fall back to HTML scrape
        if (results.length === 0) {
            const scraped = await fetchDDGHTMLSearch(query);
            return scraped;
        }

        return results;
    } catch (error) {
        console.error('Web Search Error:', error);
        // Final fallback: try HTML if instant failed
        try {
            return await fetchDDGHTMLSearch(query);
        } catch {
            return [];
        }
    }
}

async function fetchDDGInstantAnswer(query: string): Promise<any[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIM-Academy-StudyBot/2.0)' }
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

    return results;
}

async function fetchDDGHTMLSearch(query: string): Promise<any[]> {
    try {
        // DuckDuckGo HTML search (lite version — server-safe, no JS needed)
        const encodedQuery = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) return [];

        const html = await response.text();

        // Extract search results from HTML
        const results: any[] = [];

        // Match DDG HTML result blocks
        const resultBlocks = html.match(/<div class="result[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || [];

        for (const block of resultBlocks.slice(0, 5)) {
            // Extract title
            const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

            // Extract snippet/description
            const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
            const description = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

            // Extract URL
            const urlMatch = block.match(/uddg=([^&"]+)/);
            const url = urlMatch ? decodeURIComponent(urlMatch[1]) : '';

            if (title && description) {
                results.push({
                    title,
                    description,
                    url,
                    source: url ? new URL(url).hostname.replace('www.', '') : 'DuckDuckGo'
                });
            }
        }

        return results;
    } catch (error) {
        console.error('DDG HTML Search Error:', error);
        return [];
    }
}

export async function performImageSearch(query: string): Promise<any[]> {
    try {
        const result = await GOOGLE_IMG_SCRAP({
            search: query,
            limit: 10,
            safeSearch: true,
            excludeDomains: ["stock.adobe.com", "shutterstock.com", "alamy.com", "istockphoto.com"]
        });

        if (result && result.result) {
            return result.result.map((r: any) => ({
                title: r.title || "Image",
                image: r.url,
                thumbnail: r.thumbnail || r.url,
                url: r.url
            }));
        }
        return [];
    } catch (error) {
        console.error('Image Search Error:', error);
        return [];
    }
}
