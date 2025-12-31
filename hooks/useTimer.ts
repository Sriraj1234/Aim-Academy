import { useState, useEffect, useRef } from 'react'

export const useTimer = (initialDuration: number, onTimeUp?: () => void) => {
    const [timeLeft, setTimeLeft] = useState(initialDuration)
    const [isRunning, setIsRunning] = useState(true)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const onTimeUpRef = useRef(onTimeUp)

    useEffect(() => {
        onTimeUpRef.current = onTimeUp
    }, [onTimeUp])

    useEffect(() => {
        setTimeLeft(initialDuration)
        setIsRunning(true)
    }, [initialDuration])

    // Handle timer tick
    useEffect(() => {
        if (!isRunning) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0
                return prev - 1
            })
        }, 1000)

        timerRef.current = timer

        return () => clearInterval(timer)
    }, [isRunning])

    // Handle time up side effect
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            setIsRunning(false)
            onTimeUpRef.current?.()
        }
    }, [timeLeft, isRunning])

    const pauseTimer = () => setIsRunning(false)
    const resumeTimer = () => setIsRunning(true)
    const resetTimer = () => {
        setTimeLeft(initialDuration)
        setIsRunning(true)
    }

    return { timeLeft, isRunning, pauseTimer, resumeTimer, resetTimer }
}
