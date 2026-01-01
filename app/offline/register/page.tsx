'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaMapMarkerAlt, FaSpinner, FaChalkboardTeacher, FaPhone, FaCheckCircle, FaCamera } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { MediaUploader } from '@/components/admin/MediaUploader';

// Constants for choices
const CLASS_OPTIONS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Competitive'];
const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer'];

export default function RegisterTuitionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { detectLocation, loading: locationLoading } = useLocation();

    const [formData, setFormData] = useState({
        tutorName: '',
        centerName: '',
        contact: '',
        board: 'BSEB',
        address: '',
        pincode: '',
        city: '',
        state: '',
        profileImage: '',
        about: '',
        latitude: 0,
        longitude: 0,
    });

    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
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
                address: `${data.locality}, ${data.city}`,
                latitude: data.latitude,
                longitude: data.longitude
            }));
        } catch (err) {
            console.error(err);
            alert('Location detection failed. Please enter manually.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleUploadSuccess = (url: string) => {
        setFormData(prev => ({ ...prev, profileImage: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please login first!');
            return;
        }

        if (selectedClasses.length === 0 || selectedSubjects.length === 0) {
            alert('Please select at least one Class and Subject.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'tuitions'), {
                ...formData,
                classes: selectedClasses,
                subjects: selectedSubjects,
                userId: user.uid,
                createdAt: serverTimestamp(),
                verified: false,
                rating: 0,
                reviewCount: 0
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
                    <p className="text-gray-500 mb-6">Your profile has been created. Students can now verify your location on the map.</p>
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

            <main className="pt-24 px-4 max-w-4xl mx-auto">
                <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-pw-border shadow-pw-lg relative overflow-hidden">

                    {/* Header */}
                    <div className="text-center mb-10 relative z-10">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-pw-violet mb-2">
                            Create Tutor Profile
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Complete your profile to rank higher and get noticed.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                        {/* Profile Image & Name */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-full md:w-1/3 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden mb-4 border-4 border-white shadow-lg relative group">
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                                            <FaCamera />
                                        </div>
                                    )}
                                </div>
                                <div className="w-full">
                                    <MediaUploader onUploadSuccess={handleUploadSuccess} />
                                    <p className="text-xs text-gray-400 text-center mt-2">Upload Profile Photo</p>
                                </div>
                            </div>

                            <div className="w-full md:w-2/3 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <label className="text-sm font-bold text-gray-600 ml-1">Center Name</label>
                                        <input
                                            name="centerName"
                                            value={formData.centerName} onChange={handleChange}
                                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                            placeholder="e.g. Toppers Academy"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 ml-1">About You / Center</label>
                                    <textarea
                                        name="about"
                                        value={formData.about} onChange={handleChange}
                                        className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium resize-none h-24"
                                        placeholder="Briefly describe your teaching experience..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subject & Class Selection */}
                        <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Classes You Teach</label>
                                <div className="flex flex-wrap gap-2">
                                    {CLASS_OPTIONS.map(cls => (
                                        <button
                                            key={cls}
                                            type="button"
                                            onClick={() => toggleSelection(cls, selectedClasses, setSelectedClasses)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedClasses.includes(cls) ? 'bg-pw-indigo text-white border-pw-indigo' : 'bg-white text-gray-600 border-gray-200 hover:border-pw-indigo/50'}`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Subjects You Teach</label>
                                <div className="flex flex-wrap gap-2">
                                    {SUBJECT_OPTIONS.map(sub => (
                                        <button
                                            key={sub}
                                            type="button"
                                            onClick={() => toggleSelection(sub, selectedSubjects, setSelectedSubjects)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedSubjects.includes(sub) ? 'bg-pw-violet text-white border-pw-violet' : 'bg-white text-gray-600 border-gray-200 hover:border-pw-violet/50'}`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Contact & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-gray-600 ml-1">Location</label>
                                    <button
                                        type="button"
                                        onClick={handleAutoLocation}
                                        disabled={locationLoading}
                                        className="text-xs font-bold text-pw-indigo hover:underline flex items-center gap-1"
                                    >
                                        {locationLoading ? <FaSpinner className="animate-spin" /> : <><FaMapMarkerAlt /> Auto Detect</>}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        required name="pincode"
                                        value={formData.pincode} onChange={handleChange}
                                        className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium"
                                        placeholder="Pincode"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                name="address" required
                                value={formData.address} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all font-medium h-20 resize-none"
                                placeholder="Full Address (Street, Landmark etc.)"
                            ></textarea>
                            {formData.latitude !== 0 && (
                                <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                                    <FaCheckCircle /> GPS Coordinates Captured
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-pw-violet hover:bg-pw-indigo text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <FaSpinner className="animate-spin" /> : "Create Profile"}
                        </button>

                    </form>
                </div>
            </main>
        </div>
    );
}
