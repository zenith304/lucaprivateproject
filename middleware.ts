import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './lib/auth';

const COOKIE_NAME = 'cd_session';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths
    const publicPaths = ['/login', '/register', '/forgot-password', '/leaderboard'];
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));
    const isApi = pathname.startsWith('/api/');
    const isRoot = pathname === '/';

    if (isPublic || isRoot) return NextResponse.next();

    // Admin routes protection
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const adminToken = request.cookies.get('cd_admin')?.value;
        if (adminToken !== 'clandestino-admin-ok') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        return NextResponse.next();
    }
    if (pathname === '/admin/login') return NextResponse.next();

    // API routes that require auth
    if (isApi) {
        // Admin APIs protection
        if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login') {
            const adminToken = request.cookies.get('cd_admin')?.value;
            if (adminToken !== 'clandestino-admin-ok') {
                return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
            }
            return NextResponse.next();
        }
        if (pathname === '/api/admin/login') return NextResponse.next();

        const publicApiPatterns = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/logout',
            '/api/auth/me',
            '/api/drivers',
            '/api/leaderboard',
            '/api/reviews',
        ];
        const isPublicApi = publicApiPatterns.some((p) => pathname.startsWith(p));
        if (isPublicApi) return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
        if (isApi) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = await verifySession(token);
    if (!user) {
        const response = isApi
            ? NextResponse.json({ error: 'Sessione scaduta' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(COOKIE_NAME);
        return response;
    }

    // Role-based protection
    if (pathname.startsWith('/driver') && user.role !== 'driver') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};
