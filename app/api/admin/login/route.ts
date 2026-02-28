import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        // Hardcoded admin password for simplicity
        if (password !== 'clandestino_admin') {
            return NextResponse.json({ error: 'Password errata' }, { status: 401 });
        }

        const response = NextResponse.json({ success: true });
        response.cookies.set('cd_admin', 'clandestino-admin-ok', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 1 week
        });

        return response;
    } catch {
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }
}
