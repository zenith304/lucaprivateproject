'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';

export default function BottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    if (user.role === 'driver') {
        return (
            <nav className="bottom-nav">
                <Link href="/driver/dashboard" className={`bottom-nav-item ${pathname === '/driver/dashboard' ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🏠</span>
                    Dashboard
                </Link>
                <div className="bottom-nav-item" style={{ pointerEvents: 'none' }}>
                    <NotificationBell />
                </div>
                <Link href="/leaderboard" className={`bottom-nav-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🏆</span>
                    Classifica
                </Link>
                <Link href="/driver/profile" className={`bottom-nav-item ${pathname === '/driver/profile' ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">👤</span>
                    Profilo
                </Link>
            </nav>
        );
    }

    return (
        <nav className="bottom-nav">
            <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
                <span className="bottom-nav-icon">🚗</span>
                Home
            </Link>
            <Link href="/my-rides" className={`bottom-nav-item ${pathname === '/my-rides' ? 'active' : ''}`}>
                <span className="bottom-nav-icon">📋</span>
                Corse
            </Link>
            <Link href="/leaderboard" className={`bottom-nav-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
                <span className="bottom-nav-icon">🏆</span>
                Classifica
            </Link>
        </nav>
    );
}
