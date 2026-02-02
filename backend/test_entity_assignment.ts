import axios from 'axios';

const API_URL = 'http://localhost:8002/api';

async function main() {
    try {
        // 1. Login as Tenant Admin
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'gautam@smbcllp.com',
            password: 'password123'
        }, {
            // Axios config to handle connection issues
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        });
        const token = loginRes.data.access_token;
        console.log('Login successful.');

        // 2. Create Entity
        console.log('Creating Test Entity...');
        const entityRes = await axios.post(`${API_URL}/entities`, {
            name: 'Test Entity ' + Date.now(),
            entityType: 'Company'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const entityId = entityRes.data.id;
        console.log(`Entity created: ${entityId}`);

        // 3. Find Manager User
        const usersRes = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const managerUser = usersRes.data.find((u: any) => u.email === 'manager@test.com');

        if (!managerUser) {
            console.error('Manager user not found. Did previous test run?');
            process.exit(1);
        }

        // 4. Update Manager to Entity Admin assigned to new Entity
        console.log(`Assigning ${managerUser.email} to entity ${entityId}...`);
        const updateRes = await axios.put(`${API_URL}/users/${managerUser.id}`, {
            role: 'ENTITY_ADMIN',
            entityId: entityId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 5. Verify
        if (updateRes.data.entityId === entityId && updateRes.data.role === 'ENTITY_ADMIN') {
            console.log('Verification Successful: User assigned to entity correctly.');
        } else {
            console.error('Verification Failed: API response mismatch', updateRes.data);
        }

    } catch (error: any) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

main();
