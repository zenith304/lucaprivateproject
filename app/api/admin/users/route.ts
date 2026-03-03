import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const { rows: users } = await query(`
            SELECT u.id, u.email, u.role, u.nickname, u.created_at,
                   d.name, d.car_model, d.seats, d.rating_avg, d.rides_count
            FROM users u
            LEFT JOIN drivers d ON u.id = d.user_id
            ORDER BY u.created_at DESC
        `);

        return NextResponse.json({ users });
    } catch {
        return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 });
    }
}
