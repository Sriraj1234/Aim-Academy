'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaBell, FaCheck, FaTrash } from 'react-icons/fa'
import { useNotifications } from '@/hooks/useNotifications'
import { useState } from 'react'

interface NotificationsDrawerProps {
    isOpen: boolean
    onClose: () => void
}

interface NotificationItem {
    id: string
    title: string
    message: string
    time: string
    read: boolean
    type: 'info' | 'success' | 'warning'
}

export const NotificationsDrawer = ({ isOpen, onClose }: NotificationsDrawerProps) => {
    const { permission, requestPermission, isSupported } = useNotifications()
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: '1',
            title: 'Welcome to Padhaku!',
            message: 'Start your journey by taking your first quiz today.',
            time: 'Just now',
            read: false,
            type: 'success'
        },
        {
            id: '2',
            title: 'Daily Streak',
            message: 'Don\'t forget to maintain your 3-day streak! 🔥',
            time: '2 hours ago',
            read: true,
            type: 'info'
        }
    ])

    const handleEnable = async () => {
        await requestPermission()
    }

    const clearAll = () => {
        setNotifications([])
    }

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaBell className="text-pw-indigo" />
                                Notifications
                            </h2>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Permission Status */}
                        {isSupported && permission !== 'granted' && (
                            <div className="p-4 bg-pw-indigo/5 border-b border-pw-indigo/10">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pw-indigo/10 flex items-center justify-center flex-shrink-0">
                                        <FaBell className="text-pw-indigo text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 text-sm">Enable Notifications</h3>
                                        <p className="text-xs text-gray-600 mt-1 mb-3">
                                            Get updates about quizzes, study materials, and your daily streak.
                                        </p>
                                        <button
                                            onClick={handleEnable}
                                            className="text-xs font-semibold bg-pw-indigo text-white px-4 py-2 rounded-lg hover:bg-pw-indigo-dark transition-colors w-full sm:w-auto"
                                        >
                                            Allow Notifications
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FaBell className="text-2xl text-gray-400" />
                                    </div>
                                    <p className="font-medium">No notifications yet</p>
                                    <p className="text-sm mt-1 text-gray-400">We'll notify you when something important happens.</p>
                                </div>
                            ) : (
                                notifications.map((note) => (
                                    <motion.div
                                        key={note.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => markAsRead(note.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${note.read
                                                ? 'bg-white border-gray-100'
                                                : 'bg-indigo-50/30 border-indigo-100'
                                            }`}
                                    >
                                        {!note.read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
                                        )}
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${note.type === 'success' ? 'bg-green-100 text-green-600' :
                                                    note.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                }`}>
                                                {note.type === 'success' ? '🎉' :
                                                    note.type === 'warning' ? '⚠️' : 'ℹ️'}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-semibold mb-1 ${note.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                    {note.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    {note.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                    {note.time}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
