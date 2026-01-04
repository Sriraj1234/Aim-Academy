const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const credential = {
    FIREBASE_PROJECT_ID: "aim-83922",
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-fbsvc@aim-83922.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDA4EPFUv4dajQx\nvl3W8IPtcRTNPYQhpLzzQyid0/ofYws5nd6OvLk+wKd/Ct5DYKPen4oZBD4fU9v2\nuiKEFB0mbX8oD7bpbLJYsOdk5VUX0Out/HSBRAirpmcvsZllb8P9jR9i3YB81QHa\niEpuRtuus0bJL9e2XeuUjggF0ygZYTQ+AqKqZWmwAD9Iu0DztGKC+zxO5I2IMNsW\nyQ1mLNyk2UTio4mADV1QWNZFxvltP0nJHNdFp1fWa1IsnV2E/oywe+th7J6NU9u0\n62PEoy2oX1RH4dQkJUm/CeEXNrjPA/9X+3s5zTnCFtTJNT2MwNCtb5RWCgSbFCjn\nmVyJN5v3AgMBAAECggEAHs6zhH0xIbmpBJkHnCFmsTJyxCWjSUxq8eA0SKFnPkQv\nstBIkDwMyr0zA9PUlKaHBjQtdrl6wr4+UDaC9N3RmiW7PcbkzHwUMJ5xF2iaIue3\n/V5prYwUZnZ53OBdRBqKD6HO9Zezwjyzwxgp61teE5WHJPODXRm7W0skdOm5afQZ\nieQh8qhEQKzMqBjCFDxn3j7tXz7V0JDaBlPsOt5filkYofIURJUYxQGX3SwtwtwN\nMLY4dqnGjDB8vBkbra95X6NPNIjp8cBJZFTHIXvXyZJ14ycnRZkTyaawQqg0ZQSg\n9l/o9K+5oS/VD0peOQC3YL1scCpbQ9tLZ497fif94QKBgQDx8Hay19Ppzy79j/D3\nWVR/102LL131GHjPelj1HrD92x4dZVgUCcT/WwYWkuXNf6DM6DP8RzcziZMnLzQJ\nlA0DlXhx9SafCR+or0deibrikWjlGFy5J4JhSMs/mcoW1Wsno1ca3bb8Ks/FSdwt\no3e5XX1sOXLpTYp+YXXbMbRUXQKBgQDMFdhW9NmF641V8vWq0E++BTcLEPH6Xu0Z\nbI4pVG42z2Og6O4uLr3Rbz/ZEJeJqkX1Lk0YHGolIeyXEZ2R/WM6SGLhBaqMHoMp\nnbNkQfnFuUrFIbOb/uCyl9W4DcxTZOH3CHRDruznMR2gfbLsatPkHaVWcL8hN0UD\nX9HY2jcsYwKBgAtRjpwLUNStZqtiIonP2g4pCm2qh6DBxlUeii7dgrY9nAkQBrDZ\nTCgOIBjKQon8oI81hckVo9V7aDD7GlogXQN/6KScLXRfPuXrXVFk7CNRXjDplNzs\npkLa3vdYwIWU8nBmSdrt6HOfpRy7udtAvIclgoqfnWqgwAvtj0/z4VXZAoGAQ55R\nSa5ii/6Zm4qeXvQaF6l+rUn2ArCE+lF/YK46vipEpkHG+MI/3i5wByl6LACgoTWw\nEXcIrDjrPLp3bLF5uQvWxxurgDVz28wGbgd2DE7yORKLgfoW1NV92DeqJU9dlw3U\nB8DjeU5KtKwxJifXANPZviQpD4ZSdWXAD4ttkGUCgYEA5FnJds5n5uqE0hyrJzpn\n5K5Ffbp0F6XTaRuXI0McZwn4NJI/t4FgfEt63iAaso75SKUmmx8kZXhKnPlB/d5F\nFVkD+b22efL6ZGhSwzJPARbqyx22LS/bsd1/huKndWLfVVldhzfVo5k0Yv+ysKpa\nG5xVFZbGMET/dX5fRJG9dc4=\n-----END PRIVATE KEY-----\n"
};

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    const newLines = [];
    const keysFound = new Set();

    // Preserve existing keys except the ones we are updating
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        const match = line.match(/^([^=]+)=/);
        if (match) {
            const key = match[1];
            if (credential[key]) {
                // Skip, we will add later
                continue;
            }
            newLines.push(line);
        } else {
            newLines.push(line);
        }
    }

    // Add our credentials
    newLines.push('');
    newLines.push('# Firebase Admin Credentials');
    for (const [key, value] of Object.entries(credential)) {
        newLines.push(`${key}="${value}"`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('Successfully updated .env.local');

} catch (e) {
    console.error('Error updating .env.local:', e);
}
