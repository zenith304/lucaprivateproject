import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'clandestino-secret-key-change-in-production-12345'
);

const COOKIE_NAME = 'cd_session';

export interface SessionUser {
    id: string;
    email: string;
    role: 'customer' | 'driver';
    nickname?: string;
}

export async function createSession(user: SessionUser): Promise<string> {
    const token = await new SignJWT({ ...user })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET);
    return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return {
            id: payload.id as string,
            email: payload.email as string,
            role: payload.role as 'customer' | 'driver',
            nickname: payload.nickname as string | undefined,
        };
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
}

export function setSessionCookie(token: string) {
    return {
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
    };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
