'use client'

import React, { useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserProfile } from '@/data/types'
import { HiSearch, HiUserCircle, HiBadgeCheck, HiBan } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { ImSpinner2 } from 'react-icons/im'

export default function UserManagementPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    const searchUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setLoading(true)
        setSearchedUser(null)
        try {
            const usersRef = collection(db, 'users')
            const q = query(usersRef, where('email', '==', email.trim()))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0]
                setSearchedUser(docSnap.data() as UserProfile)
            } else {
                toast.error('User not found with this email.')
            }
        } catch (error) {
            console.error('Error searching user:', error)
            toast.error('Error searching user.')
        } finally {
            setLoading(false)
        }
    }

    const grantProAccess = async () => {
        if (!searchedUser) return
        if (!confirm(`Are you sure you want to GRANT Pro access to ${searchedUser.displayName || searchedUser.email}?`)) return

        setActionLoading(true)
        try {
            const userRef = doc(db, 'users', searchedUser.uid)

            // 1 Year Pro Access
            const startDate = Date.now()
            const expiryDate = startDate + (365 * 24 * 60 * 60 * 1000)

            await updateDoc(userRef, {
                subscription: {
                    plan: 'pro',
                    status: 'active',
                    startDate: startDate,
                    expiryDate: expiryDate,
                    autoRenew: false // Manual grant usually doesn't auto-renew via payment gateway
                }
            })

            // Update local state to reflect change immediately
            setSearchedUser(prev => prev ? ({
                ...prev,
                subscription: {
                    plan: 'pro',
                    status: 'active',
                    startDate,
                    expiryDate,
                    autoRenew: false
                }
            } as UserProfile) : null)

            toast.success('Pro access granted successfully!')
        } catch (error) {
            console.error('Error granting access:', error)
            toast.error('Failed to grant access.')
        } finally {
            setActionLoading(false)
        }
    }

    const revokeProAccess = async () => {
        if (!searchedUser) return
        if (!confirm(`Are you sure you want to REVOKE Pro access from ${searchedUser.displayName || searchedUser.email}?`)) return

        setActionLoading(true)
        try {
            const userRef = doc(db, 'users', searchedUser.uid)

            await updateDoc(userRef, {
                subscription: {
                    plan: 'free',
                    status: 'active',
                    startDate: Date.now()
                }
            })

            // Update local state
            setSearchedUser(prev => prev ? ({
                ...prev,
                subscription: {
                    ...prev.subscription,
                    plan: 'free',
                    status: 'active'
                }
            } as UserProfile) : null)

            toast.success('Pro access revoked.')
        } catch (error) {
            console.error('Error revoking access:', error)
            toast.error('Failed to revoke access.')
        } finally {
            setActionLoading(false)
        }
    }

    const isPro = searchedUser?.subscription?.plan === 'pro'

    return (
        <div className="min-h-screen bg-pw-surface p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-pw-violet mb-2">User Management</h1>
                    <p className="text-gray-500">Search for users and manage their subscription status manually.</p>
                </div>

                {/* Search Box */}
                <div className="bg-white p-6 rounded-3xl shadow-pw-md border border-pw-border mb-8">
                    <form onSubmit={searchUser} className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="email"
                                placeholder="Enter user email address..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-pw-violet text-white px-8 py-4 rounded-xl font-bold hover:bg-pw-indigo transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <ImSpinner2 className="animate-spin text-xl" /> : 'Search'}
                        </button>
                    </form>
                </div>

                {/* User Result Card */}
                {searchedUser && (
                    <div className="bg-white p-8 rounded-3xl shadow-pw-lg border border-pw-border animate-fade-in-up">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

                            {/* Avatar */}
                            <div className="shrink-0">
                                {searchedUser.photoURL ? (
                                    <img src={searchedUser.photoURL} alt={searchedUser.displayName || 'User'} className="w-24 h-24 rounded-full object-cover border-4 border-pw-surface" />
                                ) : (
                                    <HiUserCircle className="w-24 h-24 text-gray-300" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">{searchedUser.displayName || 'Unnamed User'}</h2>
                                <p className="text-gray-500 font-medium mb-4">{searchedUser.email}</p>

                                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                                    <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold block mb-1">Board / Class</span>
                                        <span className="font-semibold text-gray-700">{searchedUser.board?.toUpperCase() || '-'} / {searchedUser.class || '-'}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg border ${isPro ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold block mb-1">Current Plan</span>
                                        <span className={`font-bold ${isPro ? 'text-amber-600' : 'text-gray-600'} flex items-center gap-1`}>
                                            {isPro && <HiBadgeCheck className="text-lg" />}
                                            {searchedUser.subscription?.plan === 'pro' ? 'PRO MEMBER' : 'FREE TIER'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6 justify-center md:justify-start">
                                    {!isPro ? (
                                        <button
                                            onClick={grantProAccess}
                                            disabled={actionLoading}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {actionLoading ? <ImSpinner2 className="animate-spin text-xl" /> : (
                                                <>
                                                    <HiBadgeCheck className="text-xl" />
                                                    Grant Free Pro Access
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={revokeProAccess}
                                            disabled={actionLoading}
                                            className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {actionLoading ? <ImSpinner2 className="animate-spin text-xl" /> : (
                                                <>
                                                    <HiBan className="text-xl" />
                                                    Revoke Pro Access
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
