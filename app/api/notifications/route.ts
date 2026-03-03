import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/notifications - for the logged driver
export async function GET() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ notifications: [], unread: 0 });
    }

    const { rows: notifications } = await query(`
    SELECT * FROM notifications
    WHERE driver_user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [user.id]);

    const { rows: unreadRows } = await query(
        'SELECT COUNT(*) as cnt FROM notifications WHERE driver_user_id = $1 AND read = 0', [user.id]
    );
    const unread = (unreadRows[0] as any).cnt;

    return NextResponse.json({ notifications, unread });
}

// POST /api/notifications/read - mark all as read
export async function POST() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await query('UPDATE notifications SET read = 1 WHERE driver_user_id = $1', [user.id]);
    return NextResponse.json({ ok: true });
}
