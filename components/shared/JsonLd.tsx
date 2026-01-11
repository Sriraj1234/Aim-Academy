import Script from 'next/script'

export const JsonLd = () => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Padhaku',
        url: 'https://padhaku.co.in',
        description: 'Best learning app for Bihar Board Class 10 & 12 students. Free objective tests, viral questions, and live quizzes.',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
        },
        author: {
            '@type': 'Organization',
            name: 'Padhaku Team',
            url: 'https://padhaku.co.in',
        },
    }

    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            strategy="afterInteractive"
        />
    )
}
