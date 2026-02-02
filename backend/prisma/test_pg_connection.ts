
import { Client } from 'pg';

async function main() {
    console.log('--- Exhaustive Database Audit ---');
    const pgClient = new Client({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
    try {
        await pgClient.connect();
        const dbs = await pgClient.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        console.log('Databases found:', dbs.rows.map(r => r.datname).join(', '));

        for (const dbName of dbs.rows.map(r => r.datname)) {
            const dbClient = new Client({
                connectionString: `postgresql://postgres:postgres@localhost:5432/${dbName}`
            });
            try {
                await dbClient.connect();
                console.log(`\nChecking DB: ${dbName}`);

                // Check all tables
                const allTables = await dbClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                for (const row of allTables.rows) {
                    const tableName = row.table_name;
                    const countResult = await dbClient.query(`SELECT count(*) FROM "${tableName}"`);
                    console.log(`[${dbName}] Table ${tableName}: ${countResult.rows[0].count} rows`);
                }

            } catch (err) {
                console.log(`[${dbName}] Error: ${err.message}`);
            } finally {
                await dbClient.end();
            }
        }
    } catch (e) {
        console.error('Master connection failed:', e.message);
    } finally {
        await pgClient.end();
    }
}

main();
