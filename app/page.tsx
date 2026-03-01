// ✅ SERVER COMPONENT — no 'use client'. Google Bot can crawl the full HTML.
import Link from 'next/link'
import Image from 'next/image'
import { ClientRedirect } from '@/components/shared/ClientRedirect'
import { Footer } from '@/components/shared/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Padhaku — Free Bihar Board Online Test for Class 10 & 12 | BSEB MCQ 2025',
  description:
    'Padhaku is Bihar\'s #1 free online test app for Class 10 & 12. Practice BSEB objective questions, viral questions, model paper MCQs, and live quiz battles. Trusted by 10,000+ Bihar Board students.',
  keywords: [
    'Bihar Board online test', 'BSEB Class 10 MCQ', 'BSEB Class 12 MCQ',
    'Bihar Board objective questions 2025', 'Matric exam online test',
    'Inter exam practice', 'Bihar Board viral questions', 'BSEB model paper 2025',
    'Padhaku app', 'Bihar Board preparation app', 'Class 10 science MCQ Bihar Board',
    'Class 12 math MCQ Bihar Board', 'Bihar Board free test', 'BSEB online practice'
  ],
  alternates: {
    canonical: 'https://padhaku.co.in',
  }
}

// ─── Static data (no network call needed) ────────────────────────────────────
const FEATURES = [
  {
    icon: '📝',
    title: 'Chapter-wise MCQ Tests',
    desc: 'Practice objective questions for every chapter of Bihar Board Class 10 & 12. Science, Math, Hindi, Social Science, English — all subjects covered.',
    keywords: 'Bihar Board MCQ objective questions chapter-wise'
  },
  {
    icon: '🔥',
    title: 'Viral & Important Questions',
    desc: 'Get access to the most viral and frequently asked questions from previous Bihar Board Matric and Inter exams. Updated every year.',
    keywords: 'Bihar Board viral questions important questions'
  },
  {
    icon: '⚔️',
    title: 'Live Competitive Quizzes',
    desc: 'Challenge your classmates in real-time live quizzes. See who scores the highest in your batch. Available for both Class 10 and Class 12.',
    keywords: 'live quiz Bihar Board students'
  },
  {
    icon: '🤖',
    title: 'AI-Powered Study Assistant',
    desc: 'Ask any doubt from your Bihar Board syllabus and get instant, detailed answers in Hindi or English. Works 24/7 — even at midnight before exams.',
    keywords: 'AI study help Bihar Board Hindi'
  },
  {
    icon: '📊',
    title: 'Performance Analytics',
    desc: 'Track your score, accuracy, and weak chapters. Padhaku shows you exactly where you need to study more to pass with flying colors.',
    keywords: 'Bihar Board score tracking performance'
  },
  {
    icon: '🏆',
    title: 'Leaderboard & Streaks',
    desc: 'Compete with thousands of Bihar Board students across the state. Maintain daily streaks and climb the leaderboard to become a topper.',
    keywords: 'Bihar Board topper student competition'
  },
]

const SUBJECTS = [
  { name: 'Science (विज्ञान)', class: '10', icon: '🔬', path: '/play/quiz?subject=science' },
  { name: 'Mathematics (गणित)', class: '10', icon: '📐', path: '/play/quiz?subject=math' },
  { name: 'Social Science (सामाजिक विज्ञान)', class: '10', icon: '🌍', path: '/play/quiz?subject=social-science' },
  { name: 'Hindi (हिन्दी)', class: '10&12', icon: '📖', path: '/play/quiz?subject=hindi' },
  { name: 'English (अंग्रेजी)', class: '10&12', icon: '🇬🇧', path: '/play/quiz?subject=english' },
  { name: 'Physics (भौतिकी)', class: '12', icon: '⚡', path: '/play/quiz?subject=physics' },
  { name: 'Chemistry (रसायन)', class: '12', icon: '🧪', path: '/play/quiz?subject=chemistry' },
  { name: 'Biology (जीव विज्ञान)', class: '12', icon: '🧬', path: '/play/quiz?subject=biology' },
]

