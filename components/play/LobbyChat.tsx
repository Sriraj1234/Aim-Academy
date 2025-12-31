'use client'

import React, { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa'

interface Message {
    id: string
    text: string
    senderId: string
    senderName: string
    timestamp: any
}

interface LobbyChatProps {
    roomId: string
    currentUser: {
        uid: string
        displayName: string
        photoURL?: string
    }
}

export const LobbyChat = ({ roomId, currentUser }: LobbyChatProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        const messagesRef = collection(db, 'rooms', roomId, 'messages')
        const q = query(messagesRef, orderBy('timestamp', 'asc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message))
            setMessages(msgs)
            setTimeout(scrollToBottom, 100) // Small delay to ensure render
        })

        return () => unsubscribe()
    }, [roomId])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: newMessage.trim(),
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                timestamp: serverTimestamp()
            })
            setNewMessage('')
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    return (
        <div className="flex flex-col h-[400px] bg-white rounded-3xl border border-pw-border shadow-pw-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-pw-border bg-pw-surface/50">
                <h3 className="font-bold text-pw-violet flex items-center gap-2">
                    <span className="text-xl">💬</span> Lobby Chat
                </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-pw-surface/30">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <span className="text-4xl mb-2">👋</span>
                        <p className="text-sm font-medium">Say hello to your friends!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.uid
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                        ? 'bg-pw-indigo text-white rounded-br-none'
                                        : 'bg-white border border-pw-border text-gray-800 rounded-bl-none'
                                    }`}>
                                    {!isMe && (
                                        <p className="text-[10px] font-bold opacity-60 mb-0.5">{msg.senderName}</p>
                                    )}
                                    <p>{msg.text}</p>
                                </div>
                            </motion.div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-pw-border flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-pw-surface rounded-xl border border-transparent focus:border-pw-indigo focus:bg-white focus:ring-2 focus:ring-pw-indigo/20 outline-none transition-all text-sm font-medium"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-pw-indigo text-white rounded-xl shadow-md hover:bg-pw-violet disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FaPaperPlane className="text-sm" />
                </button>
            </form>
        </div>
    )
}
