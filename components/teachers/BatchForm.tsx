'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createBatch, uploadBatchThumbnail } from '@/utils/batchService';
import { useAuth } from '@/context/AuthContext';
import { FaUpload, FaSpinner } from 'react-icons/fa';

export default function BatchForm({ onSuccess }: { onSuccess: () => void }) {
    const { user } = useAuth();
    const { register, handleSubmit, reset } = useForm();
    const [loading, setLoading] = useState(false);
    const [thumbnail, setThumbnail] = useState<File | null>(null);

    const onSubmit = async (data: any) => {
        if (!user?.email) return toast.error("You must be logged in.");

        setLoading(true);
        try {
            let thumbnailUrl = '';
            if (thumbnail) {
                thumbnailUrl = await uploadBatchThumbnail(thumbnail);
            }

            await createBatch({
                name: data.name,
                description: data.description,
                subjects: data.subjects.split(',').map((s: string) => s.trim()),
                startDate: data.startDate,
                endDate: data.endDate,
                price: Number(data.price),
                status: 'upcoming',
                teacherIds: [user.email],
                thumbnailUrl,
                // These are auto-added by service or unused for now
            } as any);

            toast.success("Batch created successfully!");
            reset();
            setThumbnail(null);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create batch.");
        } finally {
            setLoading(false);
        }
    };

    // Compression Helper
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const scaleSize = MAX_WIDTH / img.width;
                    const newWidth = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
                    const newHeight = (img.width > MAX_WIDTH) ? (img.height * scaleSize) : img.height;

                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, newWidth, newHeight);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Canvas is empty'));
                        }
                    }, 'image/jpeg', 0.8);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                if (file.size > 1 * 1024 * 1024) { // Only compress if > 1MB
                    const compressed = await compressImage(file);
                    setThumbnail(compressed);
                    toast.success("Image optimized for upload!");
                } else {
                    setThumbnail(file);
                }
            } catch (err) {
                console.error("Compression failed", err);
                setThumbnail(file); // Fallback to original
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Batch Name</label>
                <input {...register('name', { required: true })} className="input-field w-full border rounded-lg p-2" placeholder="e.g. Class 10 Math Masterclass" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea {...register('description', { required: true })} className="input-field w-full border rounded-lg p-2" rows={3} placeholder="What will students learn?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                    <input type="number" {...register('price', { required: true })} className="input-field w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subjects (comma separated)</label>
                    <input {...register('subjects', { required: true })} className="input-field w-full border rounded-lg p-2" placeholder="Math, Physics" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" {...register('startDate', { required: true })} className="input-field w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" {...register('endDate', { required: true })} className="input-field w-full border rounded-lg p-2" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FaUpload className="mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">{thumbnail ? `Selected: ${thumbnail.name} (${(thumbnail.size / 1024).toFixed(0)}KB)` : "Click to upload image"}</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors flex justify-center items-center gap-2"
            >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? 'Creating...' : 'Launch Batch'}
            </button>
        </form>
    );
}
