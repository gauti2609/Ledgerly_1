const axios = require('axios');

async function testChat() {
    try {
        console.log('Sending request to http://localhost:8002/api/ai/chat...');
        const response = await axios.post('http://localhost:8002/api/ai/chat', {
            message: 'Hello',
            history: []
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testChat();
