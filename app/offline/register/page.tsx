'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaMapMarkerAlt, FaSpinner, FaChalkboardTeacher, FaPhone, FaBuilding, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function RegisterTuitionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { detectLocation, loading: locationLoading } = useLocation();

    const [formData, setFormData] = useState({
        tutorName: '',
        centerName: '',
        contact: '',
        subject: '',
        classLevel: '10',
        board: 'BSEB',
        address: '',
        pincode: '',
        city: '',
        state: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Auto-fill location
    const handleAutoLocation = async () => {
        try {
            const data = await detectLocation();
            setFormData(prev => ({
                ...prev,
                pincode: data.pincode || '',
                city: data.city || '',
                state: data.state || '',
                address: `${data.locality}, ${data.city}` // Pre-fill address partially
            }));
        } catch (err) {
            console.error(err);
            alert('Location detection failed. Please enter manually.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please login first!');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'tuitions'), {
                ...formData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                verified: false, // verification system for later
            });
            setSuccess(true);
            setTimeout(() => router.push('/home'), 3000); // Redirect after success
        } catch (error) {
            console.error("Error registering tuition:", error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-pw-surface flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-pw-xl border border-pw-border"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="text-4xl text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-pw-violet mb-2">Registration Successful!</h2>
                    <p className="text-gray-500 mb-6">Apka Tuition Center register ho gaya hai! Jald hi students aapko dhoondh payenge.</p>
                    <button onClick={() => router.push('/home')} className="px-6 py-2 bg-pw-indigo text-white rounded-xl font-bold">
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white md:bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 px-4 max-w-3xl mx-auto">
                <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-pw-border shadow-pw-lg relative overflow-hidden">

                    {/* Header */}
                    <div className="text-center mb-10 relative z-10">
                        <div className="w-16 h-16 bg-pw-surface rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner text-pw-indigo">
                            <FaChalkboardTeacher />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-pw-violet mb-2">
                            Register Your Tuition
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Join our network and help local students find you.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Tutor Name</label>
                                <input
                                    required name="tutorName"
                                    value={formData.tutorName} onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                    placeholder="e.g. Rahul Sir"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Center Name (Optional)</label>
                                <input
                                    name="centerName"
                                    value={formData.centerName} onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                    placeholder="e.g. Toppers Academy"
                                />
                            </div>
                        </div>

                        {/* Subject & Class */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Main Subject</label>
                                <input
                                    required name="subject"
                                    value={formData.subject} onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                    placeholder="e.g. Math & Science"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Contact Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required name="contact" type="tel"
                                        value={formData.contact} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                        placeholder="Mobile Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-pw-violet flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-red-500" /> Location Details
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAutoLocation}
                                    disabled={locationLoading}
                                    className="text-xs font-bold bg-white text-pw-indigo px-3 py-1.5 rounded-lg border border-pw-indigo/20 shadow-sm hover:bg-pw-indigo hover:text-white transition-all flex items-center gap-2"
                                >
                                    {locationLoading ? <FaSpinner className="animate-spin" /> : "📍 Auto Detect"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    name="pincode" required
                                    value={formData.pincode} onChange={handleChange}
                                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo outline-none"
                                    placeholder="Pincode"
                                />
                                <input
                                    name="city" required
                                    value={formData.city} onChange={handleChange}
                                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo outline-none"
                                    placeholder="City/District"
                                />
                            </div>
                            <textarea
                                name="address" required
                                value={formData.address} onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pw-indigo outline-none h-24 resize-none"
                                placeholder="Full Address (Street, Landmark etc.)"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-pw-violet hover:bg-pw-indigo text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <FaSpinner className="animate-spin" /> : "Register Now"}
                        </button>

                    </form>
                </div>
            </main>
        </div>
    );
}
