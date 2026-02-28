'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';

interface Driver {
    user_id: string;
    name: string;
    avatar_url: string;
    car_model: string;
    seats: number;
    available: number;
    rating_avg: number;
    rides_count: number;
}

function Avatar({ name, url, size = 56 }: { name: string; url?: string; size?: number }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const style: React.CSSProperties = {
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, fontWeight: 700, color: 'white',
        flexShrink: 0, overflow: 'hidden',
    };
    if (url) return <div style={style}><img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
    return <div style={style}>{initials}</div>;
}

function getBadge(i: number, driver: Driver): string {
    if (i === 0) return '🏆 Top Driver';
    if (i === 1) return '🥈 Vice Driver';
    if (i === 2) return '🥉 Bronzo';
    if (driver.rides_count >= 30) return '🚗 Veterano';
    if (driver.rating_avg >= 4.5) return '⭐ Rising Star';
    return '🎯 Affidabile';
}

function StarsBar({ rating }: { rating: number }) {
    const pct = (rating / 5) * 100;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', minWidth: 28 }}>
                {rating > 0 ? rating.toFixed(1) : '–'}
            </span>
        </div>
    );
}

export default function LeaderboardPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard').then(r => r.json()).then(d => {
            setDrivers(d.drivers || []);
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <AppShell>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: '70%' }} /></div>
            {[1, 2, 3].map(i => <div key={i} className="card mb-12"><div className="skeleton" style={{ height: 80 }} /></div>)}
        </AppShell>
    );

    const top3 = drivers.slice(0, 3);
    const rest = drivers.slice(3);

    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
    const podiumHeights = [80, 110, 60];
    const podiumColors = ['#9ca3af', '#f59e0b', '#cd7c4c'];
    const podiumEmojis = ['🥈', '🏆', '🥉'];

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Classifica 🏆</h1>
                <p className="page-subtitle">I migliori autisti del clan</p>
            </div>

            {/* Podium */}
            {top3.length >= 3 && (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    {podiumOrder.map((driver, idx) => {
                        const realRank = drivers.indexOf(driver);
                        return (
                            <div key={driver.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                                <Avatar name={driver.name} url={driver.avatar_url} size={idx === 1 ? 64 : 48} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                                    {driver.name.split(' ')[0]}
                                </span>
                                <div style={{
                                    width: '100%', height: podiumHeights[idx],
                                    background: podiumColors[idx],
                                    borderRadius: '8px 8px 0 0',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'white',
                                }}>
                                    <div style={{ fontSize: '1.4rem' }}>{podiumEmojis[idx]}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                        {driver.rating_avg > 0 ? driver.rating_avg.toFixed(1) : '–'}★
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Full list */}
            <div className="grid-list">
                {drivers.map((driver, i) => (
                    <div key={driver.user_id} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: i < 3 ? ['rgba(245,158,11,0.2)', 'rgba(156,163,175,0.2)', 'rgba(205,124,76,0.2)'][i] : 'var(--bg3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: i < 3 ? '1.1rem' : '0.9rem',
                                color: i < 3 ? [podiumColors[1], podiumColors[0], podiumColors[2]][i] : 'var(--text3)',
                                flexShrink: 0,
                            }}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </div>
                            <Avatar name={driver.name} url={driver.avatar_url} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700 }}>{driver.name}</span>
                                    <span style={{
                                        fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
                                        background: 'rgba(124,92,252,0.15)', color: '#a78bfa', fontWeight: 600,
                                    }}>
                                        {getBadge(i, driver)}
                                    </span>
                                </div>
                                <StarsBar rating={driver.rating_avg} />
                                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 4 }}>
                                    {driver.rides_count} corse completate
                                    {driver.car_model && ` · 🚗 ${driver.car_model}`}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="footer mt-16">Made for friends 🚗💨</footer>
        </AppShell>
    );
}
