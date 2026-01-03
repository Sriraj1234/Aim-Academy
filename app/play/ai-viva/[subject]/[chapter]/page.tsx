import VivaSession from '@/components/ai-viva/VivaSession';

interface PageProps {
    params: {
        subject: string;
        chapter: string;
    }
}

export default function VivaWrapperPage({ params }: PageProps) {
    // Decode URI components to handle spaces/special chars
    const subject = decodeURIComponent(params.subject);
    const chapter = decodeURIComponent(params.chapter);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-20">
            <VivaSession subject={subject} chapter={chapter} />
        </div>
    );
}
