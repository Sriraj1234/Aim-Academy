'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                        <p className="text-gray-500 mb-8">Last updated: January 2026</p>

                        <div className="prose prose-indigo max-w-none text-gray-600">
                            <p>
                                At Padhaku (AIM Academy), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our mobile application.
                            </p>

                            <h3>1. Information We Collect</h3>
                            <p>
                                We may collect information about you in a variety of ways. The information we may collect on the Application includes:
                            </p>
                            <ul>
                                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Application.</li>
                                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application.</li>
                            </ul>

                            <h3>2. Use of Your Information</h3>
                            <p>
                                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
                            </p>
                            <ul>
                                <li>Create and manage your account.</li>
                                <li>Compile anonymous statistical data and analysis for use internally.</li>
                                <li>Email you regarding your account or order.</li>
                                <li>Enable user-to-user communications.</li>
                                <li>Generate a personal profile about you to make future visits to the Application more personalized.</li>
                                <li>Increase the efficiency and operation of the Application.</li>
                            </ul>

                            <h3>3. Disclosure of Your Information</h3>
                            <p>
                                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                            </p>
                            <ul>
                                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                            </ul>

                            <h3>4. Security of Your Information</h3>
                            <p>
                                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                            </p>

                            <h3>5. Contact Us</h3>
                            <p>
                                If you have questions or comments about this Privacy Policy, please contact us at:
                                <br />
                                <strong>Padhaku Support Team</strong>
                                <br />
                                Email: support@aimacademy.com
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
