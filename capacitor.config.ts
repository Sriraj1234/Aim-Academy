import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.padhaku.app',
    appName: 'Padhaku',
    webDir: 'public',
    server: {
        url: 'https://padhaku.co.in',
        cleartext: true,
        androidScheme: 'https'
    }
};

export default config;
