const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function attachDb(req, res, next) {
  let client;
  try {
    client = await pool.connect();
    req.db = client;
    res.on("finish", () => client.release());
    next();
  } catch (err) {
    if (client) client.release();
    next(err);
  }
}

module.exports = { pool, attachDb };
