const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

// The key provided by the user, split into lines
const keyLines = [
    "-----BEGIN PRIVATE KEY-----",
    "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCykqch1NvSvWLw",
    "i09lYJTjrK144mNAkm8oM2zIdhOBk2y3/febu9NcdKTGZ8gQzMe+9WQE1QZnvR90",
    "H8kmIRlSF9UW5VAsHZlk0/9+lSY87+v/xnfgyfEkZlDWdfV64BTiMKAhUS8NrSQU",
    "0Wac4Pb/aYfD0Ony5t2pNMv8uMusF8bhLimQv9k2Ua+Q0AX4OgiTDIK92UD7CJi1",
    "5yhTdP6w81zf57CuSTk1CuSf+Zys/ZVSXbP1X9M2VSvde9AsLXFt++APA4JrscKv",
    "OBSNjOO9h13QRinh/xDNOCH2lqQJZO6W6ESNG+VDw4x5rSjkg4wmvcghEdLKN7E6",
    "8Gs3whJvAgMBAAECggEAE2Dm0j0PPedffUsg6pd4kNyEVsH6k19QwMQT4g0uQLmG",
    "6tCctkHDxhzCZOWOSIRwiMCIgh27/DYB29A3O/QLk2USstFfyenMY6y95Ta6V5KR",
    "wcf/6lz/1jtkOmHCqfr3STSNrA/rU0ieycOPpyaip0UEfrOFL97t3xbjrCFBuQMM",
    "uLBcFFiE69YUKdgo60AWbesf5nD/xjD36I7ae1PcUwAOXi3UO+gQtW8EeASN13Pq",
    "A4JbDbQ8yEi6PZj8NQa6Zt5wFDPasDi9mhKenGGNtGz3D607ZkkLW9aLIzzQ9QYP",
    "TxcMschYP9Ih8y+BueswB990i409rhM7/b+VmnEdQQKBgQD0RzWkPbw3tZ9NyJNt",
    "aWAoWwR1KGS6fY6sqlOubzYy1nEvbCeIXgvJGwmSFYc7YgdteLoV1QtflrgeOHNc",
    "T6E5G98b0E1Da5jefLCBhmlaXYHNe3ckZwr3+cRQb8diTgj98KsUErx17Pzl3Q1v",
    "zRIS9X/lY3ZIwK58aYkahFfrFQKBgQC7JExvRQbAu+jOoqVQu3MDImDTEhx4/CdY",
    "Q8YMYwJWHgW6VH/ayeTd5+jG6bnfRt3p9WoTnQs4I+DsA159Jd92UctPhkX65Oe6",
    "V2GJ2Vi8ISZEJEa0Jdga9DY7JTEDdyWll+ZgQAXOErsRiwF0N4SyYxP4zj7FPQxx",
    "iwL7rbOYcwKBgQCEcm/FQ6vf0Nw1QoGdGzuF5gO+uk4TR6yqNhf1RltuqRLpkYzF",
    "xahCPCSuTnnqWraIRqMu3zqxc3kU+aqi7JIP8uq/m+uomJhkWdsh/4zz8CtHDKCG",
    "3k/2MDifHFxREtqRRYKc+aOxlPNydq6oZdpc6TuVVp51x/NTha1O8V7yGQKBgGLt",
    "KUqYnp07uDGjYOhwbrf1cGGjbVG3WcUa7pKVtCJ59GUvTfcGSunTMgYUf6E8AQsw",
    "JEcB+XBP5xJcJZLadmpBiswbGtsqLiUfE/ye3H12uJfE5WtNphN5jUFuw54lWc1T",
    "owC2V1s8I49+f+JDhu4V2fTocd4qC23qIkWQ6SNpAoGAYdxvEl4ofXPA3Gt/nu+I",
    "ogODZ+NVMdAAp6fr4ldbJyQsh9ecy6hT6gdPCJYDiYff2XLo0qtgYi7qOlYwsOXc",
    "PoR6bNgKV7q4Jnn7twe8wAkDvQulvXjBUxVXg6tNpw43GBvmpEJY8Vi8uAVH+IMy",
    "h0CQNtbzSRf63xF1tW3iGBA=",
    "-----END PRIVATE KEY-----"
];

const vapidKey = "BCph9csjTz0IwHdajt6xfzIYE_0feFWkqJsJNTEIJBXBEDPZMdi8lJneckXUn0RWgIXu5ywM3qoBb7XTFfb2Tic";

// Multiline format: variable="line1
// line2
// ...
// lineN"
// Note: We join with \n to create actual newlines
const multilineKey = `"${keyLines.join('\n')}"`;

const envContent = [
    `NEXT_PUBLIC_FIREBASE_VAPID_KEY=${vapidKey}`,
    `FIREBASE_PRIVATE_KEY=${multilineKey}`,
    '' // trailing newline
].join('\n');

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    // Remove existing keys
    const filteredLines = lines.filter(line =>
        !line.trim().startsWith('FIREBASE_PRIVATE_KEY') &&
        !line.trim().startsWith('NEXT_PUBLIC_FIREBASE_VAPID_KEY')
    );

    // Add new keys
    filteredLines.push(`NEXT_PUBLIC_FIREBASE_VAPID_KEY=${vapidKey}`);
    filteredLines.push(`FIREBASE_PRIVATE_KEY=${multilineKey}`);
    filteredLines.push('');

    fs.writeFileSync(envPath, filteredLines.join('\n'));
    console.log('Successfully updated .env.local with Multiline Private Key.');
} catch (error) {
    console.error('Failed to update .env.local:', error);
    process.exit(1);
}
