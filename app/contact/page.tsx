'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/shared/Button';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaPaperPlane } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">

                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Have questions about your preparation? Need technical support? We're here to help you ace your exams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Contact Info Card */}
                        <div className="md:col-span-1 space-y-6">
                            <ContactInfoCard
                                icon={FaEnvelope}
                                title="Email Us"
                                content="support@aimacademy.com"
                                subContent="We usually reply within 24 hours."
                            />
                            <ContactInfoCard
                                icon={FaPhoneAlt}
                                title="Call Us"
                                content="+91 98765 43210"
                                subContent="Mon-Sat, 10 AM - 6 PM IST"
                            />
                            <ContactInfoCard
                                icon={FaMapMarkerAlt}
                                title="Visit Us"
                                content="Patna, Bihar"
                                subContent="AIM Academy HQ"
                            />
                        </div>

                        {/* Contact Form */}
                        <div className="md:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                        <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
                                            <option>General Inquiry</option>
                                            <option>Technical Support</option>
                                            <option>Course Content Doubt</option>
                                            <option>Feedback / Feature Request</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                        <textarea
                                            rows={5}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                                            placeholder="How can we help you today?"
                                        />
                                    </div>

                                    <Button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                                        <FaPaperPlane />
                                        Send Message
                                    </Button>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

const ContactInfoCard = ({ icon: Icon, title, content, subContent }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            <Icon />
        </div>
        <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-gray-900 font-medium">{content}</p>
            <p className="text-sm text-gray-500 mt-1">{subContent}</p>
        </div>
    </div>
);
