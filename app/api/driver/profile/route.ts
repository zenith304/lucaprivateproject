import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/driver/profile
export async function GET() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { rows: driverRows } = await query('SELECT * FROM drivers WHERE user_id = $1', [user.id]);
    const driver = driverRows[0] as any;
    const { rows: reviews } = await query(`
    SELECT r.*, u.nickname as customer_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_user_id
    WHERE r.driver_user_id = $1
    ORDER BY r.created_at DESC
  `, [user.id]);

    return NextResponse.json({ driver, reviews });
}

// PATCH /api/driver/profile - update driver profile
export async function PATCH(request: NextRequest) {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { name, avatar_url, car_model, seats, available } = body;

    if (seats !== undefined && (seats < 1 || seats > 8)) {
        return NextResponse.json({ error: 'Posti deve essere tra 1 e 8' }, { status: 400 });
    }

    const { rows: driverRows } = await query('SELECT * FROM drivers WHERE user_id = $1', [user.id]);
    const driver = driverRows[0] as any;
    if (!driver) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });

    await query(`
    UPDATE drivers SET
      name = COALESCE($1, name),
      avatar_url = COALESCE($2, avatar_url),
      car_model = COALESCE($3, car_model),
      seats = COALESCE($4, seats),
      available = COALESCE($5, available)
    WHERE user_id = $6
  `, [
        name ?? null,
        avatar_url !== undefined ? avatar_url : null,
        car_model ?? null,
        seats ?? null,
        available !== undefined ? (available ? 1 : 0) : null,
        user.id
    ]);

    const { rows: updatedRows } = await query('SELECT * FROM drivers WHERE user_id = $1', [user.id]);
    return NextResponse.json({ driver: updatedRows[0] });
}
