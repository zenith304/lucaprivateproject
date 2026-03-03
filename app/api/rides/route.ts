import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/rides - get rides for current user
export async function GET(request: NextRequest) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const db = getDb();
    let rides;

    if (user.role === 'customer') {
        rides = db.prepare(`
      SELECT r.*, d.name as driver_name, d.avatar_url as driver_avatar, d.car_model,
             u.nickname as customer_nickname
      FROM rides r
      JOIN drivers d ON d.user_id = r.driver_user_id
      JOIN users u ON u.id = r.customer_user_id
      WHERE r.customer_user_id = ?
      ORDER BY r.ride_datetime DESC
    `).all(user.id);
    } else {
        rides = db.prepare(`
      SELECT r.*, u.nickname as customer_nickname, u.email as customer_email
      FROM rides r
      JOIN users u ON u.id = r.customer_user_id
      WHERE r.driver_user_id = ?
      ORDER BY r.created_at DESC
    `).all(user.id);
    }

    return NextResponse.json({ rides });
}

// POST /api/rides - create a new ride
export async function POST(request: NextRequest) {
    const user = await getSession();
    if (!user || user.role !== 'customer') {
        return NextResponse.json({ error: 'Solo i clienti possono prenotare' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { driver_user_id, from_loc, to_loc, ride_datetime, passengers, notes } = body;

        if (!driver_user_id || !from_loc || !to_loc || !ride_datetime) {
            return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
        }

        // Validate datetime is in the future
        const rideDate = new Date(ride_datetime);
        if (rideDate <= new Date()) {
            return NextResponse.json({ error: 'Non puoi prenotare nel passato! ⏰' }, { status: 400 });
        }

        const db = getDb();

        // Check driver exists and get seats
        const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(driver_user_id) as any;
        if (!driver) {
            return NextResponse.json({ error: 'Autista non trovato' }, { status: 404 });
        }

        // Validate passenger count
        const passengerCount = passengers || 1;
        if (passengerCount > driver.seats) {
            return NextResponse.json({
                error: `Troppi passeggeri per questa auto! 🚗 Max ${driver.seats} posti`
            }, { status: 400 });
        }

        // Check driver availability at that time (within 2 hours)
        const rideDateStr = ride_datetime;
        const windowStart = new Date(rideDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
        const windowEnd = new Date(rideDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

        const conflict = db.prepare(`
      SELECT id FROM rides
      WHERE driver_user_id = ?
        AND ride_datetime BETWEEN ? AND ?
        AND status IN ('pending', 'accepted')
    `).get(driver_user_id, windowStart, windowEnd);

        if (conflict) {
            // Get alternative drivers
            const alternatives = db.prepare(`
        SELECT d.user_id, d.name, d.rating_avg, d.seats
        FROM drivers d
        WHERE d.user_id != ?
          AND d.available = 1
          AND d.seats >= ?
          AND d.user_id NOT IN (
            SELECT driver_user_id FROM rides
            WHERE ride_datetime BETWEEN ? AND ?
              AND status IN ('pending', 'accepted')
          )
        ORDER BY d.rating_avg DESC
        LIMIT 3
      `).all(driver_user_id, passengerCount, windowStart, windowEnd);

            return NextResponse.json({
                error: `Autista occupato in quella fascia oraria 😕`,
                alternatives,
                conflict: true,
            }, { status: 409 });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO rides (id, customer_user_id, driver_user_id, from_loc, to_loc, ride_datetime, passengers, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, user.id, driver_user_id, from_loc, to_loc, ride_datetime, passengerCount, notes || '', now);

        // Create notification for driver
        const notifId = uuidv4();
        db.prepare(`
      INSERT INTO notifications (id, driver_user_id, message, ride_id, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(notifId, driver_user_id, `🚨 Nuova corsa in arrivo da ${user.nickname || user.email}!`, id, now);

        const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(id);
        return NextResponse.json({ ride }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
