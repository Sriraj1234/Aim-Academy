import Script from 'next/script'

export const JsonLd = () => {
    const baseUrl = 'https://padhaku.co.in';

    // 1. WebApplication schema
    const webApp = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Padhaku',
        url: baseUrl,
        description: 'Free Bihar Board online test app for Class 10 & 12. Practice BSEB objective questions, viral MCQs, model paper tests, and live quizzes.',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        inLanguage: ['hi', 'en'],
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            description: 'Free Bihar Board MCQ practice for Class 10 and Class 12 students'
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '2400',
            bestRating: '5'
        },
        author: {
            '@type': 'Organization',
            name: 'Padhaku Team',
            url: baseUrl,
        },
    };

    // 2. Organization schema
    const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Padhaku',
        url: baseUrl,
        logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/padhaku-512.png`,
            width: 512,
            height: 512
        },
        description: 'Bihar Board Class 10 and Class 12 free online test and MCQ practice platform.',
        foundingDate: '2024',
        areaServed: {
            '@type': 'State',
            name: 'Bihar',
            containedInPlace: {
                '@type': 'Country',
                name: 'India'
            }
        },
        knowsAbout: [
            'BSEB', 'Bihar Board', 'Class 10 MCQ', 'Class 12 MCQ',
            'Bihar Board Matric', 'Bihar Board Inter', 'Online Education'
        ]
    };

    // 3. FAQPage schema — triggers rich snippets in Google Search
    const faqPage = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Padhaku app kya hai?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Padhaku Bihar Board Class 10 aur Class 12 ke students ke liye ek free online test aur MCQ practice app hai. Isme BSEB syllabus ke chapter-wise objective questions, viral questions, live quizzes, aur AI study assistant milta hai.'
                }
            },
            {
                '@type': 'Question',
                name: 'Kya Padhaku Bihar Board students ke liye free hai?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Haan! Padhaku bilkul free hai. Aap bina koi payment ke objective questions practice kar sakte hain, model paper solve kar sakte hain, aur live quiz mein participate kar sakte hain.'
                }
            },
            {
                '@type': 'Question',
                name: 'Bihar Board Class 10 ke liye kaunse subjects available hain?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Padhaku par Class 10 ke liye Science, Mathematics, Social Science, Hindi, aur English ke chapter-wise MCQ available hain — poora BSEB Matric syllabus cover hota hai.'
                }
            },
            {
                '@type': 'Question',
                name: 'Bihar Board Class 12 Inter exam ke liye kya available hai?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Class 12 ke liye Physics, Chemistry, Biology, Mathematics, Hindi, aur English ke objective questions available hain. Inter exam 2025 ke liye specially curated viral aur important questions bhi milenge.'
                }
            },
            {
                '@type': 'Question',
                name: 'Kya Padhaku offline bhi kaam karta hai?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Haan! Ek baar open karne ke baad kai features offline bhi kaam karte hain. Padhaku ek Progressive Web App (PWA) hai jo Android aur iPhone dono par bina download ke chalti hai.'
                }
            },
            {
                '@type': 'Question',
                name: 'Bihar Board viral questions kahan milenge?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Padhaku par Bihar Board ke most important aur viral questions available hain jo previous years mein baar baar exam mein aaye hain. Yeh questions Class 10 aur Class 12 dono ke liye available hain.'
                }
            }
        ]
    };

    // 4. Course schema — education-specific rich cards
    const course = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Bihar Board Class 10 & 12 Online MCQ Practice',
        description: 'Free chapter-wise objective question practice for BSEB Matric and Inter exams. Covers Science, Math, Hindi, Social Science, English, Physics, Chemistry, Biology.',
        provider: {
            '@type': 'Organization',
            name: 'Padhaku',
            url: baseUrl
        },
        educationalLevel: 'Secondary Education',
        teaches: 'Bihar Board BSEB Class 10 and Class 12 Exam Preparation',
        inLanguage: ['hi', 'en'],
        isAccessibleForFree: true,
        url: baseUrl,
        hasCourseInstance: [
            { '@type': 'CourseInstance', courseMode: 'online', name: 'BSEB Matric Class 10 MCQ', educationalLevel: 'Class 10' },
            { '@type': 'CourseInstance', courseMode: 'online', name: 'BSEB Inter Class 12 MCQ', educationalLevel: 'Class 12' }
        ]
    };

    // 5. BreadcrumbList
    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
            { '@type': 'ListItem', position: 2, name: 'Bihar Board Online Test', item: `${baseUrl}/play/quiz` },
            { '@type': 'ListItem', position: 3, name: 'Study Hub', item: `${baseUrl}/study-hub` }
        ]
    };

    const allSchemas = [webApp, organization, faqPage, course, breadcrumb];

    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }}
            strategy="beforeInteractive"
        />
    )
}
