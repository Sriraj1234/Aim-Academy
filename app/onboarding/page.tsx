'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/hooks/useAuth'
import { FaCheckCircle, FaLocationArrow } from 'react-icons/fa'
import { useLocation } from '@/hooks/useLocation'

type Board = 'bseb' | 'cbse' | 'icse' | 'up' | 'mp' | 'maharashtra' | 'rbse' | 'jac' | 'uk' | 'wb' | 'other';
type Class = '9' | '10' | '11' | '12';

export default function OnboardingPage() {
    const { user, updateProfile } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState(1)

    // Step 1: Board
    const [selectedBoard, setSelectedBoard] = useState<Board>('bseb')

    // Step 2: Class
    const [selectedClass, setSelectedClass] = useState<Class>('10')

    // Step 3: Stream (Only if 11/12)
    const [selectedStream, setSelectedStream] = useState<'science' | 'commerce' | 'arts'>('science')
    const [isLoading, setIsLoading] = useState(false)

    // Step 4: Location
    const [pincode, setPincode] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [locality, setLocality] = useState('')
    const [fetchingLocation, setFetchingLocation] = useState(false)
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number, accuracy?: number } | undefined>(undefined)

    const { detectLocation, loading: locationLoading, error: locationError } = useLocation()

    const handleAutoDetectLocation = async () => {
        try {
            const data = await detectLocation();
            let finalPincode = data.pincode;

            // Fallback: If no pincode but we have locality, try fetching it
            if (!finalPincode && data.locality) {
                try {
                    const res = await fetch(`https://api.postalpincode.in/postoffice/${data.locality}`);
                    const pinData = await res.json();
                    if (pinData[0]?.Status === 'Success' && pinData[0]?.PostOffice?.length > 0) {
                        finalPincode = pinData[0].PostOffice[0].Pincode;
                    }
                } catch (err) {
                    // Ignore fallback error
                }
            }

            if (finalPincode) {
                // Sanitize pincode for button validation
                const clean = finalPincode.replace(/\D/g, '');
                setPincode(clean);
            }
            if (data.city) setCity(data.city);
            if (data.state) setState(data.state);
            if (data.locality) setLocality(data.locality);

            if (data.latitude && data.longitude) {
                setCoordinates({
                    lat: data.latitude,
                    lng: data.longitude,
                    accuracy: data.accuracy
                });
            }
        } catch (e) {
            // Error is handled in hook state
        }
    }

    // Boards List
    const boards: { id: Board, name: string, full: string }[] = [
        { id: 'bseb', name: 'BSEB', full: 'Bihar School Examination Board' },
        { id: 'cbse', name: 'CBSE', full: 'Central Board of Secondary Education' },
        { id: 'icse', name: 'ICSE', full: 'Indian Certificate of Secondary Education' },
        { id: 'up', name: 'UP Board', full: 'Uttar Pradesh Madhyamik Shiksha Parishad' },
        { id: 'mp', name: 'MP Board', full: 'Madhya Pradesh Board of Secondary Education' },
        { id: 'maharashtra', name: 'Maharashtra', full: 'Maharashtra State Board' },
        { id: 'rbse', name: 'RBSE', full: 'Rajasthan Board of Secondary Education' },
        { id: 'jac', name: 'JAC', full: 'Jharkhand Academic Council' },
        { id: 'uk', name: 'UK Board', full: 'Uttarakhand Board of School Education' },
        { id: 'wb', name: 'WB Board', full: 'West Bengal Council of Higher Secondary Education' },
        { id: 'other', name: 'Other', full: 'Other State Boards' },
    ]

    const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPincode(val);

        if (val.length === 6) {
            setFetchingLocation(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                const data = await res.json();
                if (data[0].Status === 'Success') {
                    const details = data[0].PostOffice[0];
                    setCity(details.District);
                    setState(details.State);
                    if (details.Block && details.Block !== "NA") {
                        setLocality(details.Block);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch location", err);
            } finally {
                setFetchingLocation(false);
            }
        } else {
            setCity('');
            setState('');
            setLocality('');
        }
    }

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (selectedClass === '11' || selectedClass === '12') {
                setStep(3);
            } else {
                setStep(4); // Skip stream, go to location
            }
        } else if (step === 3) {
            setStep(4);
        } else {
            handleFinish();
        }
    }

    const handleFinish = async () => {
        if (!user) {
            // User is not logged in yet (came from Get Started)
            // Save state to local storage so we can restore it later (optional enhancement for later, but for now just redirect)
            // alert("Please login to complete your profile setup.");
            router.push('/login?message=Please login to complete setup');
            return;
        }
        setIsLoading(true);
        try {
            const profileData: any = {
                board: selectedBoard,
                class: selectedClass,
                pincode,
                locality,
                city,
                state,
                onboardingCompleted: true
            };

            if (coordinates) {
                profileData.coordinates = coordinates;
            }

            if (selectedClass === '11' || selectedClass === '12') {
                profileData.stream = selectedStream;
            }

            await updateProfile(profileData);
            router.push('/');
        } catch (error) {
            console.error(error);
            alert("Failed to save profile.");
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-pw-surface flex flex-col items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full">
                <AnimatePresence mode="wait">
                    {/* ... Step 1, 2, 3 ... */}
                    {/* STEP 1: SELECT BOARD */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-display font-black text-pw-violet mb-2">Select your Board</h1>
                                <p className="text-pw-indigo font-medium">We'll personalize your learning experience based on this.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {boards.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBoard(b.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left group hover:shadow-pw-md
                                            ${selectedBoard === b.id
                                                ? 'border-pw-indigo bg-white shadow-pw-md'
                                                : 'border-pw-border bg-white hover:border-pw-indigo/50'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`font-bold text-lg ${selectedBoard === b.id ? 'text-pw-indigo' : 'text-pw-violet'}`}>
                                                {b.name}
                                            </h3>
                                            {selectedBoard === b.id && <FaCheckCircle className="text-pw-indigo" />}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{b.full}</p>
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleNext} className="w-full bg-pw-indigo hover:bg-pw-violet text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-pw-indigo/30 transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                Continue
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: SELECT CLASS */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-display font-black text-pw-violet mb-2">Select your Class</h1>
                                <p className="text-pw-indigo font-medium">Which grade are you currently studying in?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {['9', '10', '11', '12'].map((cls) => (
                                    <button
                                        key={cls}
                                        onClick={() => setSelectedClass(cls as Class)}
                                        className={`p-6 rounded-2xl border-2 transition-all text-center hover:scale-[1.02]
                                            ${selectedClass === cls
                                                ? 'border-pw-indigo bg-white shadow-pw-lg'
                                                : 'border-pw-border bg-white hover:border-pw-indigo/50'}`}
                                    >
                                        <span className={`block text-5xl font-black mb-2 ${selectedClass === cls ? 'text-pw-indigo' : 'text-pw-violet'}`}>{cls}th</span>
                                        <span className="text-sm text-gray-400 uppercase font-bold tracking-wider">Standard</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-pw-border hover:bg-pw-surface text-pw-violet py-4 rounded-xl font-bold transition-colors">
                                    Back
                                </button>
                                <button onClick={handleNext} className="flex-[2] bg-pw-indigo hover:bg-pw-violet text-white py-4 rounded-xl font-bold shadow-lg shadow-pw-indigo/30 transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: STREAM (Conditional) */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-display font-black text-pw-violet mb-2">Select Stream</h1>
                                <p className="text-pw-indigo font-medium">What is your major subject stream?</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {['science', 'commerce', 'arts'].map((str) => (
                                    <button
                                        key={str}
                                        onClick={() => setSelectedStream(str as any)}
                                        className={`p-6 rounded-xl border-2 transition-all flex items-center justify-between capitalize group hover:shadow-pw-md
                                            ${selectedStream === str
                                                ? 'border-pw-indigo bg-white shadow-pw-md'
                                                : 'border-pw-border bg-white hover:border-pw-indigo/50'}`}
                                    >
                                        <span className={`font-bold text-xl ${selectedStream === str ? 'text-pw-indigo' : 'text-pw-violet'}`}>{str}</span>
                                        {selectedStream === str && <FaCheckCircle className="text-pw-indigo text-xl" />}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 bg-white border border-pw-border hover:bg-pw-surface text-pw-violet py-4 rounded-xl font-bold transition-colors">
                                    Back
                                </button>
                                <button onClick={handleNext} className="flex-[2] bg-pw-indigo hover:bg-pw-violet text-white py-4 rounded-xl font-bold shadow-lg shadow-pw-indigo/30 transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: LOCATION */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-display font-black text-pw-violet mb-2">Location</h1>
                                <p className="text-pw-indigo font-medium">Enter your Pincode to see local rankings & content.</p>
                            </div>

                            <div className="max-w-xs mx-auto space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={handlePincodeChange}
                                        maxLength={6}
                                        placeholder="Ex: 110001"
                                        className="w-full text-center text-3xl font-bold tracking-widest p-4 rounded-xl border-2 border-pw-border focus:border-pw-indigo focus:ring-4 focus:ring-pw-indigo/20 bg-white outline-none transition-all placeholder:text-gray-300 text-pw-violet"
                                    />
                                    {fetchingLocation && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-t-2 border-pw-indigo"></div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAutoDetectLocation}
                                    disabled={locationLoading}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-pw-indigo bg-pw-surface hover:bg-pw-lavender/20 py-3 rounded-xl transition-colors border border-pw-indigo/20"
                                >
                                    {locationLoading ? (
                                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-pw-indigo"></span>
                                    ) : (
                                        <FaLocationArrow />
                                    )}
                                    {locationLoading ? 'Detecting...' : 'Auto Detect Location'}
                                </button>
                                {locationError && <p className="text-red-500 text-xs text-center font-bold bg-red-50 py-1 rounded">{locationError}</p>}

                                {(city || state) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center relative shadow-sm"
                                    >
                                        <p className="font-bold text-lg">
                                            {locality ? `${locality}, ` : ''}{city}
                                        </p>
                                        <p className="text-sm opacity-80 font-medium">{state}</p>

                                        {coordinates?.accuracy && (
                                            <div className="mt-2 inline-flex items-center gap-1 bg-white/80 px-2 py-1 rounded-full text-xs font-semibold text-green-800 border border-green-200">
                                                <span>🎯 Accurate to {Math.round(coordinates.accuracy)}m</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(selectedClass === '11' || selectedClass === '12' ? 3 : 2)} className="flex-1 bg-white border border-pw-border hover:bg-pw-surface text-pw-violet py-4 rounded-xl font-bold transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={handleFinish}
                                    disabled={pincode.length !== 6 || isLoading}
                                    className={`flex-[2] py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-white transform hover:scale-[1.01] active:scale-[0.99]
                                        ${pincode.length === 6 ? 'bg-pw-indigo hover:bg-pw-violet shadow-pw-indigo/30' : 'bg-gray-300 cursor-not-allowed'}
                                    `}
                                >
                                    {isLoading ? 'Saving...' : 'Finish Setup'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
