import { GOOGLE_IMG_SCRAP } from 'google-img-scrap';

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

        return results;
    } catch (error) {
        console.error('Web Search Error:', error);
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
