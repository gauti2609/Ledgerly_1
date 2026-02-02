const { VertexAI } = require('@google-cloud/vertexai');

async function testVertex() {
    const projectId = 'finautomate-485215';
    const location = 'us-central1';

    console.log(`Initializing Vertex AI for project ${projectId} in ${location}...`);
    const vertexAI = new VertexAI({ project: projectId, location: location });

    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-1.5-pro'
    ];

    for (const modelName of modelsToTry) {
        console.log(`\nTrying model: ${modelName}...`);
        try {
            const model = vertexAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello, are you working?');
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;

            console.log('--- SUCCESS! ---');
            console.log(`Model ${modelName} worked!`);
            console.log('Response:', text);
            return; // Exit on first success
        } catch (error) {
            console.log(`Failed with ${modelName}. Error: ${error.message}`);
            // Only print full error if it's the last one
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                console.log('Full error for last attempt:', JSON.stringify(error, null, 2));
            }
        }
    }
}

testVertex();
