const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY not found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log(`Querying: ${url.replace(API_KEY, 'HIDDEN_KEY')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response Body:');
        console.log(data);
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
