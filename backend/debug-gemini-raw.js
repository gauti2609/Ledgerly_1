const https = require('https');

// API Key from .env
const apiKey = 'AIzaSyAmhM6up-DiMAoSkuCRhRRTL9CfQx7N880';
console.log('Testing Gemini API (Raw REST) with key ending in...', apiKey.slice(-4));

const modelName = 'gemini-2.0-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

const data = JSON.stringify({
    contents: [{
        parts: [{ text: "Hello" }]
    }]
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('--- RAW RESPONSE BODY ---');
        console.log(body);
        console.log('--- END RESPONSE ---');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
