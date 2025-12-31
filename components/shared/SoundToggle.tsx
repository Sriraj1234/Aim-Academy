'use client'
import { useSound } from '@/context/SoundContext';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export const SoundToggle = ({ className = "" }: { className?: string }) => {
    const { isMuted, toggleMute } = useSound();

    return (
        <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-all active:scale-95 ${isMuted ? 'text-gray-400 hover:text-gray-600 bg-gray-100' : 'text-pw-indigo hover:text-pw-violet bg-pw-indigo/10'} ${className}`}
            title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
        >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
    );
};
