'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { FaCheck, FaTimes, FaCrown, FaStar, FaBolt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PricingPage() {
    const { user, userProfile, updateProfile } = useAuth();
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [processing, setProcessing] = useState(false);

    const isPro = userProfile?.subscription?.plan === 'pro';

    const handleUpgrade = async () => {
        if (!user) {
            router.push('/login?message=Please login to upgrade');
            return;
        }

        setProcessing(true);

        try {
            // 1. Create Order
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: billingCycle }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            // 2. Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY, // Public Key (We need to ensure user adds this to env)
                amount: data.amount,
                currency: data.currency,
                name: "Padhaku Academy",
                description: `Upgrade to Padhaku Pro (${billingCycle})`,
                image: "/padhaku-192.png", // Ensure this exists or use logo
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.uid,
                                planId: billingCycle
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok) {
                            throw new Error(verifyData.error || 'Verification failed');
                        }

                        // Success Actions
                        // Update local context
                        const now = Date.now();
                        const expiry = billingCycle === 'monthly'
                            ? now + (30 * 24 * 60 * 60 * 1000)
                            : now + (365 * 24 * 60 * 60 * 1000);

                        await updateProfile({
                            subscription: {
                                plan: 'pro',
                                status: 'active',
                                startDate: now,
                                expiryDate: expiry,
                                autoRenew: false
                            }
                        });

                        toast.success("Upgrade Successful! Welcome to Padhaku Pro 👑");
                        router.push('/home');

                    } catch (err: any) {
                        console.error("Verification Error:", err);
                        toast.error(err.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: user.displayName || "",
                    email: user.email || "",
                },
                theme: {
                    color: "#F59E0B", // Amber-500
                },
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast.error(response.error.description || "Payment Failed");
            });
            rzp1.open();

        } catch (error: any) {
            console.error("Payment Initiation Error:", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <main className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">

                    {/* Header Section */}
                    <div className="mb-12">
                        <span className="inline-block py-1 px-3 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                            Premium Membership
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 font-display">
                            Unlock Your Full Potential <br /> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Padhaku Pro</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
                            Get unlimited access to AI tools, detailed analytics, and an ad-free experience to supercharge your exam preparation.
                        </p>

                        {/* Toggle */}
                        <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 relative mb-12">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Yearly <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded uppercase">Save 15%</span>
                            </button>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                        {/* Free Plan */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-200"></div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Student Basic</h3>
                            <p className="text-gray-500 text-sm mb-6">Essential tools for casual learners.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-gray-900">₹0</span>
                                <span className="text-gray-400 font-medium">/forever</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <FeatureItem active text="Standard Live Quizzes" />
                                <FeatureItem active text="Access to Study Notes" />
                                <FeatureItem active text="10 AI Chats / Day" />
                                <FeatureItem active text="3 Flashcard Sets / Day" />
                                <FeatureItem active={false} text="Ad-Free Experience" />
                                <FeatureItem active={false} text="Detailed Analytics" />
                                <FeatureItem active={false} text="Voice Chat in Group" />
                            </ul>

                            <Button disabled className="w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
                                Current Plan
                            </Button>
                        </div>

                        {/* Pro Plan */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gray-900 rounded-3xl p-8 border border-gray-900 shadow-xl text-left relative overflow-hidden text-white"
                        >
                            <div className="absolute top-0 right-0 p-3">
                                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <FaCrown /> BEST VALUE
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Padhaku Pro <FaCrown className="text-yellow-400" />
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">Maximum power for serious toppers.</p>

                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">₹{billingCycle === 'monthly' ? '39' : '400'}</span>
                                <span className="text-gray-400 font-medium">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <FeatureItem active dark text="Everything in Free" />
                                <FeatureItem active dark text="Unlimited AI Chat & Context" />
                                <FeatureItem active dark text="Unlimited Group Play Rooms" />
                                <FeatureItem active dark text="10 Flashcard Sets / Day" />
                                <FeatureItem active dark text="100% Ad-Free Interface" />
                                <FeatureItem active dark text="Microphone Access in Groups" />
                                <FeatureItem active dark text="Deep Analytics & Heatmaps" />
                            </ul>

                            {isPro ? (
                                <Button disabled className="w-full py-4 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                    <FaCheck /> Plan Active
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={processing}
                                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? 'Processing...' : 'Upgrade Now'} <FaBolt />
                                </Button>
                            )}

                            <p className="text-xs text-gray-500 text-center mt-4">
                                {billingCycle === 'monthly' ? 'Renews automatically. Cancel anytime.' : 'One-time payment. Best value.'}
                            </p>
                        </motion.div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

const FeatureItem = ({ active, text, dark = false }: { active: boolean, text: string, dark?: boolean }) => (
    <li className={`flex items-start gap-3 ${!active ? 'opacity-50' : ''}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? (dark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') : (dark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>
            {active ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
        </div>
        <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{text}</span>
    </li>
);
