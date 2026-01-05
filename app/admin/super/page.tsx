'use client'

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaShieldAlt, FaPlus, FaTrash } from "react-icons/fa";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { TeacherProfile } from '@/data/types';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTeacher, setNewTeacher] = useState({
        email: '',
        name: '',
        subject: '',
        phone: ''
    });

    // Fetch Authorized Teachers
    const fetchTeachers = async () => {
        try {
            const q = query(collection(db, 'teachers'), orderBy('authorizedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const teacherList: TeacherProfile[] = [];
            querySnapshot.forEach((doc) => {
                teacherList.push(doc.data() as TeacherProfile);
            });
            setTeachers(teacherList);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            toast.error("Failed to load teachers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Authorize New Teacher
    const handleAuthorize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeacher.email || !newTeacher.name) {
            toast.error("Please fill all required fields");
            return;
        }

        const toastId = toast.loading("Authorizing teacher...");
        try {
            const emailKey = newTeacher.email.toLowerCase().trim();
            const teacherData: TeacherProfile = {
                email: emailKey,
                name: newTeacher.name,
                subject: 'All Subjects', // Global Access
                phone: newTeacher.phone,
                authorizedBy: user?.email || 'unknown',
                authorizedAt: Date.now(),
                status: 'active'
            };

            await setDoc(doc(db, 'teachers', emailKey), teacherData);
            toast.success("Teacher Authorized Successfully", { id: toastId });
            setNewTeacher({ email: '', name: '', subject: '', phone: '' });
            fetchTeachers(); // Refresh list
        } catch (error) {
            console.error("Error authorizing teacher:", error);
            toast.error("Failed to authorize teacher", { id: toastId });
        }
    };

    // Revoke Access
    const handleRevoke = async (email: string) => {
        if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

        try {
            await deleteDoc(doc(db, 'teachers', email));
            toast.success("Access Revoked");
            fetchTeachers();
        } catch (error) {
            toast.error("Failed to revoke access");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white px-8 py-4">
                <div className="flex items-center gap-2">
                    <FaShieldAlt className="h-6 w-6 text-red-600" />
                    <h1 className="text-xl font-bold text-slate-900">Padhaku Super Admin</h1>
                </div>
            </header>

            <main className="container mx-auto p-8 space-y-8">

                {/* Authorization Form */}
                <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FaPlus className="text-indigo-600" /> Authorize New Teacher
                    </h2>
                    <form onSubmit={handleAuthorize} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email Field - Priority */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Authorized Gmail Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. teacher@gmail.com"
                                    value={newTeacher.email}
                                    onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">This Google email will be whitelisted for Teacher Dashboard access.</p>
                            </div>

                            {/* Other Details */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Teacher Name"
                                    value={newTeacher.name}
                                    onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Subject is now Global */}
                            <div className="hidden">
                                <input type="hidden" value="All Subjects" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newTeacher.phone}
                                    onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <FaPlus /> Authorize Gmail Access
                            </button>
                        </div>
                    </form>
                </section>

                {/* Authorized Teachers List */}
                <section>
                    <h2 className="mb-4 text-xl font-bold text-slate-900">Authorized Teachers</h2>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Subject</th>
                                    <th className="px-6 py-4 font-medium">Authorized By</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                                ) : teachers.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">No Authorized Teachers found.</td></tr>
                                ) : (
                                    teachers.map((teacher) => (
                                        <tr key={teacher.email} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{teacher.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {teacher.subject}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs text-right">
                                                {teacher.authorizedBy}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRevoke(teacher.email)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold"
                                                >
                                                    <FaTrash /> Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