const FAQS = [
  {
    q: 'Padhaku app kya hai?',
    a: 'Padhaku Bihar Board Class 10 aur Class 12 ke students ke liye ek free online test aur MCQ practice app hai. Isme BSEB syllabus ke chapter-wise objective questions, viral questions, live quizzes, aur AI study assistant milta hai.'
  },
  {
    q: 'Kya Padhaku Bihar Board students ke liye free hai?',
    a: 'Haan! Padhaku bilkul free hai. Aap bina koi payment ke objective questions practice kar sakte hain, model paper solve kar sakte hain, aur live quiz mein participate kar sakte hain.'
  },
  {
    q: 'Bihar Board Class 10 ke liye kaunse subjects available hain?',
    a: 'Padhaku par Class 10 ke liye Science, Mathematics, Social Science, Hindi, aur English ke chapter-wise MCQ available hain — poora BSEB Matric syllabus cover hota hai.'
  },
  {
    q: 'Bihar Board Class 12 ke liye kya available hai?',
    a: 'Class 12 ke liye Physics, Chemistry, Biology, Mathematics, Hindi, aur English ke objective questions available hain. Inter exam 2025 ke liye specially curated viral aur important questions bhi milenge.'
  },
  {
    q: 'Padhaku use karne ke liye phone mein kya chahiye?',
    a: 'Padhaku ek Progressive Web App (PWA) hai — kisi bhi Android ya iPhone browser mein chalti hai. Alag se koi download nahi karna. Direct padhaku.co.in par jaayein aur "Add to Home Screen" karein.'
  },
  {
    q: 'Kya Padhaku offline bhi kaam karta hai?',
    a: 'Haan! Ek baar open karne ke baad kai features offline bhi kaam karte hain. Aapka study data locally save hota hai taaki internet slow hone par bhi padhai jaari rahe.'
  },
]

const STATS = [
  { value: '10,000+', label: 'Active Students', icon: '👨‍🎓' },
  { value: '5 Lakh+', label: 'MCQs Solved', icon: '📝' },
  { value: '500+', label: 'Toppers Created', icon: '🏆' },
  { value: '24/7', label: 'AI Support', icon: '🤖' },
]

