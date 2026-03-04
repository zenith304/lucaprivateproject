import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH /api/rides/[id] - update ride status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['accepted', 'refused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }

    const { rows: rideRows } = await query('SELECT * FROM rides WHERE id = $1', [id]);
    const ride = rideRows[0] as any;

    if (!ride) return NextResponse.json({ error: 'Corsa non trovata' }, { status: 404 });

    // Authorization
    if (user.role === 'driver' && ride.driver_user_id !== user.id) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    if (user.role === 'customer' && ride.customer_user_id !== user.id) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Business rules
    if (user.role === 'customer' && status !== 'cancelled') {
        return NextResponse.json({ error: 'Il cliente può solo annullare' }, { status: 403 });
    }

    if (status === 'cancelled') {
        if (user.role === 'customer') {
            // Customer cancellation rules
            if (ride.status === 'completed' || ride.status === 'refused' || ride.status === 'cancelled') {
                return NextResponse.json({ error: 'Stato corsa non valido per l\'annullamento' }, { status: 400 });
            }

            // If ride is accepted, check that it's more than 2 hours away
            if (ride.status === 'accepted') {
                const rideDate = new Date(ride.ride_datetime);
                const now = new Date();
                const hoursDifference = (rideDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (hoursDifference < 2) {
                    return NextResponse.json({ error: 'Puoi annullare una prenotazione accettata solo con almeno 2 ore di preavviso' }, { status: 400 });
                }
            }
        } else if (user.role === 'driver') {
            // Driver cancellation rules
            // Allow if accepted. Deny if already completed/cancelled/refused
            if (ride.status !== 'accepted' && ride.status !== 'pending') {
                return NextResponse.json({ error: 'Stato corsa non valido per l\'annullamento' }, { status: 400 });
            }
        }
    } else if (user.role === 'driver' && status === 'cancelled') {
        // this block is handled by the block above
    }

    await query('UPDATE rides SET status = $1 WHERE id = $2', [status, id]);

    // If driver interacts with the ride, mark related notifications as read
    if (user.role === 'driver') {
        await query('UPDATE notifications SET read = 1 WHERE ride_id = $1 AND driver_user_id = $2', [id, user.id]);
    }

    // Update driver stats when completed
    if (status === 'completed') {
        await query('UPDATE drivers SET rides_count = rides_count + 1 WHERE user_id = $1', [ride.driver_user_id]);

        // Recalculate rating avg
        const { rows: avgRows } = await query(
            'SELECT AVG(stars) as avg, COUNT(*) as cnt FROM reviews WHERE driver_user_id = $1', [ride.driver_user_id]
        );
        const avgResult = avgRows[0] as any;

        if (avgResult?.avg) {
            await query('UPDATE drivers SET rating_avg = $1 WHERE user_id = $2', [
                Math.round(avgResult.avg * 10) / 10,
                ride.driver_user_id
            ]);
        }
    }

    const { rows: updatedRows } = await query('SELECT * FROM rides WHERE id = $1', [id]);
    return NextResponse.json({ ride: updatedRows[0] });
}
