import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/drivers - list all drivers with their stats
export async function GET() {
    const db = getDb();
    const drivers = db.prepare(`
    SELECT d.*, u.email, u.nickname
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    ORDER BY d.rating_avg DESC, d.rides_count DESC
  `).all();
    return NextResponse.json({ drivers });
}
