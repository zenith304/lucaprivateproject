import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/notifications - for the logged driver
export async function GET() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ notifications: [], unread: 0 });
    }

    const db = getDb();
    const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE driver_user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(user.id);

    const unread = (db.prepare(
        'SELECT COUNT(*) as cnt FROM notifications WHERE driver_user_id = ? AND read = 0'
    ).get(user.id) as any).cnt;

    return NextResponse.json({ notifications, unread });
}

// POST /api/notifications/read - mark all as read
export async function POST() {
    const user = await getSession();
    if (!user || user.role !== 'driver') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const db = getDb();
    db.prepare('UPDATE notifications SET read = 1 WHERE driver_user_id = ?').run(user.id);
    return NextResponse.json({ ok: true });
}
