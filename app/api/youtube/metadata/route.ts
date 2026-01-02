import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
        return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    try {
        // Use YouTube's official oEmbed endpoint (No API Key needed)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({
            title: data.title,
            channelName: data.author_name, // YouTube returns channel name as author_name
            thumbnailUrl: data.thumbnail_url
        });

    } catch (error) {
        console.error('YouTube Metadata Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
