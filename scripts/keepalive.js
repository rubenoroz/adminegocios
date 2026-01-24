const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL env var is required.');
    process.exit(1);
}

// Ensure SSL connection for Supabase/Postgres
const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const MAX_HOURS_WITHOUT_RUN = 48;
const RANDOM_RUN_PROBABILITY = 0.2;

async function runKeepAlive() {
    console.log(`[${new Date().toISOString()}] Starting Keep-Alive Check (PG)...`);

    try {
        await client.connect();

        // Check if table exists, create if not
        await client.query(`
      CREATE TABLE IF NOT EXISTS keepalive_log (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        note TEXT
      )
    `);

        // 1. Check last execution time
        const res = await client.query(`
      SELECT created_at FROM keepalive_log 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

        const logs = res.rows;
        let shouldRun = false;
        let reason = '';

        if (!logs || logs.length === 0) {
            shouldRun = true;
            reason = 'First run (no logs found)';
        } else {
            const lastRun = new Date(logs[0].created_at);
            const now = new Date();
            const diffMs = now - lastRun;
            const diffHours = diffMs / (1000 * 60 * 60);

            console.log(`Last run was ${diffHours.toFixed(2)} hours ago.`);

            if (diffHours >= MAX_HOURS_WITHOUT_RUN) {
                shouldRun = true;
                reason = `More than ${MAX_HOURS_WITHOUT_RUN} hours since last run`;
            } else {
                // Random check
                const randomValue = Math.random();
                console.log(`Random value: ${randomValue.toFixed(4)} (Threshold: ${RANDOM_RUN_PROBABILITY})`);

                if (randomValue < RANDOM_RUN_PROBABILITY) {
                    shouldRun = true;
                    reason = 'Random execution triggered';
                } else {
                    shouldRun = false;
                    reason = 'Skipping (dice roll succeeded)';
                }
            }
        }

        if (shouldRun) {
            console.log(`DECISION: EXECUTE (${reason})`);
            await executeQuery();
        } else {
            console.log(`DECISION: SKIP (${reason})`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function executeQuery() {
    try {
        await client.query("INSERT INTO keepalive_log (note) VALUES ('Keep-alive run')");
        console.log('Successfully recorded keep-alive activity.');
    } catch (err) {
        console.error('Error executing insert:', err.message);
        // Fallback: SELECT 1
        console.log('Attempting fallback SELECT 1...');
        await client.query('SELECT 1');
    }
}

runKeepAlive();
