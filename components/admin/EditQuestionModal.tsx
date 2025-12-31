'use client'

import React, { useState, useEffect } from 'react'
import { HiX, HiSave } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { Board, Class, Question, Subject } from '@/data/types'

interface EditQuestionModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (id: string, data: Partial<Question>) => Promise<void>
    question: Question | null
}

export default function EditQuestionModal({ isOpen, onClose, onSave, question }: EditQuestionModalProps) {
    const [formData, setFormData] = useState<Partial<Question>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (question) {
            setFormData({ ...question })
        }
    }, [question])

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(formData.options || [])]
        newOptions[index] = value
        setFormData({ ...formData, options: newOptions })
    }

    const handleSave = async () => {
        if (!question || !question.id) return
        setSaving(true)
        try {
            await onSave(question.id, formData)
            onClose()
        } catch (error) {
            console.error("Failed to save", error)
            alert("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen || !question) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">Edit Question</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <HiX className="text-xl" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Board</label>
                            <select
                                value={formData.board || 'cbse'}
                                onChange={e => setFormData({ ...formData, board: e.target.value as Board })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                <option value="cbse">CBSE</option>
                                <option value="icse">ICSE</option>
                                <option value="bseb">BSEB</option>
                                <option value="up">UP Board</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Class</label>
                            <select
                                value={formData.class || '10'}
                                onChange={e => setFormData({ ...formData, class: e.target.value as Class })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            >
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Subject</label>
                            <input
                                type="text"
                                value={formData.subject || ''}
                                onChange={e => setFormData({ ...formData, subject: e.target.value as Subject })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Chapter</label>
                            <input
                                type="text"
                                value={formData.chapter || ''}
                                onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Question Text</label>
                        <textarea
                            rows={3}
                            value={formData.question || ''}
                            onChange={e => setFormData({ ...formData, question: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Options</label>
                        <div className="grid grid-cols-1 gap-3">
                            {formData.options?.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <span className="w-6 text-center font-bold text-slate-400">{String.fromCharCode(65 + idx)}</span>
                                    <input
                                        type="text"
                                        value={opt || ''}
                                        onChange={e => handleOptionChange(idx, e.target.value)}
                                        className={`flex-1 p-2 border rounded-lg ${formData.correctAnswer === idx ? 'border-green-500 ring-1 ring-green-500 bg-green-50' : 'border-slate-300'}`}
                                    />
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={formData.correctAnswer === idx}
                                        onChange={() => setFormData({ ...formData, correctAnswer: idx })}
                                        className="w-4 h-4 accent-green-600 cursor-pointer"
                                        title="Mark as correct"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Explanation</label>
                        <textarea
                            rows={2}
                            value={formData.explanation || ''}
                            onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-600"
                            placeholder="Optional explanation..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><HiSave /> Save Changes</>}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
