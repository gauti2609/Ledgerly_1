const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testChat() {
    console.log(`Testing Chat with gemini-2.5-flash...`);

    // Test: Model-First History
    try {
        console.log("\nAttempt: Model-First History");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
            history: [
                { role: "model", parts: [{ text: "Hello! I'm your AI assistant." }] }
            ]
        });
        const result = await chat.sendMessage("How are you?");
        const response = await result.response;
        console.log("Success! Response:", response.text());
        return;
    } catch (e) {
        console.log("Failed:", e.message);
    }
}

testChat();
