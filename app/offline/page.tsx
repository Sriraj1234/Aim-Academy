'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { useLocation } from '@/hooks/useLocation';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { FaMapMarkerAlt, FaSearch, FaPhoneAlt, FaUserTie, FaBookOpen, FaSpinner, FaUniversity } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Tuition {
    id: string;
    tutorName: string;
    centerName?: string;
    subject: string;
    classLevel: string;
    board: string;
    address: string;
    city: string;
    pincode: string;
    contact: string;
}

export default function OfflineTuitionsPage() {
    const { detectLocation, loading: locationLoading } = useLocation();
    const [tuitions, setTuitions] = useState<Tuition[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchPincode, setSearchPincode] = useState('');
    const [userPincode, setUserPincode] = useState('');

    // Fetch ALL tuitions initially (or limit to recent)
    // In a real app, we would paginate or query by default location
    useEffect(() => {
        fetchTuitions();
    }, []);

    const fetchTuitions = async (pincode?: string) => {
        setLoading(true);
        try {
            let q;
            if (pincode) {
                // Filter by pincode if provided
                q = query(collection(db, 'tuitions'), where('pincode', '==', pincode));
            } else {
                // Fetch all (limit 50)
                q = query(collection(db, 'tuitions'));
            }

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tuition));
            setTuitions(data);
        } catch (error) {
            console.error("Error fetching tuitions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoLocation = async () => {
        try {
            const data = await detectLocation();
            if (data.pincode) {
                setUserPincode(data.pincode);
                setSearchPincode(data.pincode);
                fetchTuitions(data.pincode); // Auto-fetch for this pincode
            } else {
                alert("Could not detect Pincode. Please enter manually.");
            }
        } catch (err) {
            console.error(err);
            alert("Location check failed.");
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTuitions(searchPincode.trim() || undefined);
    };

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 px-4 max-w-7xl mx-auto space-y-8">

                {/* Search Header */}
                <div className="bg-white rounded-[2rem] p-8 border border-pw-border shadow-pw-lg text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-pw-violet mb-4">
                            Find Best Offline Tuitions 🏠
                        </h1>
                        <p className="text-gray-500 mb-8">
                            Apne area ke best teachers aur coaching centers dhoondhein.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <form onSubmit={handleManualSearch} className="flex-1 flex gap-2">
                                <div className="relative flex-1">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchPincode}
                                        onChange={(e) => setSearchPincode(e.target.value)}
                                        placeholder="Enter Pincode (e.g. 800001)"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-bold text-lg"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-pw-violet hover:bg-pw-indigo text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    Search
                                </button>
                            </form>

                            <button
                                onClick={handleAutoLocation}
                                disabled={locationLoading}
                                className="px-6 py-4 bg-white border border-pw-indigo/20 text-pw-indigo hover:bg-pw-indigo hover:text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                {locationLoading ? <FaSpinner className="animate-spin" /> : <><FaMapMarkerAlt /> Near Me</>}
                            </button>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-50" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-50" />
                </div>

                {/* Results Grid */}
                <div>
                    <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                        {searchPincode ? `Results for "${searchPincode}"` : "Recently Added"}
                        <span className="text-sm font-normal text-gray-400 bg-white px-2 py-1 rounded-md border">
                            {tuitions.length} Found
                        </span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-12 h-12 border-4 border-pw-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">Finding best teachers...</p>
                        </div>
                    ) : tuitions.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
                            <div className="text-6xl mb-4">🤷‍♂️</div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Tuitions Found Here</h3>
                            <p className="text-gray-500 mb-6">Currently hamare paas is area mein tutors nahi hain.</p>
                            <button
                                onClick={() => { setSearchPincode(''); fetchTuitions(); }}
                                className="text-pw-indigo font-bold hover:underline"
                            >
                                View All Tuitions
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {tuitions.map((t) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        layout
                                        className="bg-white rounded-2xl p-5 border border-pw-border hover:border-pw-indigo/30 shadow-sm hover:shadow-pw-lg transition-all group cursor-pointer relative overflow-hidden"
                                        onClick={() => window.location.href = `/offline/${t.id}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold border border-purple-100 overflow-hidden">
                                                    {(t as any).profileImage ? (
                                                        <img src={(t as any).profileImage} alt={t.tutorName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        t.tutorName.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-pw-indigo transition-colors line-clamp-1">
                                                        {t.centerName || t.tutorName}
                                                    </h3>
                                                    {t.centerName && (
                                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 line-clamp-1">
                                                            <FaUserTie className="text-[10px]" /> {t.tutorName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {(t as any).rating > 0 && (
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs font-bold text-yellow-700 border border-yellow-100">
                                                    <span className="text-yellow-500">★</span> {(t as any).rating?.toFixed(1)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-5">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaBookOpen className="text-pw-violet" />
                                                <span className="font-medium truncate">{t.subject}</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-gray-500">
                                                <FaMapMarkerAlt className="text-red-400 mt-1 shrink-0" />
                                                <span className="leading-snug line-clamp-2 text-xs">{t.address}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-auto">
                                            <button className="flex-1 py-2 bg-pw-indigo/5 text-pw-indigo hover:bg-pw-indigo hover:text-white rounded-lg font-bold text-sm transition-all border border-pw-indigo/10">
                                                View Profile
                                            </button>
                                            <a
                                                href={`tel:${t.contact}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-12 flex items-center justify-center bg-gray-50 hover:bg-green-500 hover:text-white text-gray-600 rounded-lg border border-gray-100 transition-all font-bold"
                                            >
                                                <FaPhoneAlt />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
