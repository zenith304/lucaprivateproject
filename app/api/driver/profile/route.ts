import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/driver/profile
export async function GET() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const db = getDb();
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id) as any;
    const reviews = db.prepare(`
    SELECT r.*, u.nickname as customer_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_user_id
    WHERE r.driver_user_id = ?
    ORDER BY r.created_at DESC
  `).all(user.id);

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

    const db = getDb();
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id) as any;
    if (!driver) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });

    db.prepare(`
    UPDATE drivers SET
      name = COALESCE(?, name),
      avatar_url = COALESCE(?, avatar_url),
      car_model = COALESCE(?, car_model),
      seats = COALESCE(?, seats),
      available = COALESCE(?, available)
    WHERE user_id = ?
  `).run(
        name ?? null,
        avatar_url !== undefined ? avatar_url : null,
        car_model ?? null,
        seats ?? null,
        available !== undefined ? (available ? 1 : 0) : null,
        user.id
    );

    const updated = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);
    return NextResponse.json({ driver: updated });
}
