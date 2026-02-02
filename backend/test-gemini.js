const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    // API Key from .env
    const apiKey = 'AIzaSyAmhM6up-DiMAoSkuCRhRRTL9CfQx7N880';
    console.log('Testing Gemini API with key ending in...', apiKey.slice(-4));

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('Attempting to generate content with gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello, strictly reply with 'OK'");
        console.log('Response:', result.response.text());
        console.log('SUCCESS: Gemini API is accessible.');
    } catch (error) {
        console.error('--- ERROR START ---');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Error Details:', JSON.stringify(error.response, null, 2));
        }
        if (error.errorDetails) {
            console.error('Detailed Error:', JSON.stringify(error.errorDetails, null, 2));
        }
        console.error('--- ERROR END ---');
        process.exit(1);
    }
}

testGemini();
