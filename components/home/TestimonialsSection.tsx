'use client'

import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { FaQuoteLeft, FaStar, FaCheckCircle } from 'react-icons/fa'

export const TestimonialsSection = () => {
    const { t } = useLanguage()

    const testimonials = [
        {
            name: "Priya Kumari",
            role: "Class 10 Topper",
            content: "Padhaku changed the way I study. The live quizzes made learning so fun!",
            rating: 5,
            initials: "P",
            gradient: "from-pink-500 to-rose-500"
        },
        {
            name: "Rahul Singh",
            role: "Class 12 Student",
            content: "The best platform for Bihar Board preparation. Notes are super easy to understand.",
            rating: 5,
            initials: "R",
            gradient: "from-indigo-500 to-blue-500"
        },
        {
            name: "Anjali Verma",
            role: "Science Stream",
            content: "I love the leaderboard battles! It motivated me to study harder every day.",
            rating: 5,
            initials: "A",
            gradient: "from-violet-500 to-purple-500"
        }
    ]

    return (
        <section className="relative py-24 bg-pw-surface overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[-5%] w-96 h-96 bg-pw-indigo/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-pw-violet/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-pw-indigo/10 text-pw-indigo font-bold text-sm mb-4 border border-pw-indigo/20"
                    >
                        ❤️ Loved by Students
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-display font-bold text-pw-violet mb-6"
                    >
                        Student Success Stories
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Join thousands of toppers who trust Padhaku for their exam preparation.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-[2rem] p-6 md:p-8 relative shadow-pw-md hover:shadow-pw-xl border border-pw-border transition-all duration-300 flex flex-col h-full"
                        >
                            <div className="absolute top-8 right-8 text-pw-indigo/10">
                                <FaQuoteLeft className="text-5xl" />
                            </div>

                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <FaStar key={i} className="text-yellow-400 text-lg drop-shadow-sm" />
                                ))}
                            </div>

                            <div className="mb-8 flex-grow">
                                <p className="text-gray-600 text-lg leading-relaxed font-body">
                                    "{testimonial.content}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-100">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md ring-4 ring-white`}>
                                    {testimonial.initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-gray-900 font-bold text-base">{testimonial.name}</h4>
                                        <FaCheckCircle className="text-blue-500 text-xs" title="Verified Student" />
                                    </div>
                                    <p className="text-pw-indigo text-xs font-bold uppercase tracking-wide">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