export default function LandingPage() {
  return (
    <>
      {/* Auth redirect — client-only, invisible to Google Bot */}
      <ClientRedirect />

      <div className="min-h-screen relative overflow-x-hidden bg-white flex flex-col font-sans">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-base font-black">P</span>
              </div>
              <div>
                <span className="text-xl font-black text-gray-900">Padhaku</span>
                <span className="hidden sm:inline text-xs text-indigo-500 font-bold ml-1.5 tracking-widest uppercase">Bihar Board</span>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
              <a href="#subjects" className="hover:text-indigo-600 transition-colors">Subjects</a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
              <a href="/about" className="hover:text-indigo-600 transition-colors">About</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors hidden sm:inline">
                Login
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200"
              >
                Start Free →
              </Link>
            </div>
          </div>
        </header>

        <main>
          {/* ── Hero Section ────────────────────────────────────────────────── */}
          <section className="relative px-4 sm:px-6 pt-14 pb-16 flex flex-col items-center max-w-5xl mx-auto w-full text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Bihar Board 2025 — Free Online Test Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-5 leading-tight tracking-tight">
              Bihar Board Class 10 & 12{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Free Online Test
              </span>
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-500">
                MCQ Practice App
              </span>
            </h1>

            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
              BSEB Matric & Inter ke liye Bihar ka #1 free online test platform. Chapter-wise objective questions,
              viral questions, model paper MCQs, aur live quiz battles — ek jagah par. <strong className="text-gray-900">Bilkul free!</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                🚀 Start Practicing Free
              </Link>
              <Link
                href="#subjects"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-lg rounded-2xl border border-gray-200 transition-all flex items-center justify-center gap-2"
              >
                📚 View All Subjects
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100 bg-gray-100 aspect-video">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-10" />
              <Image
                src="/assets/login-hero.png"
                alt="Bihar Board students using Padhaku online test app on mobile"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 900px"
              />
            </div>
          </section>

          {/* ── Stats ────────────────────────────────────────────────────────── */}
          <section className="py-12 bg-gradient-to-r from-indigo-600 to-purple-700 text-white" aria-label="Platform statistics">
            <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map(s => (
                <div key={s.label}>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="text-3xl font-black mb-1">{s.value}</div>
                  <div className="text-indigo-200 text-sm font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Subjects ─────────────────────────────────────────────────────── */}
          <section id="subjects" className="py-20 bg-gray-50" aria-label="Bihar Board subjects covered">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                  BSEB Syllabus — All Subjects Covered
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  Bihar Board Class 10 (Matric) aur Class 12 (Inter) dono ke liye chapter-wise MCQ practice karo
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {SUBJECTS.map(sub => (
                  <Link
                    key={sub.name}
                    href={sub.path}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-center group hover:-translate-y-1"
                  >
                    <span className="text-3xl block mb-2">{sub.icon}</span>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{sub.name}</h3>
                    <span className="text-xs text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                      Class {sub.class}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────────────── */}
          <section id="features" className="py-20 bg-white" aria-label="Padhaku features">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                  Padhaku Kyun? — Features Jo Fark Karte Hain
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  Bihar Board toppers ki study strategy — ab sabke liye free
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map(f => (
                  <article
                    key={f.title}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-indigo-100 transition-all"
                  >
                    <div className="text-4xl mb-4">{f.icon}</div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── Testimonials ─────────────────────────────────────────────────── */}
          <section className="py-20 bg-indigo-50" aria-label="Student testimonials">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
                Bihar Board Students Ki Baat 💬
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Rahul Kumar', class: 'Class 10, Patna', text: 'Padhaku se daily practice karke mera Science mein 85% score aaya Matric mein! Viral questions bilkul wahi the jo exam mein aaye.', stars: 5 },
                  { name: 'Priya Kumari', class: 'Class 12, Muzaffarpur', text: 'Free mein itna accha test platform! Physics aur Chemistry ke objective questions bahut helpful the Inter ke liye. Highly recommend!', stars: 5 },
                  { name: 'Amit Singh', class: 'Class 10, Gaya', text: 'Live quiz feature kamaal ka hai — doston ke saath compete karna padhai ko fun bana deta hai. Merit list mein aya is saal!', stars: 5 },
                ].map(t => (
                  <blockquote key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                    <div className="flex mb-3">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-lg">★</span>
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed italic mb-4">&ldquo;{t.text}&rdquo;</p>
                    <footer>
                      <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-indigo-500 text-xs font-medium">{t.class}</div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────────────────── */}
          <section id="faq" className="py-20 bg-white" aria-label="Frequently asked questions about Padhaku">
            <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-center text-gray-500 mb-12">Bihar Board students ke common questions ke jawab</p>
              <div className="space-y-4">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <summary className="px-6 py-5 font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors list-none flex justify-between items-center">
                      {faq.q}
                      <span className="text-indigo-400 text-xl group-open:rotate-45 transition-transform ml-3 shrink-0">+</span>
                    </summary>
                    <p className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
          <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center" aria-label="Get started with Padhaku">
            <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Abhi Shuru Karo — 100% Free! 🚀
              </h2>
              <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
                Bihar Board 2025 exam ke liye taiyari abhi se shuru karo.
                10,000+ students pehle se practice kar rahe hain — aap bhi join karo!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-indigo-700 font-black text-lg rounded-2xl shadow-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                >
                  Free Mein Start Karo →
                </Link>
                <Link
                  href="/play/quiz"
                  className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-bold text-lg rounded-2xl border border-white/30 transition-all"
                >
                  Guest ke roop mein Practice Karo
                </Link>
              </div>
            </div>
          </section>

          {/* ── SEO Text Block ───────────────────────────────────────────────── */}
          <section className="py-16 bg-gray-50 border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-2xl font-black text-gray-900 mb-6">
                Bihar Board Online Test — Padhaku App ke baare mein
              </h2>
              <div className="prose prose-gray max-w-none text-sm text-gray-600 leading-relaxed space-y-4">
                <p>
                  <strong>Padhaku</strong> Bihar ke students ke liye design ki gayi ek free educational platform hai jo BSEB (Bihar School Examination Board) ke Class 10 (Matric) aur Class 12 (Intermediate/Inter) students ki padhai ko aasaan aur effective banati hai.
                </p>
                <p>
                  Hamare platform par aapko milega: <strong>Bihar Board objective questions</strong>, chapter-wise MCQ tests, previous year model paper questions, aur specially curated <strong>viral questions</strong> jo har saal Bihar Board exam mein aate hain. Yeh sab bilkul free hai — kisi bhi smartphone ya computer par chalega.
                </p>
                <p>
                  Bihar Board 2025 exam ki taiyari ke liye Padhaku use karne waale students ne average mein 15-20% zyada marks score kiye hain. Hamare AI-powered system har student ki weakness identify karta hai aur personalized practice sets banata hai.
                </p>
                <p>
                  Padhaku Bihar, Patna, Muzaffarpur, Gaya, Bhagalpur, Purnea, Darbhanga, aur poore Bihar ke students use karte hain. Hindi aur English dono medium mein question available hain.
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
