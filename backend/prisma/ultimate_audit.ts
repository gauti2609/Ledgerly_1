
import { Client } from 'pg';

async function main() {
    console.log('--- ULTIMATE DATABASE AUDIT ---');
    const pgClient = new Client({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
    try {
        await pgClient.connect();
        const dbs = await pgClient.query('SELECT oid, datname FROM pg_database WHERE datistemplate = false');
        console.log('Databases available:');
        dbs.rows.forEach(r => console.log(`- ${r.datname} (OID: ${r.oid})`));

        for (const dbName of dbs.rows.map(r => r.datname)) {
            console.log(`\n--- Inspecting Database: ${dbName} ---`);
            const dbClient = new Client({
                connectionString: `postgresql://postgres:postgres@localhost:5432/${dbName}`
            });
            try {
                await dbClient.connect();
                // List all tables in all schemas
                const tables = await dbClient.query(`
                    SELECT table_schema, table_name 
                    FROM information_schema.tables 
                    WHERE table_type = 'BASE TABLE' 
                    AND table_schema NOT IN ('information_schema', 'pg_catalog')
                `);

                if (tables.rows.length === 0) {
                    console.log(`[${dbName}] No user-defined tables found.`);
                    continue;
                }

                for (const table of tables.rows) {
                    const fullTableName = `"${table.table_schema}"."${table.table_name}"`;
                    try {
                        const countRes = await dbClient.query(`SELECT count(*) FROM ${fullTableName}`);
                        const count = countRes.rows[0].count;
                        console.log(`[${dbName}] ${fullTableName}: ${count} rows`);

                        if (parseInt(count) > 0) {
                            // Search all text columns for 'Ecosoul'
                            const columns = await dbClient.query(`
                                SELECT column_name 
                                FROM information_schema.columns 
                                WHERE table_schema = $1 AND table_name = $2 
                                AND (data_type LIKE 'char%' OR data_type = 'text' OR data_type = 'varchar')
                            `, [table.table_schema, table.table_name]);

                            for (const col of columns.rows) {
                                const matchRes = await dbClient.query(`SELECT count(*) FROM ${fullTableName} WHERE "${col.column_name}"::text ILIKE '%Ecosoul%'`);
                                if (parseInt(matchRes.rows[0].count) > 0) {
                                    console.log(`!!! MATCH !!! DB: ${dbName}, Table: ${fullTableName}, Column: ${col.column_name}, Matches: ${matchRes.rows[0].count}`);
                                }
                            }
                        }
                    } catch (e) {
                        console.log(`[${dbName}] Error reading ${fullTableName}: ${e.message}`);
                    }
                }
            } catch (err) {
                console.log(`[${dbName}] Master error: ${err.message}`);
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
