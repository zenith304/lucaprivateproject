import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper for admin auth (matches existing admin routes)
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

// GET /api/admin/rides - get all rides
export async function GET() {
    const isAdmin = await getAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    try {
        const { rows } = await query(`
            SELECT r.*,
                   c.nickname as customer_nickname, c.email as customer_email,
                   d.name as driver_name, d.car_model as driver_car
            FROM rides r
            LEFT JOIN users c ON c.id = r.customer_user_id
            LEFT JOIN drivers d ON d.user_id = r.driver_user_id
            ORDER BY r.ride_datetime DESC
        `);
        return NextResponse.json({ rides: rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
