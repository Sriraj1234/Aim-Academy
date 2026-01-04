import React, { useState, useEffect } from 'react';
import { FaBell, FaPaperPlane, FaUsers, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);
    const [stats, setStats] = useState<{ totalUsers: number, eligibleUsers: number, withToken: number } | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/notifications/stats');
            const data = await res.json();
            if (res.ok) {
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    // Predefined templates
    const templates = [
        {
            name: '📚 Free Content',
            title: '📚 Free Study Content!',
            body: 'Study Hub mein FREE padhai ka content available hai! 🎯📖✨ Abhi check karo!'
        },
        {
            name: '🔥 Streak Reminder',
            title: '🔥 Don\'t Break Your Streak!',
            body: 'Aaj practice karke apna streak maintain karo! 💪🎯'
        },
        {
            name: '🆕 New Feature',
            title: '🆕 Exciting Update!',
            body: 'Padhaku mein nayi feature aa gayi hai! Abhi explore karo! 🚀✨'
        },
        {
            name: '📝 Exam Reminder',
            title: '📝 Exam Aa Raha Hai!',
            body: 'Board exams ki taiyari shuru karo! Practice Zone mein daily questions solve karo 📖💯'
        },
    ];

    const handleSendToAll = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Title aur Body dono required hai!');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/notifications/send', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body })
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ sent: data.sent, failed: data.failed });
                toast.success(`✅ ${data.sent} users ko notification bheji gayi!`);
                setTitle('');
                setBody('');
            } else {
                toast.error(data.error || 'Notification bhejne mein error!');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Network error! Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = (template: typeof templates[0]) => {
        setTitle(template.title);
        setBody(template.body);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FaBell className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Push Notifications</h1>
                            <p className="text-white/80 text-sm">Sabhi subscribed users ko notification bhejo</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Users</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats?.withToken || 0}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">With Token</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats?.eligibleUsers || 0}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Eligible</div>
                    </div>
                </div>

                {/* Quick Templates */}
                <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">⚡ Quick Templates</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {templates.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => applyTemplate(t)}
                                className="text-left p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm transition-colors border border-transparent hover:border-indigo-200"
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="📚 Free Study Content!"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message Body
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Study Hub mein FREE content available hai! 🎯"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Preview */}
                        {(title || body) && (
                            <div className="bg-gray-100 rounded-xl p-4">
                                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                <div className="bg-white rounded-lg p-3 shadow-sm flex items-start gap-3">
                                    <img src="/padhaku-192.png" alt="icon" className="w-10 h-10 rounded-lg" />
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{title || 'Title'}</p>
                                        <p className="text-gray-600 text-xs mt-0.5">{body || 'Message body'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={handleSendToAll}
                            disabled={loading || !title.trim() || !body.trim()}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FaPaperPlane />
                                    Send to All Users
                                </>
                            )}
                        </button>

                        {/* Result */}
                        {result && (
                            <div className="flex gap-4 justify-center text-sm">
                                <div className="flex items-center gap-1 text-green-600">
                                    <FaCheckCircle />
                                    <span>{result.sent} sent</span>
                                </div>
                                {result.failed && result.failed > 0 && (
                                    <div className="flex items-center gap-1 text-red-500">
                                        <FaTimesCircle />
                                        <span>{result.failed} failed</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 items-start">
                    <FaInfoCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-800">
                            Why 0 users sent?
                        </p>
                        <p className="text-xs text-amber-700">
                            Notifications are only sent to users who have:
                            <br />1. Logged in and granted notification permission (FCM token saved).
                            <br />2. Have 'notificationsEnabled' set to true.
                            <br />
                            <strong>Solution:</strong> Ask users to login and click "Enable Notifications" in their profile/header settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
