import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// POST /api/auth/register
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, role, nickname, name, avatar_url, car_model, seats } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
        }
        if (!['customer', 'driver'].includes(role)) {
            return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
        }
        if (role === 'driver' && (!seats || seats < 1 || seats > 8)) {
            return NextResponse.json({ error: 'Numero posti obbligatorio (1–8)' }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
        }

        const id = uuidv4();
        const hash = bcrypt.hashSync(password, 10);
        const now = new Date().toISOString();

        const insertUser = db.prepare(
            'INSERT INTO users (id, email, password_hash, role, nickname, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const displayName = nickname || name || email.split('@')[0];

        db.transaction(() => {
            insertUser.run(id, email, hash, role, displayName, now);
            if (role === 'driver') {
                db.prepare(
                    'INSERT INTO drivers (user_id, name, avatar_url, car_model, seats, available, rating_avg, rides_count) VALUES (?, ?, ?, ?, ?, 1, 0, 0)'
                ).run(id, name || displayName, avatar_url || '', car_model || '', seats);
            }
        })();

        const token = await createSession({ id, email, role, nickname: displayName });
        const cookieOpts = setSessionCookie(token);
        const response = NextResponse.json({
            user: { id, email, role, nickname: displayName },
        }, { status: 201 });
        response.cookies.set(cookieOpts);
        return response;
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
