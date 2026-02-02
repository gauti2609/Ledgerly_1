import axios from 'axios';

const API_URL = 'http://localhost:8002/api';

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'gautam@smbcllp.com',
            password: 'password123'
        });
        const token = loginRes.data.access_token;
        console.log('Login successful. Token received.');

        // 2. Get Users
        console.log('Fetching users...');
        const usersRes = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved ${usersRes.data.length} users.`);
        console.log('Users:', usersRes.data.map((u: any) => `${u.email} (${u.role})`));

        // 3. Create User
        console.log('Creating new user manager@test.com...');
        try {
            const createRes = await axios.post(`${API_URL}/users`, {
                email: 'manager@test.com',
                password: 'password123',
                role: 'MANAGER'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('User created:', createRes.data);
        } catch (e: any) {
            if (e.response?.status === 409) {
                console.log('User manager@test.com already exists.');
            } else {
                throw e;
            }
        }

        // 4. Verify Creation
        const usersRes2 = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const newUser = usersRes2.data.find((u: any) => u.email === 'manager@test.com');
        if (newUser) {
            console.log('Verification Successful: New user found in list.');
        } else {
            console.error('Verification Failed: New user NOT found.');
        }

    } catch (error: any) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error config:', error.config);
        }
        process.exit(1);
    }
}

main();
