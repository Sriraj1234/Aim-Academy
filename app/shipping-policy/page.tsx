'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { FaBox, FaDigitalTachograph, FaEnvelope } from 'react-icons/fa';

export default function ShippingPolicyPage() {
    return (
        <div className="min-h-screen bg-pw-surface">
            <Header />

            <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-pw-md border border-pw-border">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-pw-indigo/10 rounded-xl flex items-center justify-center">
                            <FaBox className="text-2xl text-pw-indigo" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-pw-violet">Shipping Policy</h1>
                            <p className="text-gray-500 text-sm">Last updated: January 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-gray max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-pw-violet mb-4 flex items-center gap-2">
                                <FaDigitalTachograph className="text-pw-indigo" />
                                Digital Products Only
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Padhaku Academy is a <strong>100% digital education platform</strong>. We do not sell or ship any physical products, books, or materials. All our services, including:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                <li>Practice Quizzes and Tests</li>
                                <li>AI Study Tools (Chat, Flashcards, Summaries)</li>
                                <li>Study Notes and Materials</li>
                                <li>Live Quiz Sessions</li>
                                <li>Padhaku Pro Subscription</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                ...are delivered <strong>instantly and electronically</strong> through our website and mobile application.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-pw-violet mb-4">Instant Access</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Upon successful payment for any premium service (e.g., Padhaku Pro subscription), you will receive <strong>immediate access</strong> to all features. No shipping time or wait period is required.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-pw-violet mb-4">No Physical Deliveries</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Since we do not offer any physical goods, there are no shipping charges, delivery timelines, or logistics involved. Your purchased services are available in your account the moment the transaction is complete.
                            </p>
                        </section>

                        <section className="bg-pw-surface p-6 rounded-xl border border-pw-border">
                            <h2 className="text-xl font-bold text-pw-violet mb-4 flex items-center gap-2">
                                <FaEnvelope className="text-pw-indigo" />
                                Questions?
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                If you have any questions about our digital delivery or need assistance accessing your purchased content, please contact us at:
                            </p>
                            <p className="mt-4">
                                <a href="mailto:support@padhaku.in" className="text-pw-indigo font-bold hover:underline">
                                    support@padhaku.in
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
