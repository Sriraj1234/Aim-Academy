'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBrain, FaUsers, FaRocket } from 'react-icons/fa';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 text-white pt-24 pb-32">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-fuchsia-500/30 rounded-full blur-3xl -ml-20 -mb-20"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
                        >
                            Revolutionizing <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300">Bihar's Education</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed"
                        >
                            Padhaku is an AI-powered learning platform designed to make quality education accessible, engaging, and personalized for every student.
                        </motion.p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                    We believe that geography should not dictate destiny. Our mission is to level the playing field for students in Bihar by providing world-class educational tools right at their fingertips.
                                </p>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    By combining cutting-edge AI technology with gamified learning, we transform boring study sessions into exciting adventures, ensuring every student can achieve their full potential.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative rounded-2xl overflow-hidden shadow-2xl bg-indigo-50 aspect-video flex items-center justify-center p-8"
                            >
                                {/* Placeholder for an image or illustration */}
                                <div className="text-indigo-900/10 text-9xl">
                                    <FaRocket />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats / Impact */}
                <section className="py-20 bg-indigo-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCard icon={FaUsers} value="10k+" label="Active Students" />
                            <StatCard icon={FaGraduationCap} value="500+" label="Toppers Created" />
                            <StatCard icon={FaBrain} value="1M+" label="Questions Solved" />
                            <StatCard icon={FaRocket} value="24/7" label="AI Support" />
                        </div>
                    </div>
                </section>

                {/* Team / Story values */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-12">Driven by Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ValueCard title="Innovation" desc="Constantly pushing boundaries with AI to make learning faster and easier." />
                            <ValueCard title="Accessibility" desc="Quality education shouldn't be a luxury. We make it affordable and available to all." />
                            <ValueCard title="Student First" desc="Every feature we build starts with one question: 'How does this help the student?'" />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

const StatCard = ({ icon: Icon, value, label }: any) => (
    <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">
            <Icon />
        </div>
        <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{label}</div>
    </div>
);

const ValueCard = ({ title, desc }: any) => (
    <div className="p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-100 text-left">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
);
