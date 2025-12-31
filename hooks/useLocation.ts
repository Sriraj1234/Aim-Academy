import { useState } from 'react';

interface LocationData {
    latitude: number;
    longitude: number;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    accuracy: number; // in meters
}

export const useLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAddressFromCoordinates = async (latitude: number, longitude: number, accuracy: number): Promise<LocationData> => {
        try {
            // Use BigDataCloud's free reverse geocoding API
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            return {
                latitude,
                longitude,
                locality: data.locality || '',
                city: data.city || '',
                state: data.principalSubdivision || '',
                pincode: data.postcode || '',
                accuracy
            };
        } catch (err) {
            throw new Error("Failed to fetch address details");
        }
    };

    const detectLocation = (): Promise<LocationData> => {
        setLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = "Geolocation is not supported by your browser";
                setError(err);
                setLoading(false);
                reject(err);
                return;
            }

            const successCallback = async (position: GeolocationPosition) => {
                try {
                    const result = await getAddressFromCoordinates(
                        position.coords.latitude,
                        position.coords.longitude,
                        position.coords.accuracy
                    );
                    setLoading(false);
                    resolve(result);
                } catch (err) {
                    setError("Failed to fetch address details");
                    setLoading(false);
                    reject("Failed to fetch address details");
                }
            };

            const errorCallback = (err: GeolocationPositionError) => {
                // If permission denied, fail immediately
                if (err.code === err.PERMISSION_DENIED) {
                    setError("Location permission denied");
                    setLoading(false);
                    reject("Location permission denied");
                    return;
                }

                // If high accuracy failed (Timeout or Unavailable), try low accuracy
                console.log("High accuracy failed, trying low accuracy...");
                navigator.geolocation.getCurrentPosition(
                    successCallback,
                    (lowAccErr) => {
                        let errorMsg = "Unable to retrieve your location";
                        if (lowAccErr.code === lowAccErr.PERMISSION_DENIED) {
                            errorMsg = "Location permission denied";
                        } else if (lowAccErr.code === lowAccErr.TIMEOUT) {
                            errorMsg = "Location request timed out";
                        }
                        setError(errorMsg);
                        setLoading(false);
                        reject(errorMsg);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            };

            // First try with High Accuracy
            navigator.geolocation.getCurrentPosition(
                successCallback,
                errorCallback,
                {
                    enableHighAccuracy: true,
                    timeout: 5000, // Short timeout for high accuracy to fail fast
                    maximumAge: 0
                }
            );
        });
    };

    return { detectLocation, loading, error };
};
