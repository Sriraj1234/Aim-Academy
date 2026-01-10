'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ReferralCapture - Captures the referral code from URL and stores it in localStorage.
 * Should be included in the root layout to capture referrals on any page load.
 */
export const ReferralCapture = () => {
    const searchParams = useSearchParams();

    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode && refCode.trim()) {
            // Store in localStorage for use during signup
            localStorage.setItem('referral_code', refCode.trim());
            console.log('Referral code captured:', refCode);
        }
    }, [searchParams]);

    return null; // This component doesn't render anything
};
