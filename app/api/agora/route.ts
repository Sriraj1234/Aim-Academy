import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { AGORA_APP_ID, AGORA_APP_CERTIFICATE } from '@/lib/agoraConfig';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get('channelName');
    const uid = searchParams.get('uid') || '0';
    const role = searchParams.get('role') === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    if (!channelName) {
        return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
    }

    if (!AGORA_APP_CERTIFICATE) {
        return NextResponse.json({ error: 'Agora Certificate not configured' }, { status: 500 });
    }

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log("Generating token for:", { channelName, uid, role });

    try {
        let token;
        const uidNum = Number(uid);

        if (!isNaN(uidNum) && uidNum !== 0) {
            token = RtcTokenBuilder.buildTokenWithUid(
                AGORA_APP_ID,
                AGORA_APP_CERTIFICATE,
                channelName,
                uidNum,
                role,
                privilegeExpiredTs,
                privilegeExpiredTs
            );
        } else {
            // Use Account (String) or 0
            token = RtcTokenBuilder.buildTokenWithUserAccount(
                AGORA_APP_ID,
                AGORA_APP_CERTIFICATE,
                channelName,
                // Use the string UID if available, else generic
                uid === '0' || !uid ? "0" : uid,
                role,
                privilegeExpiredTs,
                privilegeExpiredTs
            );
        }

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("Token Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
