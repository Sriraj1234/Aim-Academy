'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { Header } from '@/components/shared/Header';

interface Tuition {
    id: string;
    tutorName: string;
    centerName?: string;
    subject: string;
    classLevel: string;
    city: string;
    pincode: string;
    contact: string;
    verified?: boolean;
}

export default function ManageTuitionsPage() {
    const [tuitions, setTuitions] = useState<Tuition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTuitions();
    }, []);

    const fetchTuitions = async () => {
        setLoading(true);
        try {
            // Fetch all tuitions ordered by creation time if possible, or just all
            const q = query(collection(db, 'tuitions'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tuition));
            setTuitions(data);
        } catch (error) {
            console.error("Error fetching tuitions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tuition?')) return;
        try {
            await deleteDoc(doc(db, 'tuitions', id));
            setTuitions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete.");
        }
    };

    const toggleVerification = async (id: string, currentStatus: boolean | undefined) => {
        try {
            await updateDoc(doc(db, 'tuitions', id), {
                verified: !currentStatus
            });
            setTuitions(prev => prev.map(t => t.id === id ? { ...t, verified: !currentStatus } : t));
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    return (
        <div className="min-h-screen bg-pw-surface p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-pw-violet mb-1">Manage Tuitions</h1>
                        <p className="text-gray-500 font-medium">Verify and manage offline tuition listings.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border font-bold text-pw-indigo">
                        Total: {tuitions.length}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-pw-border shadow-pw-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Tutor / Center</th>
                                        <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-6 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tuitions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="font-bold text-gray-800 text-lg">{t.tutorName}</div>
                                                {t.centerName && <div className="text-sm text-gray-500">{t.centerName}</div>}
                                                <div className="text-xs text-pw-indigo mt-1 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded">
                                                    {t.subject} (Cl {t.classLevel})
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                    <FaMapMarkerAlt className="text-gray-400" /> {t.city}
                                                </div>
                                                <div className="text-sm text-gray-400 ml-6">{t.pincode}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-lg w-fit">
                                                    <FaPhone className="text-xs" /> {t.contact}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <button
                                                    onClick={() => toggleVerification(t.id, t.verified)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${t.verified ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                                >
                                                    {t.verified ? <><FaCheckCircle /> Verified</> : <><FaTimesCircle /> Pending</>}
                                                </button>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                    title="Delete Tuition"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tuitions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">
                                                No tuitions registered yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
