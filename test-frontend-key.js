const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    console.log(`Testing API Key with model: gemini-1.5-flash...`);
    try {
        const result = await model.generateContent("Hello, strictly return 'OK' if you can hear me.");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("SUCCESS: Frontend API Key is working!");
    } catch (error) {
        console.error("ERROR: Failed to connect.");
        console.error(error);
    }
}

test();
