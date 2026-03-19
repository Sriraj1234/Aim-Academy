'use client'

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaShieldAlt, FaPlus, FaTrash, FaSync, FaExclamationTriangle } from "react-icons/fa";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { TeacherProfile } from '@/data/types';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deployingRules, setDeployingRules] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        email: '',
        name: '',
        subject: '',
        phone: ''
    });

    // Fetch Authorized Teachers
    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'teachers'), orderBy('authorizedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const teacherList: TeacherProfile[] = [];
            querySnapshot.forEach((doc) => {
                teacherList.push(doc.data() as TeacherProfile);
            });
            setTeachers(teacherList);
        } catch (error: any) {
            console.error("Error fetching teachers:", error);
            if (error.code === 'permission-denied') {
                toast.error("Permission denied. Please deploy updated rules first (see below).");
            } else {
                toast.error("Failed to load teachers: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Deploy Firestore Rules via API (using service account)
    const handleDeployRules = async () => {
        if (!confirm('This will deploy updated Firestore security rules to production. Continue?')) return;
        setDeployingRules(true);
        const toastId = toast.loading('Deploying Firestore rules...');
        try {
            const res = await fetch('/api/admin/deploy-rules');
            const data = await res.json();
            if (data.success) {
                toast.success('Firestore rules deployed! Refreshing teachers...', { id: toastId });
                setTimeout(() => fetchTeachers(), 2000);
            } else {
                toast.error('Deploy failed: ' + data.error, { id: toastId });
            }
        } catch (error: any) {
            toast.error('Deploy error: ' + error.message, { id: toastId });
        } finally {
            setDeployingRules(false);
        }
    };

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
                subject: 'All Subjects',
                phone: newTeacher.phone,
                authorizedBy: user?.email || 'unknown',
                authorizedAt: Date.now(),
                status: 'active'
            };

            await setDoc(doc(db, 'teachers', emailKey), teacherData);
            toast.success("Teacher Authorized Successfully", { id: toastId });
            setNewTeacher({ email: '', name: '', subject: '', phone: '' });
            fetchTeachers();
        } catch (error: any) {
            console.error("Error authorizing teacher:", error);
            if (error.code === 'permission-denied') {
                toast.error("Permission denied! Deploy rules first.", { id: toastId });
            } else {
                toast.error("Failed to authorize teacher", { id: toastId });
            }
        }
    };

    // Revoke Access
    const handleRevoke = async (email: string) => {
        if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

        try {
            await deleteDoc(doc(db, 'teachers', email));
            toast.success("Access Revoked");
            fetchTeachers();
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                toast.error("Permission denied! Deploy rules first.");
            } else {
                toast.error("Failed to revoke access");
            }
        }
    };

    return (
        <div className="min-h-screen bg-pw-surface p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <FaShieldAlt className="text-red-600 text-lg" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-pw-violet">Padhaku Super Admin</h1>
                        <p className="text-sm text-gray-500">Manage teacher access and security rules</p>
                    </div>
                </div>

                {/* Deploy Rules Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaShieldAlt className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900">Deploy Firestore Security Rules</h3>
                        <p className="text-sm text-blue-700 mt-0.5">
                            If teachers are not loading (permission denied), deploy the latest rules first. This uses your service account.
                        </p>
                    </div>
                    <button
                        onClick={handleDeployRules}
                        disabled={deployingRules}
                        className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 text-sm"
                    >
                        <FaSync className={deployingRules ? 'animate-spin' : ''} />
                        {deployingRules ? 'Deploying...' : 'Deploy Rules'}
                    </button>
                </div>

                {/* Authorization Form */}
                <section className="bg-white rounded-2xl p-6 border border-pw-border shadow-pw-sm">
                    <h2 className="text-lg font-bold text-pw-violet mb-5 flex items-center gap-2">
                        <FaPlus className="text-pw-indigo" /> Authorize New Teacher
                    </h2>
                    <form onSubmit={handleAuthorize} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Gmail Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. teacher@gmail.com"
                                    value={newTeacher.email}
                                    onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/30 focus:border-pw-indigo outline-none transition-all"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">This Google email will be whitelisted for Teacher Dashboard access.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Teacher Name"
                                    value={newTeacher.name}
                                    onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/30 focus:border-pw-indigo outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newTeacher.phone}
                                    onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pw-indigo/30 focus:border-pw-indigo outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="bg-pw-indigo hover:bg-pw-violet text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <FaPlus /> Authorize Gmail Access
                        </button>
                    </form>
                </section>

                {/* Authorized Teachers List */}
                <section className="bg-white rounded-2xl border border-pw-border shadow-pw-sm overflow-hidden">
                    <div className="p-5 border-b border-pw-border flex justify-between items-center">
                        <h2 className="text-lg font-bold text-pw-violet">Authorized Teachers ({teachers.length})</h2>
                        <button
                            onClick={fetchTeachers}
                            disabled={loading}
                            className="p-2 text-pw-indigo hover:bg-pw-surface rounded-xl border border-pw-border transition-colors"
                            title="Refresh"
                        >
                            <FaSync className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-pw-surface text-gray-500 border-b border-pw-border">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Authorized By</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pw-border">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">
                                        <FaSync className="animate-spin inline mr-2" />Loading teachers...
                                    </td></tr>
                                ) : teachers.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                                        <FaShieldAlt className="text-3xl mx-auto mb-2 text-gray-200" />
                                        <p>No authorized teachers yet.</p>
                                        <p className="text-xs mt-1">If seeing permission errors, click "Deploy Rules" above first.</p>
                                    </td></tr>
                                ) : (
                                    teachers.map((teacher) => (
                                        <tr key={teacher.email} className="hover:bg-pw-surface/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-800">{teacher.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-pw-indigo/10 text-pw-indigo px-2.5 py-0.5 text-xs font-bold">
                                                    {teacher.subject}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-xs">{teacher.authorizedBy}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRevoke(teacher.email)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold"
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
            </div>
        </div>
    );
}
