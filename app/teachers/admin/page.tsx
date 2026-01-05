'use client'

import { useEffect, useState } from "react";
import { FaBook, FaUsers, FaRupeeSign, FaChartLine, FaLock } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { TeacherProfile } from "@/data/types";

export default function TeacherDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return;

            if (!user?.email) {
                setChecking(false);
                return;
            }

            try {
                const teacherDoc = await getDoc(doc(db, 'teachers', user.email));
                if (teacherDoc.exists()) {
                    setIsAuthorized(true);
                    setTeacherProfile(teacherDoc.data() as TeacherProfile);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Error verifying teacher access:", error);
                setIsAuthorized(false);
            } finally {
                setChecking(false);
            }
        }

        checkAccess();
    }, [user, authLoading]);

    if (authLoading || checking) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Verifying Access...</div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <FaLock className="text-6xl text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h1>
                <p className="text-slate-500 mb-6">Please login with your authorized gmail account.</p>
                <div className="flex gap-4">
                    <Link href="/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Login</Link>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <FaLock className="text-6xl text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                <p className="text-slate-500 mb-6 max-w-md">
                    This area is restricted to authorized teachers only.
                    Please contact the Super Admin to authorize <b>{user.email}</b>.
                </p>
                <Link href="/" className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <header className="flex justify-between items-center border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
                    <p className="text-slate-500 text-sm">Welcome, <span className="font-bold text-indigo-600">{teacherProfile?.name}</span> ({teacherProfile?.subject})</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value="1,240"
                    trend="+12%"
                    icon={<FaUsers className="h-5 w-5 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Active Batches"
                    value="4"
                    trend="Active"
                    icon={<FaBook className="h-5 w-5 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <StatCard
                    title="This Month Revenue"
                    value="₹45,200"
                    trend="+8%"
                    icon={<FaRupeeSign className="h-5 w-5 text-green-600" />}
                    bg="bg-green-50"
                />
                <StatCard
                    title="Avg. Attendance"
                    value="85%"
                    trend="+2%"
                    icon={<FaChartLine className="h-5 w-5 text-orange-600" />}
                    bg="bg-orange-50"
                />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <button className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
                    + Create New Batch
                </button>
                <button className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                    Go Live Now
                </button>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, icon, bg }: any) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                    {icon}
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    )
}
