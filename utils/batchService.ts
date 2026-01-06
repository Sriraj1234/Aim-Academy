import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Batch } from '@/data/types';

const BATCHES_COLLECTION = 'batches';

export const createBatch = async (batchData: Omit<Batch, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, BATCHES_COLLECTION), {
            ...batchData,
            createdAt: Date.now(), // Ensure sorting works
        });
        // Update the doc with its own ID (optional but helpful)
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    } catch (error) {
        console.error("Error creating batch:", error);
        throw error;
    }
};

export const getBatchesByTeacher = async (teacherEmail: string) => {
    try {
        // Assuming teacherIds stores emails or UIDs. Using email for now as per Auth system.
        // If teacherIds stores UIDs, we need to pass UID. 
        // Based on TeacherProfile, we authorize by Email, so let's stick to Email for identification in batches for now, 
        // or we can store both. Let's assume teacherIds array contains the creator's email.
        const q = query(
            collection(db, BATCHES_COLLECTION),
            where('teacherIds', 'array-contains', teacherEmail),
            orderBy('startDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
    } catch (error) {
        console.error("Error fetching batches:", error);
        throw error;
    }
};

export const uploadBatchThumbnail = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`Client Upload Service: Starting upload for ${file.name} (${file.size} bytes, ${file.type})`);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data.url;
    } catch (error) {
        console.error("Error uploading thumbnail:", error);
        throw error;
    }
};
