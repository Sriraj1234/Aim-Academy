'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { FaCheck, FaTimes, FaCrown, FaBolt, FaShieldAlt, FaCalendarAlt, FaHistory, FaInfinity, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
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

    const sub = userProfile?.subscription;

    const isPro = (() => {
        if (!sub || sub.plan !== 'pro' || sub.status !== 'active') return false;
        // Auto-pay users: always trust status (webhook keeps them updated)
        if (sub.autoRenew && sub.subscriptionId) return true;
        // One-time users: check expiry
        return sub.expiryDate ? sub.expiryDate > Date.now() : false;
    })();
    const isAutoRenew = sub?.autoRenew && sub?.subscriptionId;

    const now = Date.now();
    const expiry = sub?.expiryDate;
    const remainingDays = expiry ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))) : null;
    const startDateStr = sub?.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    const expiryDateStr = expiry ? new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    const lastPaymentStr = sub?.lastPaymentDate ? new Date(sub.lastPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

    const handleUpgrade = async () => {
        if (!user) {
            router.push('/login?message=Please login to upgrade');
            return;
        }

        setProcessing(true);

        try {
            const res = await fetch('/api/payment/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: billingCycle }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create subscription');
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
                subscription_id: data.id,
                name: "Padhaku Academy",
                description: `Upgrade to Padhaku Pro (${billingCycle})`,
                image: "/padhaku-192.png",
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.uid,
                                planId: billingCycle
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok) {
                            throw new Error(verifyData.error || 'Verification failed');
                        }

                        const newNow = Date.now();
                        const newExpiry = billingCycle === 'monthly'
                            ? newNow + (30 * 24 * 60 * 60 * 1000)
                            : newNow + (365 * 24 * 60 * 60 * 1000);

                        await updateProfile({
                            subscription: {
                                plan: 'pro',
                                status: 'active',
                                startDate: newNow,
                                expiryDate: newExpiry,
                                autoRenew: true,
                                subscriptionId: response.razorpay_subscription_id,
                                paymentId: response.razorpay_payment_id,
                                lastPaymentDate: newNow,
                            }
                        });

                        toast.success("Upgrade Successful! Auto-Pay Enabled ⚡");
                        router.refresh();

                    } catch (err: any) {
                        toast.error(err.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: user.displayName || "",
                    email: user.email || "",
                },
                theme: { color: "#F59E0B" },
                modal: {
                    ondismiss: function () { setProcessing(false); }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast.error(response.error.description || "Payment Failed");
                setProcessing(false);
            });
            rzp1.open();

        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <main className="pt-24 pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">

                    {/* === PRO USER: Show Subscription Dashboard === */}
                    <AnimatePresence>
                        {isPro && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-12"
                            >
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-sm font-black px-4 py-1.5 rounded-full mb-4 shadow-md">
                                        <FaCrown /> YOU ARE A PRO MEMBER
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Pro Plan</span> Dashboard
                                    </h1>
                                    <p className="text-gray-500 mt-2">Manage your subscription and view your premium benefits.</p>
                                </div>

                                {/* Subscription Details Card */}
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl mb-6 relative overflow-hidden">
                                    {/* Decorative circles */}
                                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                                            <h2 className="text-2xl font-black flex items-center gap-2">
                                                Padhaku Pro <FaCrown className="text-amber-400" />
                                            </h2>
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${(remainingDays !== null && remainingDays < 7) ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                            <div className={`w-2.5 h-2.5 rounded-full ${(remainingDays !== null && remainingDays < 7) ? 'bg-red-400' : 'bg-green-400'} animate-pulse`} />
                                            {isAutoRenew ? 'Auto-Pay Active' : sub?.status === 'active' ? 'Active' : 'Expired'}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatCard
                                            icon={<FaCalendarAlt className="text-amber-400" />}
                                            label="Member Since"
                                            value={startDateStr || '—'}
                                        />
                                        <StatCard
                                            icon={isAutoRenew ? <FaInfinity className="text-blue-400" /> : <FaCalendarAlt className="text-yellow-400" />}
                                            label={isAutoRenew ? "Next Billing" : "Expires On"}
                                            value={expiryDateStr || (isAutoRenew ? 'Ongoing' : '—')}
                                        />
                                        <StatCard
                                            icon={<FaHistory className="text-purple-400" />}
                                            label="Last Payment"
                                            value={lastPaymentStr || '—'}
                                        />
                                        <StatCard
                                            icon={<FaShieldAlt className={isAutoRenew ? "text-green-400" : "text-gray-400"} />}
                                            label="Auto-Renew"
                                            value={isAutoRenew ? 'Enabled ✓' : 'Disabled'}
                                        />
                                    </div>

                                    {/* Days Remaining Bar (if not auto-pay) */}
                                    {!isAutoRenew && remainingDays !== null && (
                                        <div className="mt-6">
                                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                <span>Days remaining</span>
                                                <span className={`font-bold ${remainingDays < 7 ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {remainingDays} days
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((remainingDays / 30) * 100, 100)}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                                    className={`h-full rounded-full ${remainingDays < 7 ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`}
                                                />
                                            </div>
                                            {remainingDays < 7 && (
                                                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                                    <FaExclamationTriangle /> Your plan expires soon! Upgrade to Auto-Pay to never lose access.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Auto-Pay Details */}
                                    {isAutoRenew && sub?.subscriptionId && (
                                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-gray-400 text-xs mb-1">Razorpay Subscription ID</p>
                                            <p className="text-gray-300 font-mono text-xs break-all">{sub.subscriptionId}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pro Benefits Reminder */}
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaCrown className="text-amber-500" /> Your Premium Benefits
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            'Unlimited AI Chat & Context Memory',
                                            'Unlimited Group Play / Battle Mode',
                                            '10 AI Flashcard Sets per Day',
                                            '6 Snap & Solve Sessions per Day',
                                            '6 Note Generations per Day',
                                            '100% Ad-Free Interface',
                                            'Deep Analytics & Progress Heatmaps',
                                            'Priority Support',
                                        ].map(benefit => (
                                            <div key={benefit} className="flex items-center gap-3 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <FaCheck className="text-green-600 text-[10px]" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="my-10 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-sm text-gray-400 font-medium">Upgrade, Compare or Share Plans</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* === PRICING SECTION (for all users) === */}
                    <div className="text-center mb-10">
                        {!isPro && (
                            <>
                                <span className="inline-block py-1 px-3 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                                    Premium Membership (Auto-Pay)
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                                    Unlock Your Full Potential <br />with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Padhaku Pro</span>
                                </h1>
                                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
                                    Get unlimited access to AI tools, detailed analytics, and an ad-free experience.
                                </p>
                            </>
                        )}

                        {/* Toggle */}
                        <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 relative mb-10">
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
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-200" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Student Basic</h3>
                            <p className="text-gray-500 text-sm mb-6">Essential tools for casual learners.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-gray-900">₹0</span>
                                <span className="text-gray-400 font-medium">/forever</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <FeatureItem active text="Standard Live Quizzes" />
                                <FeatureItem active text="Access to Study Notes" />
                                <FeatureItem active text="15 AI Chats / Day" />
                                <FeatureItem active text="3 Flashcard Sets / Day" />
                                <FeatureItem active text="2 AI Solutions (Snap & Solve) / Day" />
                                <FeatureItem active text="2 Note Generations / Day" />
                                <FeatureItem active={false} text="Ad-Free Experience" />
                                <FeatureItem active={false} text="Detailed Analytics" />
                            </ul>

                            <Button disabled className="w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
                                {!isPro ? 'Current Plan' : 'Basic Features'}
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
                                <FeatureItem active dark text="6 AI Solutions (Snap & Solve) / Day" />
                                <FeatureItem active dark text="6 Note Generations / Day" />
                                <FeatureItem active dark text="100% Ad-Free Interface" />
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
                                Secured Auto-Pay via Razorpay · Cancel anytime
                            </p>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            {icon}
            <span>{label}</span>
        </div>
        <p className="text-white font-bold text-sm leading-tight">{value}</p>
    </div>
);

const FeatureItem = ({ active, text, dark = false }: { active: boolean; text: string; dark?: boolean }) => (
    <li className={`flex items-start gap-3 ${!active ? 'opacity-50' : ''}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? (dark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') : (dark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>
            {active ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
        </div>
        <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{text}</span>
    </li>
);
