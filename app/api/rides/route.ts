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

        // Check driver's work shifts
        let shifts = [];
        try {
            if (driver.work_shifts) {
                shifts = typeof driver.work_shifts === 'string' ? JSON.parse(driver.work_shifts) : driver.work_shifts;
            }
        } catch (e) { }

        if (shifts && shifts.length > 0) {
            // we need to get the local time of the ride to compare it with the HH:mm strings
            // Javascript Dates are tricky, let's just get the local hours and minutes from the frontend input context if we can,
            // or we evaluate it using Italian timezone
            const localDateStr = new Date(ride_datetime).toLocaleString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });

            let isWithinShift = false;
            for (const shift of shifts) {
                if (localDateStr >= shift.start && localDateStr <= shift.end) {
                    isWithinShift = true;
                    break;
                }
            }

            if (!isWithinShift) {
                return NextResponse.json({
                    error: `L'autista non è in turno a quest'ora. Orari: ${shifts.map((s: any) => `${s.start}-${s.end}`).join(', ')}`
                }, { status: 400 });
            }
        }

        // Smart Carpooling (40-minute window)
        const windowStart = new Date(rideDate.getTime() - 40 * 60 * 1000).toISOString();
        const windowEnd = new Date(rideDate.getTime() + 40 * 60 * 1000).toISOString();

        const { rows: conflictRows } = await query(`
      SELECT * FROM rides
      WHERE driver_user_id = $1
        AND ride_datetime BETWEEN $2 AND $3
        AND status IN ('pending', 'accepted')
    `, [driver_user_id, windowStart, windowEnd]);

        if (conflictRows.length > 0) {
            // calculate total booked passengers in this 40 min window
            const bookedPassengers = conflictRows.reduce((sum: number, r: any) => sum + r.passengers, 0);
            const remainingSeats = driver.seats - bookedPassengers;

            if (passengerCount > remainingSeats) {
                return NextResponse.json({
                    error: `Impossibile prenotare per questo orario. L'auto è già piena in quell'intervallo di tempo.`
                }, { status: 409 });
            }

            // We have space, but there's a ride nearby. Let's suggest joining it exactly!
            // Find the closest ride in time
            const existingRide = conflictRows[0];
            const existingRideTimeStr = new Date(existingRide.ride_datetime).getTime();

            // if it's not the exact same millisecond, suggest merging
            if (existingRideTimeStr !== rideDate.getTime()) {
                const diffMins = Math.round(Math.abs(existingRideTimeStr - rideDate.getTime()) / 60000);
                const beforeOrAfter = existingRideTimeStr < rideDate.getTime() ? 'prima' : 'dopo';
                const exactTimeFormatted = new Date(existingRide.ride_datetime).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                return NextResponse.json({
                    error: `Attenzione! C'è già una corsa che parte ${diffMins} minuti ${beforeOrAfter} (con a bordo ${bookedPassengers} persone). Se vuoi, puoi unirti a loro prenotando ESATTAMENTE alle ${exactTimeFormatted}!`
                }, { status: 409 });
            }
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
