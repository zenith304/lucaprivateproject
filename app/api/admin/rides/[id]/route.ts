import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getAdmin() {
    const tokenOptions = await cookies();
    const token = tokenOptions.get('admin_token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-in-production');
        await jwtVerify(token, secret);
        return true;
    } catch {
        return null;
    }
}

// PATCH /api/admin/rides/[id] - update ride completely
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await getAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, ride_datetime, from_loc, to_loc } = body;

    try {
        const { rows: existing } = await query('SELECT * FROM rides WHERE id = $1', [id]);
        if (existing.length === 0) return NextResponse.json({ error: 'Corsa non trovata' }, { status: 404 });

        let updateQuery = 'UPDATE rides SET ';
        const updateParams = [];
        let paramIndex = 1;

        if (status !== undefined) {
            updateQuery += `status = $${paramIndex++}, `;
            updateParams.push(status);
        }
        if (ride_datetime !== undefined) {
            updateQuery += `ride_datetime = $${paramIndex++}, `;
            updateParams.push(ride_datetime);
        }
        if (from_loc !== undefined) {
            updateQuery += `from_loc = $${paramIndex++}, `;
            updateParams.push(from_loc);
        }
        if (to_loc !== undefined) {
            updateQuery += `to_loc = $${paramIndex++}, `;
            updateParams.push(to_loc);
        }

        // Remove trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${paramIndex}`;
        updateParams.push(id);

        if (updateParams.length > 1) { // Only execute if there's something to update
            await query(updateQuery, updateParams);
        }

        const { rows } = await query('SELECT * FROM rides WHERE id = $1', [id]);
        return NextResponse.json({ ride: rows[0] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE /api/admin/rides/[id] - delete ride
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await getAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { id } = await params;

    try {
        // Delete related notifications and reviews first
        await query('DELETE FROM notifications WHERE ride_id = $1', [id]);
        await query('DELETE FROM reviews WHERE ride_id = $1', [id]);
        await query('DELETE FROM rides WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
