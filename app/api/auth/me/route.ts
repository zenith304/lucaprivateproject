import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET /api/auth/me
export async function GET() {
    const user = await getSession();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user });
}
