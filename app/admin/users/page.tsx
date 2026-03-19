'use client'

import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HiSearch, HiUserCircle, HiBadgeCheck, HiBan, HiRefresh } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { ImSpinner2 } from 'react-icons/im'

const ADMIN_SECRET = 'padhaku-admin-2024';

interface UserRow {
    uid: string
    displayName: string
    email: string
    photoURL: string | null
    board: string
    class: string
    createdAt: number
    subscription: { plan: string; status: string; expiryDate?: number }
    role: string
}

export default function UserManagementPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchedUser, setSearchedUser] = useState<UserRow | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // All users list
    const [allUsers, setAllUsers] = useState<UserRow[]>([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [filterPlan, setFilterPlan] = useState<'all' | 'pro' | 'free'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const loadAllUsers = async () => {
        setUsersLoading(true)
        try {
            const res = await fetch(`/api/admin/list-users?secret=${ADMIN_SECRET}`)
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            setAllUsers(data.users || [])
        } catch (error) {
            console.error('Error loading users:', error)
            toast.error('Failed to load users list.')
        } finally {
            setUsersLoading(false)
        }
    }

    useEffect(() => {
        loadAllUsers()
    }, [])

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
                const data = docSnap.data()
                setSearchedUser({
                    uid: docSnap.id,
                    displayName: data.displayName || data.name || 'Unknown',
                    email: data.email || '',
                    photoURL: data.photoURL || null,
                    board: data.board || '-',
                    class: data.class || '-',
                    createdAt: data.createdAt || 0,
                    subscription: data.subscription || { plan: 'free', status: 'active' },
                    role: data.role || 'user',
                })
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

    const grantProAccess = async (targetUser: UserRow) => {
        if (!confirm(`Are you sure you want to GRANT Pro access to ${targetUser.displayName || targetUser.email}?`)) return

        setActionLoading(true)
        try {
            const userRef = doc(db, 'users', targetUser.uid)
            const startDate = Date.now()
            const expiryDate = startDate + (30 * 24 * 60 * 60 * 1000)

            await updateDoc(userRef, {
                subscription: { plan: 'pro', status: 'active', startDate, expiryDate, autoRenew: false }
            })

            if (searchedUser?.uid === targetUser.uid) {
                setSearchedUser(prev => prev ? { ...prev, subscription: { plan: 'pro', status: 'active', expiryDate } } : null)
            }

            // Update in allUsers list too
            setAllUsers(prev => prev.map(u => u.uid === targetUser.uid
                ? { ...u, subscription: { plan: 'pro', status: 'active', expiryDate } }
                : u
            ))

            toast.success('Pro access granted successfully!')
        } catch (error) {
            console.error('Error granting access:', error)
            toast.error('Failed to grant access.')
        } finally {
            setActionLoading(false)
        }
    }

    const revokeProAccess = async (targetUser: UserRow) => {
        if (!confirm(`Are you sure you want to REVOKE Pro access from ${targetUser.displayName || targetUser.email}?`)) return

        setActionLoading(true)
        try {
            const userRef = doc(db, 'users', targetUser.uid)
            await updateDoc(userRef, {
                subscription: { plan: 'free', status: 'active', startDate: Date.now() }
            })

            if (searchedUser?.uid === targetUser.uid) {
                setSearchedUser(prev => prev ? { ...prev, subscription: { plan: 'free', status: 'active' } } : null)
            }

            setAllUsers(prev => prev.map(u => u.uid === targetUser.uid
                ? { ...u, subscription: { plan: 'free', status: 'active' } }
                : u
            ))

            toast.success('Pro access revoked.')
        } catch (error) {
            console.error('Error revoking access:', error)
            toast.error('Failed to revoke access.')
        } finally {
            setActionLoading(false)
        }
    }

    const isPro = (u: UserRow) => u.subscription?.plan === 'pro'

    const filteredUsers = allUsers.filter(u => {
        const matchesPlan = filterPlan === 'all' || (filterPlan === 'pro' ? isPro(u) : !isPro(u))
        const matchesSearch = !searchQuery ||
            u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesPlan && matchesSearch
    })

    const proCount = allUsers.filter(u => isPro(u)).length

    return (
        <div className="min-h-screen bg-pw-surface p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-pw-violet mb-2">User Management</h1>
                        <p className="text-gray-500">View, search, and manage all user subscriptions.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center px-4 py-2 bg-white rounded-xl border border-pw-border shadow-sm">
                            <p className="text-2xl font-bold text-pw-indigo">{allUsers.length}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Users</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl shadow-sm">
                            <p className="text-2xl font-bold text-amber-600">{proCount}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Pro Members</p>
                        </div>
                    </div>
                </div>

                {/* Quick Search Box */}
                <div className="bg-white p-6 rounded-3xl shadow-pw-md border border-pw-border mb-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Search by Email</h2>
                    <form onSubmit={searchUser} className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="email"
                                placeholder="Enter user email address..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-pw-indigo focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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

                {/* Searched User Result Card */}
                {searchedUser && (
                    <div className="bg-white p-8 rounded-3xl shadow-pw-lg border border-pw-border animate-fade-in-up mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Search Result</h2>
                        <UserCard user={searchedUser} onGrant={() => grantProAccess(searchedUser)} onRevoke={() => revokeProAccess(searchedUser)} actionLoading={actionLoading} />
                    </div>
                )}

                {/* All Users Table */}
                <div className="bg-white rounded-3xl shadow-pw-md border border-pw-border overflow-hidden">
                    <div className="p-6 border-b border-pw-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <h2 className="text-xl font-bold text-pw-violet">All Users ({filteredUsers.length})</h2>
                        <div className="flex flex-wrap gap-3">
                            {/* Filter tabs */}
                            <div className="flex bg-pw-surface rounded-xl p-1 border border-pw-border">
                                {(['all', 'pro', 'free'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilterPlan(f)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${filterPlan === f ? 'bg-pw-indigo text-white shadow' : 'text-gray-500 hover:text-pw-violet'}`}
                                    >
                                        {f === 'all' ? 'All' : f === 'pro' ? '⭐ Pro' : '🆓 Free'}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <div className="relative">
                                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter name/email..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-pw-indigo outline-none"
                                />
                            </div>
                            <button
                                onClick={loadAllUsers}
                                disabled={usersLoading}
                                className="p-2 text-pw-indigo hover:bg-pw-surface rounded-xl border border-pw-border transition-colors"
                                title="Refresh"
                            >
                                <HiRefresh className={usersLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="py-20 text-center">
                            <ImSpinner2 className="animate-spin text-3xl text-pw-indigo mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                            <HiUserCircle className="text-5xl mx-auto mb-3 text-gray-200" />
                            <p className="font-medium">No users found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-pw-surface border-b border-pw-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Board/Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pw-border">
                                    {filteredUsers.map(u => (
                                        <tr key={u.uid} className="hover:bg-pw-surface/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-pw-indigo/10 flex items-center justify-center text-pw-indigo font-bold text-sm">
                                                            {(u.displayName || u.email)[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{u.displayName}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {u.board !== '-' ? `${u.board} / ${u.class}` : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isPro(u) ? (
                                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                        <HiBadgeCheck /> PRO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                                                        FREE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isPro(u) ? (
                                                    <button
                                                        onClick={() => grantProAccess(u)}
                                                        disabled={actionLoading}
                                                        className="text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Grant Pro
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => revokeProAccess(u)}
                                                        disabled={actionLoading}
                                                        className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function UserCard({ user, onGrant, onRevoke, actionLoading }: {
    user: UserRow; onGrant: () => void; onRevoke: () => void; actionLoading: boolean
}) {
    const pro = user.subscription?.plan === 'pro'
    return (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="shrink-0">
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-full object-cover border-4 border-pw-surface" />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-pw-indigo/10 flex items-center justify-center text-pw-indigo font-bold text-2xl border-4 border-pw-surface">
                        {(user.displayName || user.email)[0]?.toUpperCase()}
                    </div>
                )}
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.displayName || 'Unnamed User'}</h2>
                <p className="text-gray-500 font-medium mb-4">{user.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                    <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold block mb-1">Board / Class</span>
                        <span className="font-semibold text-gray-700">{user.board?.toUpperCase() || '-'} / {user.class || '-'}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${pro ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold block mb-1">Current Plan</span>
                        <span className={`font-bold ${pro ? 'text-amber-600' : 'text-gray-600'} flex items-center gap-1`}>
                            {pro && <HiBadgeCheck className="text-lg" />}
                            {pro ? 'PRO MEMBER' : 'FREE TIER'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6 justify-center md:justify-start">
                    {!pro ? (
                        <button onClick={onGrant} disabled={actionLoading}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                            {actionLoading ? <ImSpinner2 className="animate-spin text-xl" /> : <><HiBadgeCheck className="text-xl" /> Grant Free Pro Access</>}
                        </button>
                    ) : (
                        <button onClick={onRevoke} disabled={actionLoading}
                            className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70">
                            {actionLoading ? <ImSpinner2 className="animate-spin text-xl" /> : <><HiBan className="text-xl" /> Revoke Pro Access</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
