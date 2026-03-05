'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';

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

export default function DriverReviewsPage() {
    const params = useParams();
    const router = useRouter();
    const [driver, setDriver] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params || !params.id) return;
        fetch(`/api/reviews?driver_id=${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.driver) {
                    setDriver(data.driver);
                    setReviews(data.reviews || []);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [params.id]);

    if (loading) return (
        <AppShell>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: '70%' }} /></div>
            {[1, 2, 3].map(i => <div key={i} className="card mb-12"><div className="skeleton" style={{ height: 80 }} /></div>)}
        </AppShell>
    );

    if (!driver) return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Errore</h1>
                <p className="page-subtitle">Autista non trovato</p>
                <div style={{ marginTop: 24 }}>
                    <button className="btn btn-secondary w-full" onClick={() => router.back()}>
                        Torna Indietro
                    </button>
                </div>
            </div>
        </AppShell>
    );

    return (
        <AppShell>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'var(--bg2)', border: 'none', width: 40, height: 40,
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text1)', cursor: 'pointer'
                    }}
                >
                    ←
                </button>
                <h1 className="page-title" style={{ margin: 0 }}>Recensioni 🌟</h1>
            </div>

            <div className="card" style={{ marginBottom: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Avatar name={driver.name} url={driver.avatar_url} size={80} />
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{driver.name}</h2>
                    {driver.car_model && <p style={{ color: 'var(--text2)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>🚗 {driver.car_model}</p>}
                </div>
                <div style={{ width: '100%', maxWidth: 200 }}>
                    <StarsBar rating={driver.rating_avg} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 600 }}>
                    {driver.rides_count} {driver.rides_count === 1 ? 'corsa completata' : 'corse completate'}
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>
                Cosa dicono di {driver.name.split(' ')[0]}
            </h3>

            {reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text2)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>😶</div>
                    <div style={{ fontWeight: 600 }}>Nessuna recensione ancora</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                        Questo autista non ha ancora ricevuto recensioni.
                    </div>
                </div>
            ) : (
                <div className="grid-list">
                    {reviews.map(review => (
                        <div key={review.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar name={review.customer_name} size={36} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{review.customer_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                                            {new Date(review.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 2, color: '#f59e0b', fontSize: '1.1rem' }}>
                                    {Array(5).fill(0).map((_, i) => (
                                        <span key={i} style={{ opacity: i < review.stars ? 1 : 0.2 }}>★</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--bg2)', padding: '10px 12px', borderRadius: 8,
                                fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12,
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                🗺️ {review.from_loc} <span style={{ color: 'var(--text3)' }}>→</span> {review.to_loc}
                            </div>

                            {review.review_text && (
                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    "{review.review_text}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
