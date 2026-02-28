import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getDb();

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
        if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

        // Ensure referential integrity by deleting child records manually
        const deleteTx = db.transaction(() => {
            if (user.role === 'driver') {
                // Delete reviews for this driver
                db.prepare('DELETE FROM reviews WHERE driver_user_id = ?').run(id);
                // Delete notifications for this driver
                db.prepare('DELETE FROM notifications WHERE driver_user_id = ?').run(id);
                // Delete rides where this user was the driver
                db.prepare('DELETE FROM rides WHERE driver_user_id = ?').run(id);
                // Delete driver profile
                db.prepare('DELETE FROM drivers WHERE user_id = ?').run(id);
            } else {
                // Delete reviews written by this customer
                db.prepare('DELETE FROM reviews WHERE customer_user_id = ?').run(id);
                // Delete rides booked by this customer
                db.prepare('DELETE FROM rides WHERE customer_user_id = ?').run(id);
            }

            // Finally delete the user
            db.prepare('DELETE FROM users WHERE id = ?').run(id);
        });

        deleteTx();

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Errore durante l\'eliminazione' }, { status: 500 });
    }
}
