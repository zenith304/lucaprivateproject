import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

let _dbInitialized = false;

export async function query(text: string, params?: any[]) {
    if (!_dbInitialized) {
        await initSchema();
        await seedData();
        _dbInitialized = true;
    }
    return pool.query(text, params);
}

// Function to start a transaction explicitly and return the client
export async function getClient() {
    if (!_dbInitialized) {
        await initSchema();
        await seedData();
        _dbInitialized = true;
    }
    return pool.connect();
}

async function initSchema() {
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
      rides_count INTEGER NOT NULL DEFAULT 0,
      work_shifts TEXT DEFAULT '[]'
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
}

async function seedData() {
    const { rows } = await pool.query('SELECT done FROM seed_done WHERE done=1');
    if (rows.length > 0) return;

    const now = new Date().toISOString();

    const drivers = [
        {
            id: uuidv4(),
            email: 'marco@demo.it',
            password: 'demo1234',
            nickname: 'Marco',
            name: 'Marco Rossi',
            avatar_url: '',
            car_model: 'Fiat Punto',
            seats: 4,
        },
        {
            id: uuidv4(),
            email: 'laura@demo.it',
            password: 'demo1234',
            nickname: 'Laura',
            name: 'Laura Bianchi',
            avatar_url: '',
            car_model: 'Mini Cooper',
            seats: 3,
        },
        {
            id: uuidv4(),
            email: 'gianni@demo.it',
            password: 'demo1234',
            nickname: 'Gianni',
            name: 'Gianni Ferrari',
            avatar_url: '',
            car_model: 'BMW Serie 3',
            seats: 4,
        },
        {
            id: uuidv4(),
            email: 'sara@demo.it',
            password: 'demo1234',
            nickname: 'Sara',
            name: 'Sara Conti',
            avatar_url: '',
            car_model: 'Volkswagen Golf',
            seats: 4,
        },
        {
            id: uuidv4(),
            email: 'luca@demo.it',
            password: 'demo1234',
            nickname: 'Luca',
            name: 'Luca Marino',
            avatar_url: '',
            car_model: 'Toyota Yaris',
            seats: 4,
        },
    ];

    const customer = {
        id: uuidv4(),
        email: 'cliente@demo.it',
        password: 'demo1234',
        nickname: 'Cliente Demo',
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert customer
        await client.query(
            'INSERT INTO users (id, email, password_hash, role, nickname, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [customer.id, customer.email, bcrypt.hashSync(customer.password, 10), 'customer', customer.nickname, now]
        );

        // Demo ratings and ride counts for drivers
        const demoStats = [
            { rating: 4.8, rides: 42 },
            { rating: 4.5, rides: 28 },
            { rating: 4.9, rides: 65 },
            { rating: 4.2, rides: 15 },
            { rating: 4.6, rides: 33 },
        ];

        for (let i = 0; i < drivers.length; i++) {
            const d = drivers[i];
            const hash = bcrypt.hashSync(d.password, 10);
            await client.query(
                'INSERT INTO users (id, email, password_hash, role, nickname, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
                [d.id, d.email, hash, 'driver', d.nickname, now]
            );
            await client.query(
                'INSERT INTO drivers (user_id, name, avatar_url, car_model, seats, available, rating_avg, rides_count, work_shifts) VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)',
                [d.id, d.name, d.avatar_url, d.car_model, d.seats, demoStats[i].rating, demoStats[i].rides, '[]']
            );
        }

        // Some demo completed rides
        const rideId1 = uuidv4();
        const rideId2 = uuidv4();
        const pastDate1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const pastDate2 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        await client.query(
            'INSERT INTO rides (id, customer_user_id, driver_user_id, from_loc, to_loc, ride_datetime, passengers, notes, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [rideId1, customer.id, drivers[0].id, 'Piazza Roma', 'Aeroporto Malpensa', pastDate1, 2, 'Volo alle 8:30', 'completed', pastDate1]
        );

        await client.query(
            'INSERT INTO rides (id, customer_user_id, driver_user_id, from_loc, to_loc, ride_datetime, passengers, notes, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [rideId2, customer.id, drivers[2].id, 'Casa mia', 'Stadio Meazza', pastDate2, 3, '', 'completed', pastDate2]
        );

        // Reviews for completed rides
        await client.query(
            'INSERT INTO reviews (id, ride_id, driver_user_id, customer_user_id, stars, review_text, tags, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [uuidv4(), rideId1, drivers[0].id, customer.id, 5, 'Puntualissimo e gentilissimo!', JSON.stringify(['Puntuale ⏰', 'Guida smooth 🛣️']), pastDate1]
        );

        await client.query(
            'INSERT INTO reviews (id, ride_id, driver_user_id, customer_user_id, stars, review_text, tags, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [uuidv4(), rideId2, drivers[2].id, customer.id, 5, 'Guida fantastica, macchina comodissima!', JSON.stringify(['DJ top 🎵', 'Guida smooth 🛣️']), pastDate2]
        );

        await client.query('INSERT INTO seed_done (done) VALUES (1)');

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to seed DB', e);
    } finally {
        client.release();
    }
}
