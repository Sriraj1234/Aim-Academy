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
    const [sentInvites, setSentInvites] = useState<GameInvite[]>([]); // New listener for sent invites
    const [loading, setLoading] = useState(true);
    // Changed to string for detailed status ('online', 'in-lobby', 'playing') or null if offline
    const [onlineUsers, setOnlineUsers] = useState<Record<string, string | null>>({});

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

        // Keep track of active RTDB listeners to unsubscribe later
        const rtdbUnsubscribes: Record<string, () => void> = {};

        const unsubFriends = onSnapshot(friendsRef, (snapshot) => {
            const friendsList = snapshot.docs.map(doc => doc.data() as Friend);
            setFriends(friendsList);

            Object.values(rtdbUnsubscribes).forEach(unsub => unsub());

            // 2. Subscribe to new list
            friendsList.forEach(friend => {
                if (!friend.uid) return;
                const statusRef = ref(rtdb, `status/${friend.uid}`);

                const unsub = onValue(statusRef, (snap) => {
                    const statusVal = snap.val();
                    let userStatus: string | null = null;

                    if (statusVal) {
                        // Support New "Connections" Pattern
                        if (statusVal.connections) {
                            // Find the most relevant status from connections
                            const connections = Object.values(statusVal.connections) as any[];
                            if (connections.length > 0) {
                                // Prioritize active states: playing > in-lobby > online
                                const states = connections.map(c => c.state);
                                if (states.includes('playing')) userStatus = 'playing';
                                else if (states.includes('in-lobby')) userStatus = 'in-lobby';
                                else userStatus = 'online';
                            }
                        }
                        // Fallback to Old Pattern
                        else if (statusVal.state === 'online') {
                            userStatus = 'online';
                        }
                    }

                    setOnlineUsers(prev => ({
                        ...prev,
                        [friend.uid]: userStatus
                    }));
                });

                rtdbUnsubscribes[friend.uid] = unsub;
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

        // Listen to SENT Game Invites (to track responses)
        const sentInvitesQuery = query(collection(db, 'game_invites'), where('fromUid', '==', user.uid));
        // Note: The previous implementation stored invites in `users/{uid}/game_invites`.
        // To listen to responses efficiently without querying EVERY user, we arguably need a central `game_invites` collection 
        // OR we need to know who we sent it to.
        // BUT, the current system sends to `users/{friendUid}/game_invites`.
        // So the sender cannot easily "listen" to a single collection unless we duplicate data or change structure.

        // Plan adjustment:
        // 1. When sending, ALSO write to `users/{myUid}/sent_invites/{friendUid}`?
        // 2. Or better, use a root `game_invites` collection where:
        //    docId = auto
        //    fields = { fromUid, toUid, roomId, status, timestamp }
        //    Receiver listens to `where(toUid == me)`
        //    Sender listens to `where(fromUid == me)`

        // Changing DB schema entirely is risky mid-flight.
        // Alternative: Sender keeps a local "sent" list in localStorage? No, cross-device issue.
        // Alternative: Sender writes a copy to `users/{senderUid}/sent_Game_invites`? 

        // Let's go with the copy approach for now as it fits the "user subcollection" pattern used elsewhere.
        // `users/{myUid}/sent_game_invites`

        const sentGameInvitesRef = collection(db, 'users', user.uid, 'sent_game_invites');
        const unsubSentInvites = onSnapshot(sentGameInvitesRef, (snapshot) => {
            const sentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInvite));
            setSentInvites(sentList);
        });

        return () => {
            unsubFriends();
            unsubRequests();
            unsubGameInvites();
            unsubSentInvites();
            // Cleanup RTDB listeners
            Object.values(rtdbUnsubscribes).forEach(unsub => unsub());
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

        try {
            await deleteDoc(doc(db, 'users', requestUid, 'friend_requests', user.uid));
        } catch (e) {
            console.warn("Could not delete sender's request copy (likely permission issue)", e);
        }
    };

    // Send Game Invite
    const sendGameInvite = async (friendUid: string, roomId: string) => {
        if (!user || !userProfile) throw new Error("Not authenticated");

        // Rate Limiting Check
        const STORAGE_KEY = `last_invite_${friendUid}`;
        const lastInviteTime = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (lastInviteTime) {
            const diff = now - parseInt(lastInviteTime);
            if (diff < 10000) { // 10 seconds
                const remaining = Math.ceil((10000 - diff) / 1000);
                throw new Error(`Please wait ${remaining}s before sending another invite.`);
            }
        }

        const invite: Omit<GameInvite, 'id'> = {
            fromUid: user.uid,
            fromName: userProfile.displayName || 'Unknown',
            fromPhoto: userProfile.photoURL || '',
            roomId: roomId,
            timestamp: now,
            status: 'pending'
        };

        const newInviteRef = doc(collection(db, 'users', friendUid, 'game_invites'));
        await setDoc(newInviteRef, invite);

        // Also save to my "sent_game_invites" to track status
        // Use same ID so we can correlate
        await setDoc(doc(db, 'users', user.uid, 'sent_game_invites', newInviteRef.id), {
            ...invite,
            toUid: friendUid // Store who we sent it to
        });

        // Update Local Storage
        localStorage.setItem(STORAGE_KEY, now.toString());
    };

    const respondToGameInvite = async (inviteId: string, response: 'accepted' | 'rejected', fromUid: string) => {
        if (!user) return;

        // 1. Update the invite in MY inbox (so UI updates)
        const myInviteRef = doc(db, 'users', user.uid, 'game_invites', inviteId);
        // We actually just want to remove it from our inbox eventually, but first update logic?
        // Actually, if we just delete it from our inbox, how does the sender know?

        // The sender is listening to `users/{senderUid}/sent_game_invites/{inviteId}`
        // So we need to write to THAT location.

        try {
            const senderInviteRef = doc(db, 'users', fromUid, 'sent_game_invites', inviteId);
            await setDoc(senderInviteRef, { status: response }, { merge: true });
        } catch (e) {
            console.error("Could not notify sender:", e);
        }

        // 2. Delete from my inbox
        await deleteDoc(myInviteRef);
    }

    // For cleaning up my own sent invites that are done
    const clearSentInvite = async (inviteId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'sent_game_invites', inviteId));
    }

    // Deprecated? No, used for simple clear
    const clearGameInvite = async (inviteId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'game_invites', inviteId));
    }

    // Remove Friend
    const removeFriend = async (friendUid: string) => {
        if (!user) return;

        // Remove from my friends
        await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));

        try {
            await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
        } catch (error) {
            console.error("Error removing friend from their list:", error);
        }
    };

    return {
        requests,
        activeInvites,
        sentInvites,
        loading,
        onlineUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        sendGameInvite,
        respondToGameInvite,
        clearSentInvite,
        clearGameInvite,
        removeFriend
    };
};

