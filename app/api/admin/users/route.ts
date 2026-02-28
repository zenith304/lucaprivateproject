import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const users = db.prepare(`
            SELECT u.id, u.email, u.role, u.nickname, u.created_at,
                   d.name, d.car_model, d.seats, d.rating_avg, d.rides_count
            FROM users u
            LEFT JOIN drivers d ON u.id = d.user_id
            ORDER BY u.created_at DESC
        `).all();

        return NextResponse.json({ users });
    } catch {
        return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 });
    }
}
