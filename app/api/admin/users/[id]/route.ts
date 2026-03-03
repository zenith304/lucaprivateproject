import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [id]);
        const user = userRows[0] as any;
        if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

        // Ensure referential integrity by deleting child records manually
        const dbClient = await getClient();
        try {
            await dbClient.query('BEGIN');
            if (user.role === 'driver') {
                // Delete reviews for this driver
                await dbClient.query('DELETE FROM reviews WHERE driver_user_id = $1', [id]);
                // Delete notifications for this driver
                await dbClient.query('DELETE FROM notifications WHERE driver_user_id = $1', [id]);
                // Delete rides where this user was the driver
                await dbClient.query('DELETE FROM rides WHERE driver_user_id = $1', [id]);
                // Delete driver profile
                await dbClient.query('DELETE FROM drivers WHERE user_id = $1', [id]);
            } else {
                // Delete reviews written by this customer
                await dbClient.query('DELETE FROM reviews WHERE customer_user_id = $1', [id]);
                // Delete rides booked by this customer
                await dbClient.query('DELETE FROM rides WHERE customer_user_id = $1', [id]);
            }

            // Finally delete the user
            await dbClient.query('DELETE FROM users WHERE id = $1', [id]);
            await dbClient.query('COMMIT');
        } catch (e) {
            await dbClient.query('ROLLBACK');
            throw e;
        } finally {
            dbClient.release();
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Errore durante l\'eliminazione' }, { status: 500 });
    }
}
