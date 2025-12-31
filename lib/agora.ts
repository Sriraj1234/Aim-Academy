import AgoraRTC from "agora-rtc-sdk-ng";

import { AGORA_APP_ID, AGORA_TOKEN } from "./agoraConfig";

export { AGORA_APP_ID, AGORA_TOKEN, AGORA_APP_CERTIFICATE } from "./agoraConfig";

export const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
