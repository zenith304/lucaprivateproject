import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/leaderboard
export async function GET() {
  const { rows: drivers } = await query(`
    SELECT d.*, u.email
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    ORDER BY d.rating_avg DESC, d.rides_count DESC
  `);

  return NextResponse.json({ drivers });
}
