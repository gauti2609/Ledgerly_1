const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const models = ["gemini-2.5-flash"];

async function test() {
    console.log(`Testing API Key: ${API_KEY.substring(0, 10)}...`);

    for (const modelName of models) {
        console.log(`\nTrying model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, return OK.");
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}! Response:`, response.text());
            return;
        } catch (error) {
            console.log(`Failed ${modelName}: ${error.message}`);
            // If it's the last one, print full error
            if (modelName === models[models.length - 1]) {
                console.log("Final Error Details:", JSON.stringify(error, null, 2));
            }
        }
    }
}

test();
