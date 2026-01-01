'use client'

import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { FaChalkboardTeacher, FaClipboardCheck, FaChartLine, FaBook } from 'react-icons/fa'

export const FeaturesSection = () => {
    const { t } = useLanguage()

    const features = [
        {
            icon: FaChalkboardTeacher,
            title: t('features.live.title'),
            desc: t('features.live.desc'),
            color: 'text-pw-indigo',
            bg: 'bg-indigo-50 border-indigo-100'
        },
        {
            icon: FaClipboardCheck,
            title: t('features.practice.title'),
            desc: t('features.practice.desc'),
            color: 'text-purple-600',
            bg: 'bg-purple-50 border-purple-100'
        },
        {
            icon: FaChartLine,
            title: t('features.analytics.title'),
            desc: t('features.analytics.desc'),
            color: 'text-blue-600',
            bg: 'bg-blue-50 border-blue-100'
        },
        {
            icon: FaBook,
            title: t('features.materials.title'),
            desc: t('features.materials.desc'),
            color: 'text-pink-600',
            bg: 'bg-pink-50 border-pink-100'
        }
    ]

    return (
        <section className="relative py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-display font-bold text-pw-violet mb-6"
                    >
                        {t('features.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-500 max-w-2xl mx-auto"
                    >
                        {t('features.subtitle')}
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-2xl p-6 md:p-8 border border-pw-border shadow-pw-md hover:shadow-pw-lg hover:-translate-y-1 transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border`}>
                                <feature.icon className={`text-2xl ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-pw-violet transition-colors">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
