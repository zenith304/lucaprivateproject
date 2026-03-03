import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e password obbligatori' }, { status: 400 });
        }

        const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0] as any;

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
        }

        const token = await createSession({
            id: user.id,
            email: user.email,
            role: user.role,
            nickname: user.nickname,
        });

        const cookieOpts = setSessionCookie(token);
        const response = NextResponse.json({
            user: { id: user.id, email: user.email, role: user.role, nickname: user.nickname },
        });
        response.cookies.set(cookieOpts);
        return response;
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
