import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/rides - get rides for current user
export async function GET(request: NextRequest) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    let rides;

    if (user.role === 'customer') {
        const { rows } = await query(`
      SELECT r.*, d.name as driver_name, d.avatar_url as driver_avatar, d.car_model,
             u.nickname as customer_nickname
      FROM rides r
      JOIN drivers d ON d.user_id = r.driver_user_id
      JOIN users u ON u.id = r.customer_user_id
      WHERE r.customer_user_id = $1
      ORDER BY r.ride_datetime DESC
    `, [user.id]);
        rides = rows;
    } else {
        const { rows } = await query(`
      SELECT r.*, u.nickname as customer_nickname, u.email as customer_email
      FROM rides r
      JOIN users u ON u.id = r.customer_user_id
      WHERE r.driver_user_id = $1
      ORDER BY r.created_at DESC
    `, [user.id]);
        rides = rows;
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

        // Check driver exists and get seats
        const { rows: driverRows } = await query('SELECT * FROM drivers WHERE user_id = $1', [driver_user_id]);
        const driver = driverRows[0] as any;
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
        const windowStart = new Date(rideDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
        const windowEnd = new Date(rideDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

        const { rows: conflictRows } = await query(`
      SELECT id FROM rides
      WHERE driver_user_id = $1
        AND ride_datetime BETWEEN $2 AND $3
        AND status IN ('pending', 'accepted')
    `, [driver_user_id, windowStart, windowEnd]);
        const conflict = conflictRows[0];

        if (conflict) {
            // Get alternative drivers
            const { rows: alternatives } = await query(`
        SELECT d.user_id, d.name, d.rating_avg, d.seats
        FROM drivers d
        WHERE d.user_id != $1
          AND d.available = 1
          AND d.seats >= $2
          AND d.user_id NOT IN (
            SELECT driver_user_id FROM rides
            WHERE ride_datetime BETWEEN $3 AND $4
              AND status IN ('pending', 'accepted')
          )
        ORDER BY d.rating_avg DESC
        LIMIT 3
      `, [driver_user_id, passengerCount, windowStart, windowEnd]);

            return NextResponse.json({
                error: `Autista occupato in quella fascia oraria 😕`,
                alternatives,
                conflict: true,
            }, { status: 409 });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await query(`
      INSERT INTO rides (id, customer_user_id, driver_user_id, from_loc, to_loc, ride_datetime, passengers, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
    `, [id, user.id, driver_user_id, from_loc, to_loc, ride_datetime, passengerCount, notes || '', now]);

        // Create notification for driver
        const notifId = uuidv4();
        await query(`
      INSERT INTO notifications (id, driver_user_id, message, ride_id, read, created_at)
      VALUES ($1, $2, $3, $4, 0, $5)
    `, [notifId, driver_user_id, `🚨 Nuova corsa in arrivo da ${user.nickname || user.email}!`, id, now]);

        const { rows: ridesRows } = await query('SELECT * FROM rides WHERE id = $1', [id]);
        return NextResponse.json({ ride: ridesRows[0] }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
