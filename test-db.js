const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_0tpwrTs4XeWN@ep-restless-bird-aph57d64-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require",
    connectionTimeoutMillis: 30000 // 30 seconds
  });

  try {
    console.log("Attempting to connect to Neon...");
    await client.connect();
    console.log("✅ Successfully connected to Neon!");
    
    const res = await client.query('SELECT NOW()');
    console.log("✅ Query successful:", res.rows[0]);
    
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err);
  } finally {
    await client.end();
  }
}

testConnection();
