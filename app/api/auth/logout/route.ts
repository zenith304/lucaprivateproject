import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
        name: 'cd_session',
        value: '',
        httpOnly: true,
        maxAge: 0,
        path: '/',
    });
    return response;
}
