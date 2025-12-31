'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { Button } from '@/components/shared/Button'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

export default function SetupAdminPage() {
    const { user } = useAuth()
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const makeMeAdmin = async () => {
        if (!user) {
            setStatus('error')
            setMessage('You are not logged in. Please login first.')
            return
        }

        setStatus('loading')
        try {
            const userRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                // Update existing user
                await updateDoc(userRef, {
                    role: 'admin'
                })
            } else {
                // Create user doc if it doesn't exist
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                })
            }

            setStatus('success')
            setMessage(`Success! User ${user.email} is now an Admin.`)
        } catch (error: any) {
            console.error('Error setting admin role:', error)
            setStatus('error')
            setMessage(error.message || 'Failed to update role.')
        }
    }

    const verifyAdminAccess = async () => {
        setStatus('loading')
        setMessage('Testing database access...')
        try {
            // Try to create a dummy document in 'questions' (Admin Only)
            // We use a specific ID to avoid clutter
            const testRef = doc(db, 'questions', '_admin_test_')
            await setDoc(testRef, {
                test: true,
                updatedAt: new Date().toISOString(),
                by: user?.email
            })

            setStatus('success')
            setMessage('VERIFIED: You have full Admin access to the database!')
        } catch (error: any) {
            console.error('Verification failed:', error)
            setStatus('error')
            if (error.code === 'permission-denied') {
                setMessage('FAILED: Permission Denied. Did you Publish the rules in Console yet?')
            } else {
                setMessage(`Error: ${error.message}`)
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#110c1d] text-white p-4">
            <div className="max-w-md w-full bg-[#1f1b2e] p-8 rounded-2xl border border-[#2e2a3e] text-center">
                <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>

                {!user ? (
                    <div className="text-yellow-400 mb-6 flex flex-col items-center gap-2">
                        <HiExclamationCircle className="text-4xl" />
                        <p>Please login to the app first.</p>
                    </div>
                ) : (
                    <div className="mb-6">
                        <p className="text-gray-400 mb-2">Logged in as:</p>
                        <p className="font-mono bg-[#110c1d] p-2 rounded text-green-400">{user.email}</p>
                    </div>
                )}

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl mb-6 flex items-center gap-3 text-green-400 text-left">
                        <HiCheckCircle className="text-2xl flex-shrink-0" />
                        <div>
                            <p className="font-bold">You are now an Admin!</p>
                            <p className="text-sm opacity-80">You can now access the admin panel and edit database rules.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button
                            onClick={makeMeAdmin}
                            loading={status === 'loading'}
                            disabled={!user}
                            className="w-full !bg-purple-600 hover:!bg-purple-700"
                        >
                            Step 1: Make Me Admin
                        </Button>

                        <div className="text-sm text-gray-400 py-2">
                            After clicking above, go to Console and Publish the rules. Then come back and click below:
                        </div>

                        <Button
                            onClick={verifyAdminAccess}
                            loading={status === 'loading'}
                            disabled={!user}
                            className="w-full !bg-green-600 hover:!bg-green-700"
                        >
                            Step 2: Verify Access
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-4 text-red-400 text-sm">
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
