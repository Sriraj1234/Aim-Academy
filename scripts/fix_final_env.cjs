const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

// 1. VAPID Key
const vapidKey = "BCph9csjTz0IwHdajt6xfzIYE_0feFWkqJsJNTEIJBXBEDPZMdi8lJneckXUn0RWgIXu5ywM3qoBb7XTFfb2Tic";

// 2. Private Key (Correctly formatted with \n literals for Next.js .env)
const keyPart1 = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCykqch1NvSvWLw\\ni09lYJTjrK144mNAkm8oM2zIdhOBk2y3/febu9NcdKTGZ8gQzMe+9WQE1QZnvR90\\nH8kmIRlSF9UW5VAsHZlk0/9+lSY87+v/xnfgyfEkZlDWdfV64BTiMKAhUS8NrSQU\\n0Wac4Pb/aYfD0Ony5t2pNMv8uMusF8bhLimQv9k2Ua+Q0AX4OgiTDIK92UD7CJi1\\n5yhTdP6w81zf57CuSTk1CuSf+Zys/ZVSXbP1X9M2VSvde9AsLXFt++APA4JrscKv\\nOBSNjOO9h13QRinh/xDNOCH2lqQJZO6W6ESNG+VDw4x5rSjkg4wmvcghEdLKN7E6\\n8Gs3whJvAgMBAAECggEAE2Dm0j0PPedffUsg6pd4kNyEVsH6k19QwMQT4g0uQLmG\\n6tCctkHDxhzCZOWOSIRwiMCIgh27/DYB29A3O/QLk2USstFfyenMY6y95Ta6V5KR\\nwcf/6lz/1jtkOmHCqfr3STSNrA/rU0ieycOPpyaip0UEfrOFL97t3xbjrCFBuQMM\\nuLBcFFiE69YUKdgo60AWbesf5nD/xjD36I7ae1PcUwAOXi3UO+gQtW8EeASN13Pq\\nA4JbDbQ8yEi6PZj8NQa6Zt5wFDPasDi9mhKenGGNtGz3D607ZkkLW9aLIzzQ9QYP\\nTxcMschYP9Ih8y+BueswB990i409rhM7/b+VmnEdQQKBgQD0RzWkPbw3tZ9NyJNt\\naWAoWwR1KGS6fY6sqlOubzYy1nEvbCeIXgvJGwmSFYc7YgdteLoV1QtflrgeOHNc\\nT6E5G98b0E1Da5jefLCBhmlaXYHNe3ckZwr3+cRQb8diTgj98KsUErx17Pzl3Q1v\\nzRIS9X/lY3ZIwK58aYkahFfrFQKBgQC7JExvRQbAu+jOoqVQu3MDImDTEhx4/CdY\\nQ8YMYwJWHgW6VH/ayeTd5+jG6bnfRt3p9WoTnQs4I+DsA159Jd92UctPhkX65Oe6\\nV2GJ2Vi8ISZEJEa0Jdga9DY7JTEDdyWll+ZgQAXOErsRiwF0N4SyYxP4zj7FPQxx\\niwL7rbOYcwKBgQCEcm/FQ6vf0Nw1QoGdGzuF5gO+uk4TR6yqNhf1RltuqRLpkYzF\\nxahCPCSuTnnqWraIRqMu3zqxc3kU+aqi7JIP8uq/m+uomJhkWdsh/4zz8CtHDKCG\\n3k/2MDifHFxREtqRRYKc+aOxlPNydq6oZdpc6TuVVp51x/NTha1O8V7yGQKBgGLt\\nKUqYnp07uDGjYOhwbrf1cGGjbVG3WcUa7pKVtCJ59GUvTfcGSunTMgYUf6E8AQsw\\nJEcB+XBP5xJcJZLadmpBiswbGtsqLiUfE/ye3H12uJfE5WtNphN5jUFuw54lWc1T\\nowC2V1s8I49+f+JDhu4V2fTocd4qC23qIkWQ6SNpAoGAYdxvEl4ofXPA3Gt/nu+I\\ogODZ+NVMdAAp6fr4ldbJyQsh9ecy6hT6gdPCJYDiYff2XLo0qtgYi7qOlYwsOXc\\nPoR6bNgKV7q4Jnn7twe8wAkDvQulvXjBUxVXg6tNpw43GBvmpEJY8Vi8uAVH+IMy\\nh0CQNtbzSRf63xF1tW3iGBA=\\n-----END PRIVATE KEY-----";

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    // Remove existing keys
    const cleanedLines = lines.filter(line =>
        !line.trim().startsWith('FIREBASE_PRIVATE_KEY') &&
        !line.trim().startsWith('NEXT_PUBLIC_FIREBASE_VAPID_KEY')
    );

    // Add new keys
    cleanedLines.push(`NEXT_PUBLIC_FIREBASE_VAPID_KEY=${vapidKey}`);
    cleanedLines.push(`FIREBASE_PRIVATE_KEY="${keyPart1}"`);
    cleanedLines.push('');

    fs.writeFileSync(envPath, cleanedLines.join('\n'));
    console.log('Successfully updated .env.local with VAPID and Private Key.');
} catch (error) {
    console.error('Failed to update .env.local:', error);
    process.exit(1);
}
