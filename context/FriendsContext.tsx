'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
    getDoc,
    limit
} from 'firebase/firestore';
import { ref, onValue, set, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { Friend, FriendRequest, UserProfile, GameInvite } from '@/data/types';

interface FriendsContextType {
    friends: Friend[];
    requests: FriendRequest[];
    activeInvites: GameInvite[];
    sentInvites: GameInvite[];
    loading: boolean;
    onlineUsers: Record<string, string | null>;
    sendFriendRequest: (email: string, targetUid?: string) => Promise<void>;
    acceptFriendRequest: (uid: string) => Promise<void>;
    rejectFriendRequest: (uid: string) => Promise<void>;
    sendGameInvite: (friendUid: string, roomId: string) => Promise<void>;
    respondToGameInvite: (inviteId: string, response: 'accepted' | 'rejected', fromUid: string) => Promise<void>;
    clearSentInvite: (inviteId: string) => Promise<void>;
    clearGameInvite: (inviteId: string) => Promise<void>;
    removeFriend: (friendUid: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
    const { user, userProfile } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [activeInvites, setActiveInvites] = useState<GameInvite[]>([]);
    const [sentInvites, setSentInvites] = useState<GameInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, string | null>>({});

    // Listen for Friends, Requests, and Game Invites
    useEffect(() => {
        if (!user) {
            setFriends([]);
            setRequests([]);
            setActiveInvites([]);
            setSentInvites([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Listen to Friends Collection
        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const rtdbUnsubscribes: Record<string, () => void> = {};

        const unsubFriends = onSnapshot(friendsRef, async (snapshot) => {
            const initialFriendsList = snapshot.docs.map(doc => doc.data() as Friend);

            // Hydrate Friend Data (Profile updates)
            if (initialFriendsList.length > 0) {
                try {
                    const updatedFriends = await Promise.all(initialFriendsList.map(async (friend) => {
                        if (!friend.uid) return friend;
                        try {
                            // Check local cache or fetch? For now fetch fresh.
                            // Optimization: Check if data changed? 
                            // Simplest: Fetch.
                            const userDocRef = doc(db, 'users', friend.uid);
                            const userSnap = await getDoc(userDocRef);
                            if (userSnap.exists()) {
                                const userData = userSnap.data() as UserProfile;
                                return {
                                    ...friend,
                                    photoURL: userData.photoURL || friend.photoURL,
                                    displayName: userData.displayName || friend.displayName,
                                    subscription: userData.subscription ? { plan: userData.subscription.plan, status: userData.subscription.status } : undefined,
                                    gamification: userData.gamification ? { currentStreak: userData.gamification.currentStreak } : undefined
                                };
                            }
                        } catch (e) {
                            console.warn(`Failed to refresh data for friend ${friend.uid}`, e);
                        }
                        return friend;
                    }));
                    setFriends(updatedFriends); // Update state with fresh data
                } catch (err) {
                    console.error("Error hydrating friends data:", err);
                    setFriends(initialFriendsList); // Fallback
                }
            } else {
                setFriends([]);
            }

            // Clean up old RTDB listeners
            Object.values(rtdbUnsubscribes).forEach(unsub => unsub());

            // Subscribe to Online Status (RTDB)
            initialFriendsList.forEach(friend => {
                if (!friend.uid) return;
                const statusRef = ref(rtdb, `status/${friend.uid}`);
                const unsub = onValue(statusRef, (snap) => {
                    const statusVal = snap.val();
                    let userStatus: string | null = null;

                    if (statusVal) {
                        if (statusVal.connections) {
                            const connections = Object.values(statusVal.connections) as any[];
                            if (connections.length > 0) {
                                const states = connections.map(c => c.state);
                                if (states.includes('playing')) userStatus = 'playing';
                                else if (states.includes('in-lobby')) userStatus = 'in-lobby';
                                else if (states.includes('online')) userStatus = 'online';
                            }
                        } else if (statusVal.state === 'online') {
                            userStatus = 'online';
                        }
                    }

                    setOnlineUsers(prev => ({ ...prev, [friend.uid]: userStatus }));
                });
                rtdbUnsubscribes[friend.uid] = unsub;
            });
        }, (error) => {
            console.error("Error fetching friends:", error);
        });

        // 2. Listen to Friend Requests
        const requestsRef = collection(db, 'users', user.uid, 'friend_requests');
        const unsubRequests = onSnapshot(requestsRef, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => doc.data() as FriendRequest);
            setRequests(requestsList);
        }, (error) => {
            console.error("Error fetching friend requests:", error);
        });

        // 3. Listen to Game Invites (Incoming)
        const gameInvitesRef = collection(db, 'users', user.uid, 'game_invites');
        const unsubGameInvites = onSnapshot(gameInvitesRef, (snapshot) => {
            const invitesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInvite));
            setActiveInvites(invitesList);
            setLoading(false); // Initial load done
        }, (error) => {
            console.error("Error fetching game invites:", error);
            setLoading(false);
        });

        // 4. Listen to Sent Game Invites (Outgoing status)
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
            Object.values(rtdbUnsubscribes).forEach(unsub => unsub());
        };
    }, [user]);

    // Actions
    const sendFriendRequest = async (email: string, targetUid?: string) => {
        if (!user || !userProfile) throw new Error("Not authenticated");

        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === user.email?.toLowerCase()) throw new Error("You cannot invite yourself");

        let targetUserDoc;
        let resolvedTargetUid: string;

        // Priority 1: Search by Email (User request: "only gmail k through")
        // We will prioritize email search even if targetUid is provided, 
        // to ensure we mean the person with THIS email.
        // However, if targetUid is passed (e.g. from LocalStudents), we can verify it matches the email if needed.
        // For strictness per user request, let's rely on Email query if a string looks like an email.

        if (targetUid) {
            // If we have a UID (e.g. from a list), just use it but double check self.
            resolvedTargetUid = targetUid;
            if (resolvedTargetUid === user.uid) throw new Error("You cannot invite yourself");

            const docRef = doc(db, 'users', resolvedTargetUid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("User not found");
            targetUserDoc = docSnap;
        } else {
            // Search by Email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", cleanEmail));
            const snapshot = await getDocs(q);

            if (snapshot.empty) throw new Error("User with this email not found. Ask them to sign up!");
            targetUserDoc = snapshot.docs[0];
            resolvedTargetUid = targetUserDoc.id;
        }

        if (resolvedTargetUid === user.uid) throw new Error("You cannot invite yourself");

        const targetUser = targetUserDoc.data() as UserProfile;

        // Check if already friends
        if (friends.some(f => f.uid === resolvedTargetUid)) {
            throw new Error("You are already friends with this user.");
        }

        // Check if request already sent (outgoing)
        // Accessing the subcollection might be expensive to query every time, 
        // but we can trust the 'requests' state if we sync outgoing requests, 
        // but currently we only sync incoming. We'll optimise by blindly writing or checking doc existence.
        // Let's check doc existence for cleaner error message.
        const outgoingRequestRef = doc(db, 'users', user.uid, 'friend_requests', resolvedTargetUid);
        const outgoingRequestSnap = await getDoc(outgoingRequestRef);
        if (outgoingRequestSnap.exists()) {
            throw new Error("Friend request already sent.");
        }

        // Check if they already sent me a request (incoming)
        const incomingRequest = requests.find(r => r.uid === resolvedTargetUid);
        if (incomingRequest) {
            // Auto-accept? Or just tell user.
            throw new Error("This user has already sent you a request. Check your 'Requests' tab!");
        }

        const requestForTarget: FriendRequest = {
            uid: user.uid,
            displayName: userProfile.displayName || 'Unknown',
            photoURL: userProfile.photoURL || '',
            email: user.email || '',
            direction: 'received',
            timestamp: Date.now(),
            status: 'pending',
            subscription: userProfile.subscription ? { plan: userProfile.subscription.plan, status: userProfile.subscription.status } : undefined,
            gamification: userProfile.gamification ? { currentStreak: userProfile.gamification.currentStreak } : undefined
        };

        const requestForMe: FriendRequest = {
            uid: resolvedTargetUid,
            displayName: targetUser.displayName || 'Unknown',
            photoURL: targetUser.photoURL || '',
            email: targetUser.email || '',
            direction: 'sent',
            timestamp: Date.now(),
            status: 'pending',
            subscription: targetUser.subscription ? { plan: targetUser.subscription.plan, status: targetUser.subscription.status } : undefined,
            gamification: targetUser.gamification ? { currentStreak: targetUser.gamification.currentStreak } : undefined
        };

        // Batch write to ensure atomicity
        // (If we had a batch instance, but separate await calls are okay for now given we don't have a transaction wrapper handy)
        await setDoc(doc(db, 'users', resolvedTargetUid, 'friend_requests', user.uid), requestForTarget);
        await setDoc(doc(db, 'users', user.uid, 'friend_requests', resolvedTargetUid), requestForMe);
    };

    const acceptFriendRequest = async (requestUid: string) => {
        if (!user || !userProfile) return;

        // Verify request exists
        const request = requests.find(r => r.uid === requestUid && r.direction === 'received');
        if (!request) {
            // It might be a UI glitch, try fetching directly or just error
            throw new Error("Request not found or already processed.");
        }

        const friendForMe: Friend = {
            uid: request.uid,
            displayName: request.displayName,
            photoURL: request.photoURL,
            createdAt: Date.now(),
            subscription: request.subscription,
            gamification: request.gamification
        };

        const friendForThem: Friend = {
            uid: user.uid,
            displayName: userProfile.displayName || '',
            photoURL: userProfile.photoURL || '',
            createdAt: Date.now(),
            subscription: userProfile.subscription ? { plan: userProfile.subscription.plan, status: userProfile.subscription.status } : undefined,
            gamification: userProfile.gamification ? { currentStreak: userProfile.gamification.currentStreak } : undefined
        };

        try {
            // Parallelize for speed
            await Promise.all([
                setDoc(doc(db, 'users', user.uid, 'friends', request.uid), friendForMe),
                setDoc(doc(db, 'users', request.uid, 'friends', user.uid), friendForThem),
                deleteDoc(doc(db, 'users', user.uid, 'friend_requests', request.uid)),
                deleteDoc(doc(db, 'users', request.uid, 'friend_requests', user.uid))
            ]);
        } catch (e) {
            console.error("Error accepting friend request:", e);
            throw new Error("Failed to accept friend request. Please try again.");
        }
    };

    const rejectFriendRequest = async (requestUid: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'friend_requests', requestUid));
        try {
            await deleteDoc(doc(db, 'users', requestUid, 'friend_requests', user.uid));
        } catch (e) {
            console.warn("Could not delete sender's request copy", e);
        }
    };

    const sendGameInvite = async (friendUid: string, roomId: string) => {
        if (!user || !userProfile) throw new Error("Not authenticated");

        const STORAGE_KEY = `last_invite_${friendUid}`;
        const lastInviteTime = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (lastInviteTime) {
            const diff = now - parseInt(lastInviteTime);
            if (diff < 10000) {
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

        await setDoc(doc(db, 'users', user.uid, 'sent_game_invites', newInviteRef.id), {
            ...invite,
            toUid: friendUid
        });

        localStorage.setItem(STORAGE_KEY, now.toString());
    };

    const respondToGameInvite = async (inviteId: string, response: 'accepted' | 'rejected', fromUid: string) => {
        if (!user) return;
        const myInviteRef = doc(db, 'users', user.uid, 'game_invites', inviteId);

        try {
            const senderInviteRef = doc(db, 'users', fromUid, 'sent_game_invites', inviteId);
            await setDoc(senderInviteRef, { status: response }, { merge: true });
        } catch (e) {
            console.error("Could not notify sender:", e);
        }

        await deleteDoc(myInviteRef);
    };

    const clearSentInvite = async (inviteId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'sent_game_invites', inviteId));
    };

    const clearGameInvite = async (inviteId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'game_invites', inviteId));
    };

    const removeFriend = async (friendUid: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));
        try {
            await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
        } catch (error) {
            console.error("Error removing friend from their list:", error);
        }
    };

    return (
        <FriendsContext.Provider value={{
            friends, requests, activeInvites, sentInvites, loading, onlineUsers,
            sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
            sendGameInvite, respondToGameInvite, clearSentInvite, clearGameInvite, removeFriend
        }}>
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriendsContext = () => {
    const context = useContext(FriendsContext);
    if (!context) {
        throw new Error('useFriendsContext must be used within a FriendsProvider');
    }
    return context;
};
