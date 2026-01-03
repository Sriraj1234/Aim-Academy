import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
        return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    try {
        // Extract video ID from the URL - NOW SUPPORTS /live/
        const videoIdMatch = videoUrl.match(/(?:v=|\/embed\/|\/live\/|\.be\/)([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch || !videoIdMatch[1]) {
            return NextResponse.json({ error: 'Invalid YouTube video URL' }, { status: 400 });
        }
        const videoId = videoIdMatch[1];

        // Use Internal No-Embed API logic if possible, but standard oEmbed doesn't give views.
        // We need to use slightly more advanced method or just page scraping for "views" if we want to avoid API key limits.
        // But for reliability, let's try a simple fetch of the page data or stick to basic metadata if we don't have API Key.
        // Wait, oEmbed endpoint DOES NOT return view count.
        // We have to inspect the video page or use Data API.
        // Since we don't have a YOUTUBE_API_KEY env var set up in this context (usually),
        // we can try a clever regex on the watch page HTML (lightweight scraping) OR just default to 0.

        // Actually, fetching the full HTML page is heavy.
        // Let's try to fetch the page metadata tags which often contain interactionCount.

        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const text = await res.text();

        // Extract Title
        const titleMatch = text.match(/<meta\s+name="title"\s+content="([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : null;

        // Extract Channel
        const authorMatch = text.match(/<link\s+itemprop="name"\s+content="([^"]+)"/);
        const channelName = authorMatch ? authorMatch[1] : null;

        // Extract View Count (careful scraping)
        // YouTube often stores this in 'interactionCount' text or similar schema
        const viewMatch = text.match(/<meta\s+itemprop="interactionCount"\s+content="(\d+)"/);
        const views = viewMatch ? parseInt(viewMatch[1]) : 0;

        // Fallback for Title/Channel via oEmbed if scraping fails (oEmbed is official JSON)
        let finalTitle = title;
        let finalChannel = channelName;
        let thumbnailUrl = null; // Initialize thumbnail URL

        if (!finalTitle || !finalChannel) {
            const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oEmbedRes.ok) {
                const oEmbed = await oEmbedRes.json() as any;
                if (!finalTitle) finalTitle = oEmbed.title;
                if (!finalChannel) finalChannel = oEmbed.author_name;
                thumbnailUrl = oEmbed.thumbnail_url; // Get thumbnail from oEmbed
            }
        }

        // If thumbnail wasn't found via oEmbed, construct a default one
        if (!thumbnailUrl) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }

        return NextResponse.json({
            title: finalTitle || 'Unknown Video',
            channelName: finalChannel || 'YouTube Channel',
            views: views, // This is the new field
            thumbnailUrl: thumbnailUrl
        });

    } catch (error) {
        console.error('YouTube Metadata Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
