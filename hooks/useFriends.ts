import { useState, useEffect } from 'react';
import { db, rtdb } from '@/lib/firebase';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Friend, FriendRequest, UserProfile, GameInvite } from '@/data/types';

export const useFriends = () => {
    const { user, userProfile } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [activeInvites, setActiveInvites] = useState<GameInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

    // Handle My Presence - MOVED TO PresenceListener.tsx
    // useFriends now only CONSUMES presence of others.

    // Listen for Friends, Requests, and Game Invites
    useEffect(() => {
        if (!user) {
            setFriends([]);
            setRequests([]);
            setActiveInvites([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Listen to Friends Collection
        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const unsubFriends = onSnapshot(friendsRef, (snapshot) => {
            const friendsList = snapshot.docs.map(doc => doc.data() as Friend);
            setFriends(friendsList);

            // Listen to their online status
            friendsList.forEach(friend => {
                const statusRef = ref(rtdb, `status/${friend.uid}`);
                onValue(statusRef, (snap) => {
                    const status = snap.val();
                    setOnlineUsers(prev => ({
                        ...prev,
                        [friend.uid]: status?.state === 'online'
                    }));
                });
            });
        }, (error) => {
            console.error("Error fetching friends:", error);
        });

        // Listen to Friend Requests Collection
        const requestsRef = collection(db, 'users', user.uid, 'friend_requests');
        const unsubRequests = onSnapshot(requestsRef, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => doc.data() as FriendRequest);
            setRequests(requestsList);
            if (activeInvites.length === 0) setLoading(false);
        }, (error) => {
            console.error("Error fetching friend requests:", error);
        });

        // Listen to Game Invites
        const gameInvitesRef = collection(db, 'users', user.uid, 'game_invites');
        const unsubGameInvites = onSnapshot(gameInvitesRef, (snapshot) => {
            const invitesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInvite));
            setActiveInvites(invitesList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching game invites:", error);
        });

        return () => {
            unsubFriends();
            unsubRequests();
            unsubGameInvites();
        };
    }, [user]);

    // Send Friend Request
    const sendFriendRequest = async (email: string) => {
        if (!user || !userProfile) throw new Error("Not authenticated");
        if (email === user.email) throw new Error("You cannot invite yourself");

        // 1. Find User by Email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("User not found");
        }

        const targetUserDoc = snapshot.docs[0];
        const targetUser = targetUserDoc.data() as UserProfile;
        const targetUid = targetUserDoc.id;

        // 2. Check if already friends or requested
        const existingFriend = friends.find(f => f.uid === targetUid);
        if (existingFriend) throw new Error("Already friends");

        // 3. Create Request Object for Target (Received)
        const requestForTarget: FriendRequest = {
            uid: user.uid,
            displayName: userProfile.displayName || 'Unknown',
            photoURL: userProfile.photoURL || '',
            email: user.email || '',
            direction: 'received',
            timestamp: Date.now(),
            status: 'pending'
        };

        // 4. Create Request Object for Me (Sent)
        const requestForMe: FriendRequest = {
            uid: targetUid,
            displayName: targetUser.displayName || 'Unknown',
            photoURL: targetUser.photoURL || '',
            email: targetUser.email || '',
            direction: 'sent',
            timestamp: Date.now(),
            status: 'pending'
        };

        // 5. Batch writes (manual)
        await setDoc(doc(db, 'users', targetUid, 'friend_requests', user.uid), requestForTarget);
        await setDoc(doc(db, 'users', user.uid, 'friend_requests', targetUid), requestForMe);
    };

    // Accept Friend Request
    const acceptFriendRequest = async (requestUid: string) => {
        if (!user || !userProfile) return;

        // 1. Get the request details to verify
        const request = requests.find(r => r.uid === requestUid && r.direction === 'received');
        if (!request) throw new Error("Request not found");

        // 2. Create Friend Objects
        const friendForMe: Friend = {
            uid: request.uid,
            displayName: request.displayName,
            photoURL: request.photoURL,
            createdAt: Date.now()
        };

        const friendForThem: Friend = {
            uid: user.uid,
            displayName: userProfile.displayName || '',
            photoURL: userProfile.photoURL || '',
            createdAt: Date.now()
        };

        // 3. Write to Friends Collections
        await setDoc(doc(db, 'users', user.uid, 'friends', request.uid), friendForMe);
        await setDoc(doc(db, 'users', request.uid, 'friends', user.uid), friendForThem);

        // 4. Delete Requests
        await deleteDoc(doc(db, 'users', user.uid, 'friend_requests', request.uid));
        await deleteDoc(doc(db, 'users', request.uid, 'friend_requests', user.uid));
    };

    // Reject Friend Request
    const rejectFriendRequest = async (requestUid: string) => {
        if (!user) return;
        // Delete requests from both sides
        await deleteDoc(doc(db, 'users', user.uid, 'friend_requests', requestUid));
        // We might not have permission to delete from the other user's DB directly without Cloud Functions
        // BUT, for now assuming client-side simplified model where we just delete our own 'received' copy.
        // The sender will still see 'sent' unless we handle it. 
        // Better implementation: The sender's 'sent' request should probably hang around or be deleted?
        // Let's just delete BOTH if security rules allow, or just ours.
        // NOTE: Security rules usually block writing to others' paths.
        // Ideally we use a Cloud Function. For this demo, let's try to delete both (assuming lenient rules for now).
        // If that fails, we just delete ours.

        try {
            await deleteDoc(doc(db, 'users', requestUid, 'friend_requests', user.uid));
        } catch (e) {
            console.warn("Could not delete sender's request copy (likely permission issue)", e);
        }
    };

    // Send Game Invite
    const sendGameInvite = async (friendUid: string, roomId: string) => {
        if (!user || !userProfile) throw new Error("Not authenticated");

        const invite: Omit<GameInvite, 'id'> = {
            fromUid: user.uid,
            fromName: userProfile.displayName || 'Unknown',
            fromPhoto: userProfile.photoURL || '',
            roomId: roomId,
            timestamp: Date.now()
        };

        await setDoc(doc(collection(db, 'users', friendUid, 'game_invites')), invite);
    };

    const clearGameInvite = async (inviteId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'game_invites', inviteId));
    }

    // Remove Friend
    const removeFriend = async (friendUid: string) => {
        if (!user) return;

        // Remove from my friends
        await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));

        // Remove from their friends (try to remove myself from their list)
        // Note: Similar to reject, this requires permissive rules or Cloud Functions in a strict env.
        // With our current "public" rules, this will work.
        try {
            await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
        } catch (error) {
            console.error("Error removing friend from their list:", error);
        }
    };

    return {
        friends,
        requests,
        activeInvites,
        loading,
        onlineUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        sendGameInvite,
        clearGameInvite,
        removeFriend
    };
};

