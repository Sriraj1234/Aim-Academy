import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const RULES_CONTENT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdminByEmail() {
      return isAuthenticated() && (
        request.auth.token.email == 'jayant.kgp81@gmail.com' ||
        request.auth.token.email == 'jayantkumar1985kh@gmail.com'
      );
    }

    function isAdmin() {
      return isAdminByEmail() || (
        isAuthenticated() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'teacher', 'super_admin']
      );
    }

    match /users/{userId} {
      allow write: if isOwner(userId) || isAdminByEmail();
      allow read: if isAuthenticated();
      
      match /friend_requests/{requestId} {
        allow read: if isOwner(userId);
        allow write: if isAuthenticated();
      }
      match /friends/{friendId} {
        allow read: if isOwner(userId);
        allow write: if isAuthenticated();
      }
      match /game_invites/{inviteId} {
        allow read: if isOwner(userId);
        allow write: if isAuthenticated();
      }
      match /sent_game_invites/{inviteId} {
        allow read: if isOwner(userId);
        allow write: if isAuthenticated();
      }
      match /syllabus_tracker/{docId} {
        allow read, write: if isOwner(userId);
      }
      match /quiz_results/{docId} {
        allow read, write: if isOwner(userId);
      }
      match /completed_videos/{docId} {
        allow read, write: if isOwner(userId);
      }
      match /daily_challenges/{docId} {
        allow read, write: if isOwner(userId);
      }
    }

    match /mind_games/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /tuitions/{tuitionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAdmin();
      allow update: if isAuthenticated() && 
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy']);
    }

    match /questions/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /notes/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /chapters/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /batches/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /metadata/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /live_quizzes/{quizId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participantsCount']));
      
      match /reminders/{userId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    match /video_resources/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /teachers/{email} {
      allow read, write: if isAdminByEmail();
    }

    match /rooms/{document=**} { 
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); 
    }
    
    match /results/{document=**} {
      allow read, write: if isAuthenticated();
    }

    match /live_quiz_results/{document=**} {
      allow read, write: if isAuthenticated();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

export async function GET() {
    try {
        // Get access token from admin SDK
        const app = admin.apps[0] || admin.app();
        const token = await app.options.credential!.getAccessToken();
        const accessToken = token.access_token;

        const projectId = process.env.FIREBASE_PROJECT_ID || 'aim-83922';

        // First, create a new ruleset
        const createRes = await fetch(
            `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: {
                        files: [{
                            name: 'firestore.rules',
                            content: RULES_CONTENT
                        }]
                    }
                })
            }
        );

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Failed to create ruleset: ${err}`);
        }

        const ruleset = await createRes.json();
        const rulesetName = ruleset.name;

        // Then, update the release to point to the new ruleset
        const releaseRes = await fetch(
            `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    release: {
                        name: `projects/${projectId}/releases/cloud.firestore`,
                        rulesetName: rulesetName
                    }
                })
            }
        );

        if (!releaseRes.ok) {
            const err = await releaseRes.text();
            throw new Error(`Failed to update release: ${err}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Firestore rules deployed successfully!',
            rulesetName
        });

    } catch (error: any) {
        console.error('Rules deploy failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
