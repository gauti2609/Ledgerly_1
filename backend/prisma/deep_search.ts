
import { Client } from 'pg';

async function main() {
    const pgClient = new Client({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
    try {
        await pgClient.connect();
        const dbs = await pgClient.query('SELECT datname FROM pg_database WHERE datistemplate = false');

        for (const dbName of dbs.rows.map(r => r.datname)) {
            console.log(`\nSEARCHING DB: ${dbName}`);
            const dbClient = new Client({
                connectionString: `postgresql://postgres:postgres@localhost:5432/${dbName}`
            });
            try {
                await dbClient.connect();
                // Find all text columns
                const searchRes = await dbClient.query(`
                    SELECT table_name, column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND (data_type LIKE 'char%' OR data_type = 'text' OR data_type = 'varchar')
                `);

                for (const row of searchRes.rows) {
                    try {
                        const count = await dbClient.query(`SELECT count(*) FROM "${row.table_name}" WHERE "${row.column_name}"::text ILIKE '%Ecosoul%'`);
                        if (parseInt(count.rows[0].count) > 0) {
                            console.log(`[MATCH FOUND] DB: ${dbName}, Table: ${row.table_name}, Column: ${row.column_name}, Count: ${count.rows[0].count}`);
                        }
                    } catch (e) {
                        // Ignore syntax errors for specific columns
                    }
                }
            } catch (err) {
                console.log(`[${dbName}] Error: ${err.message}`);
            } finally {
                await dbClient.end();
            }
        }
    } finally {
        await pgClient.end();
    }
}

main();
