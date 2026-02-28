'use client';
import { useAuth } from './AuthContext';
import Link from 'next/link';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="navbar">
            <Link href="/" className="navbar-brand">🚗 ClanDestino</Link>
            <div className="navbar-actions">
                {user ? (
                    <>
                        <span className="text-sm text-muted" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.nickname || user.email.split('@')[0]}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Esci</button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn btn-outline btn-sm">Accedi</Link>
                        <Link href="/register" className="btn btn-primary btn-sm">Registrati</Link>
                    </>
                )}
            </div>
        </header>
    );
}
