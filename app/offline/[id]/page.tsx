'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use useParams in App Router
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { FaMapMarkerAlt, FaStar, FaPhone, FaShareAlt, FaCheckCircle, FaUser, FaRegStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Tuition {
    id: string;
    tutorName: string;
    centerName?: string;
    about?: string;
    subjects: string[];
    classes: string[];
    address: string;
    city: string;
    pincode: string;
    contact: string;
    profileImage?: string;
    latitude?: number;
    longitude?: number;
    verified?: boolean;
    rating?: number;
    reviewCount?: number;
}

interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: any;
}

export default function TuitionProfilePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [tuition, setTuition] = useState<Tuition | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Review Form State
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Fetch Tuition Data
        const fetchTuition = async () => {
            try {
                const docRef = doc(db, 'tuitions', id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTuition({ id: docSnap.id, ...docSnap.data() } as Tuition);
                }
            } catch (error) {
                console.error("Error fetching tuition:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTuition();

        // Subscribe to Reviews (Real-time)
        const q = query(collection(db, `tuitions/${id}/reviews`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(data);
        });

        return () => unsubscribe();
    }, [id]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("Please login to write a review.");
            return;
        }
        if (newRating === 0) {
            alert("Please select a star rating.");
            return;
        }

        setSubmittingReview(true);
        try {
            // 1. Add Review
            await addDoc(collection(db, `tuitions/${id}/reviews`), {
                userId: user.uid,
                userName: user.displayName || 'Anonymous Student',
                rating: newRating,
                comment: newComment,
                createdAt: serverTimestamp()
            });

            // 2. Update Tuition Average Rating (Simple approximation or cloud function better)
            // Here we do a client-side calc for immediate feedback, verifying on backend ideally
            // Simple update: increment count, update avg
            // (Note: For robust apps, use Firebase Functions/Transactions. Here keeping it simple)

            const newTotalReviews = (tuition?.reviewCount || 0) + 1;
            // Weighted average formula: ((oldAvg * oldCount) + newRating) / newCount
            const oldRating = tuition?.rating || 0;
            const newAvg = ((oldRating * (tuition?.reviewCount || 0)) + newRating) / newTotalReviews;

            await updateDoc(doc(db, 'tuitions', id as string), {
                reviewCount: increment(1),
                rating: newAvg
            });

            // Update local state
            setTuition(prev => prev ? { ...prev, rating: newAvg, reviewCount: newTotalReviews } : null);
            setNewComment('');
            setNewRating(0);
            alert("Review submitted!");

        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-pw-surface flex items-center justify-center">Loading...</div>;
    if (!tuition) return <div className="min-h-screen bg-pw-surface flex items-center justify-center">Tuition not found!</div>;

    const mapUrl = tuition.latitude
        ? `https://maps.google.com/maps?q=${tuition.latitude},${tuition.longitude}&z=15&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(tuition.address + ' ' + tuition.city)}&z=15&output=embed`;

    return (
        <div className="min-h-screen bg-pw-surface pb-20 font-sans">
            <Header />

            <main className="pt-24 px-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Profile Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Hero Card */}
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-pw-lg border border-pw-border relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                            {/* Profile Image */}
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0 bg-gray-100">
                                {tuition.profileImage ? (
                                    <img src={tuition.profileImage} alt={tuition.tutorName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                                        <FaUser />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-800 flex items-center gap-2">
                                            {tuition.centerName || tuition.tutorName}
                                            {tuition.verified && <FaCheckCircle className="text-blue-500 text-lg" title="Verified" />}
                                        </h1>
                                        {tuition.centerName && <p className="text-gray-500 font-medium">{tuition.tutorName}</p>}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">
                                            <FaStar className="text-yellow-400" />
                                            <span className="font-bold text-yellow-700">{tuition.rating?.toFixed(1) || '0.0'}</span>
                                            <span className="text-xs text-yellow-600">({tuition.reviewCount || 0})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {tuition.subjects.map(sub => (
                                        <span key={sub} className="px-3 py-1 bg-pw-indigo/10 text-pw-indigo rounded-full text-xs font-bold uppercase tracking-wide">
                                            {sub}
                                        </span>
                                    ))}
                                    {tuition.classes.map(cls => (
                                        <span key={cls} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About & Map */}
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-pw-md border border-pw-border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">About</h2>
                        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                            {tuition.about || "No description provided."}
                        </p>

                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" /> Location
                        </h2>
                        <div className="w-full h-64 md:h-80 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative mb-4">
                            <iframe
                                title="Tuition Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={mapUrl}
                                allowFullScreen
                            ></iframe>
                        </div>
                        <p className="text-gray-500 text-sm flex items-start gap-2">
                            <FaMapMarkerAlt className="shrink-0 mt-1" /> {tuition.address}, {tuition.city} - {tuition.pincode}
                        </p>
                    </div>

                    {/* Reviews List */}
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-pw-md border border-pw-border">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Student Reviews</h2>

                        {reviews.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No reviews yet. Be the first to review!</p>
                        ) : (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-gray-800">{review.userName}</h4>
                                            <div className="flex text-yellow-400 text-sm">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < review.rating ? '' : 'text-gray-200'} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Contact & Rate */}
                <div className="space-y-6">

                    {/* Contact Card */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-pw-lg border border-pw-border sticky top-24">
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Book a Class</p>
                        <h3 className="text-2xl font-bold text-pw-violet mb-6">{tuition.contact}</h3>

                        <a
                            href={`tel:${tuition.contact}`}
                            className="block w-full py-4 bg-pw-violet hover:bg-pw-indigo text-white rounded-xl font-bold text-center transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mb-3"
                        >
                            <FaPhone /> Call Now
                        </a>
                        <button className="block w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2">
                            <FaShareAlt /> Share Profile
                        </button>
                    </div>

                    {/* Write Review */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-pw-md border border-pw-border">
                        <h3 className="font-bold text-gray-800 mb-4">Rate this Teacher</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div className="flex gap-2 justify-center py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setNewRating(star)}
                                        className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        {star <= newRating ? <FaStar className="text-yellow-400" /> : <FaRegStar className="text-gray-300" />}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write your experience..."
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-pw-indigo outline-none text-sm h-24 resize-none"
                                required
                            ></textarea>
                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {submittingReview ? 'Submitting...' : 'Post Review'}
                            </button>
                        </form>
                    </div>
                </div>

            </main>
        </div>
    );
}
