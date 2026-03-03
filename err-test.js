const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_GOrCL9hfApv4@ep-winter-tree-abjfb1nk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'driver')),
      nickname TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      name TEXT NOT NULL,
      avatar_url TEXT,
      car_model TEXT,
      seats INTEGER NOT NULL DEFAULT 4 CHECK(seats BETWEEN 1 AND 8),
      available INTEGER NOT NULL DEFAULT 1,
      rating_avg REAL NOT NULL DEFAULT 0,
      rides_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      customer_user_id TEXT NOT NULL REFERENCES users(id),
      driver_user_id TEXT NOT NULL REFERENCES users(id),
      from_loc TEXT NOT NULL,
      to_loc TEXT NOT NULL,
      ride_datetime TIMESTAMP NOT NULL,
      passengers INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','refused','completed','cancelled')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL REFERENCES rides(id),
      driver_user_id TEXT NOT NULL REFERENCES users(id),
      customer_user_id TEXT NOT NULL REFERENCES users(id),
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      review_text TEXT,
      tags TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      driver_user_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      ride_id TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seed_done (done INTEGER PRIMARY KEY);
  `);
        console.log("Success");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
