import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.padhaku.app',
    appName: 'Padhaku',
    webDir: 'public',
    server: {
        url: 'https://padhaku.co.in',
        cleartext: true,
        androidScheme: 'https'
    },
    android: {
        overrideUserAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.101 Mobile Safari/537.36"
    }
};

export default config;
