import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// POST /api/reviews
export async function POST(request: NextRequest) {
    const user = await getSession();
    if (!user || user.role !== 'customer') {
        return NextResponse.json({ error: 'Solo i clienti possono recensire' }, { status: 403 });
    }

    const body = await request.json();
    const { ride_id, stars, review_text, tags } = body;

    if (!ride_id || !stars || stars < 1 || stars > 5) {
        return NextResponse.json({ error: 'Ride e stelle (1–5) obbligatori' }, { status: 400 });
    }
    if (review_text && review_text.length > 300) {
        return NextResponse.json({ error: 'Recensione max 300 caratteri' }, { status: 400 });
    }

    const { rows: rideRows } = await query('SELECT * FROM rides WHERE id = $1', [ride_id]);
    const ride = rideRows[0] as any;

    if (!ride) return NextResponse.json({ error: 'Corsa non trovata' }, { status: 404 });
    if (ride.customer_user_id !== user.id) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    if (ride.status !== 'completed') return NextResponse.json({ error: 'Puoi recensire solo corse completate' }, { status: 400 });

    const { rows: reviewRows } = await query('SELECT id FROM reviews WHERE ride_id = $1', [ride_id]);
    const existing = reviewRows[0];
    if (existing) return NextResponse.json({ error: 'Hai già lasciato una recensione' }, { status: 409 });

    const id = uuidv4();
    const now = new Date().toISOString();

    await query(`
    INSERT INTO reviews (id, ride_id, driver_user_id, customer_user_id, stars, review_text, tags, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [id, ride_id, ride.driver_user_id, user.id, stars, review_text || '', JSON.stringify(tags || []), now]);

    // Update driver rating avg
    const { rows: avgRows } = await query(
        'SELECT AVG(stars) as avg FROM reviews WHERE driver_user_id = $1', [ride.driver_user_id]
    );
    const avgResult = avgRows[0] as any;

    if (avgResult?.avg) {
        await query('UPDATE drivers SET rating_avg = $1 WHERE user_id = $2', [
            Math.round(avgResult.avg * 10) / 10,
            ride.driver_user_id
        ]);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
}

// GET /api/reviews?driver_id=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driver_id');

    const { rows: reviews } = await query(`
    SELECT r.*, u.nickname as customer_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_user_id
    WHERE r.driver_user_id = $1
    ORDER BY r.created_at DESC
  `, [driverId]);

    return NextResponse.json({ reviews });
}
