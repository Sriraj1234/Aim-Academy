import { NextResponse } from 'next/server';
import { WisdomShlok } from '@/types/wisdom';

// Mock Data for Initial Development
const MOCK_SHLOKS: WisdomShlok[] = [
    {
        id: '1',
        chapter: 2,
        verse: 47,
        sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
        hindiMeaning: 'तेरा कर्म करने में ही अधिकार है, उसके फलों में कभी नहीं। इसलिए तू कर्मों के फल का हेतु मत हो तथा तेरी कर्म न करने में भी आसक्ति न हो।',
        englishMeaning: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.',
        studentInsight: 'Focus solely on your studies and preparation (Karma), not on the exam result (Phala). Worrying about marks creates anxiety; working hard creates confidence.',
        order: 1,
        themes: ['Karma', 'Focus', 'Anxiety']
    },
    {
        id: '2',
        chapter: 2,
        verse: 3,
        sanskrit: 'क्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते।\nक्षुद्रं हृदयदौर्बल्यं त्यक्त्वोत्तिष्ठ परन्तप॥',
        hindiMeaning: 'हे पार्थ! नपुंसकता को मत प्राप्त हो; तुझमें यह उचित नहीं जान पड़ती। हे परन्तप! हृदय की तुच्छ दुर्बलता को त्यागकर युद्ध के लिए खड़ा हो जा।',
        englishMeaning: 'O son of Pritha, do not yield to this degrading impotence. It does not become you. Give up such petty weakness of heart and arise, O chastiser of the enemy.',
        studentInsight: 'When you feel weak, lazy, or afraid of a subject, remember your potential. Shake off the "I can\'t do it" mindset. Stand up and face the challenge!',
        order: 2,
        themes: ['Courage', 'Laziness', 'Action']
    },
    {
        id: '3',
        chapter: 6,
        verse: 5,
        sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
        hindiMeaning: 'अपने द्वारा अपना संसार-समुद्र से उद्धार करे और अपने को अधोगति में न डाले; क्योंकि यह मनुष्य आप ही तो अपना मित्र है और आप ही अपना शत्रु है।',
        englishMeaning: 'One must deliver himself with the help of his mind, and not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.',
        studentInsight: 'You are your own best friend or worst enemy. If you control your mind and minimize distractions, you win. If you let it control you (reels, games), you lose.',
        order: 3,
        themes: ['Self-Control', 'Mindset', 'Distraction']
    }
];

export async function GET() {
    // TODO: Fetch from Firestore 'wisdom_shloks' collection
    // const snapshot = await db.collection('wisdom_shloks').orderBy('order').get();
    // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(MOCK_SHLOKS);
}
