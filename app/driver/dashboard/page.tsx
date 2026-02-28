'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import { addToast } from '@/components/Toast';

interface Ride {
    id: string;
    customer_nickname: string;
    customer_email: string;
    from_loc: string;
    to_loc: string;
    ride_datetime: string;
    passengers: number;
    notes: string;
    status: string;
    created_at: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; emoji: string }> = {
    pending: { label: 'In attesa', cls: 'badge-pending', emoji: '⏳' },
    accepted: { label: 'Accettata', cls: 'badge-accepted', emoji: '✅' },
    refused: { label: 'Rifiutata', cls: 'badge-refused', emoji: '❌' },
    completed: { label: 'Completata', cls: 'badge-completed', emoji: '🏁' },
    cancelled: { label: 'Annullata', cls: 'badge-cancelled', emoji: '🚫' },
};

function formatDate(dt: string) {
    return new Date(dt).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DriverDashboard() {
    const { user } = useAuth();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRides = async () => {
        const r = await fetch('/api/rides');
        const data = await r.json();
        setRides(data.rides || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRides();
        const interval = setInterval(fetchRides, 8000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (id: string, status: string) => {
        const r = await fetch(`/api/rides/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const data = await r.json();
        if (r.ok) {
            const labels: Record<string, string> = { accepted: 'Corsa accettata ✅', refused: 'Corsa rifiutata', completed: 'Corsa completata 🏁' };
            addToast(labels[status] || 'Aggiornato', status === 'accepted' ? 'success' : status === 'completed' ? 'success' : 'warning');
            fetchRides();
        } else {
            addToast(data.error || 'Errore', 'danger');
        }
    };

    if (!user || user.role !== 'driver') return (
        <AppShell>
            <div className="empty"><div className="empty-icon">🔒</div><div className="empty-title">Accesso autisti</div></div>
        </AppShell>
    );

    const pending = rides.filter(r => r.status === 'pending');
    const active = rides.filter(r => r.status === 'accepted');
    const past = rides.filter(r => ['completed', 'refused', 'cancelled'].includes(r.status));

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Dashboard 🧑‍✈️</h1>
                <p className="page-subtitle">Benvenuto, {user.nickname || 'autista'}!</p>
            </div>

            {/* Stats */}
            <div className="d-flex gap-8 mb-16" style={{ gap: 10 }}>
                {[
                    { label: 'In attesa', value: pending.length, color: 'var(--warning)' },
                    { label: 'Attive', value: active.length, color: 'var(--success)' },
                    { label: 'Completate', value: past.filter(r => r.status === 'completed').length, color: 'var(--accent)' },
                ].map(stat => (
                    <div key={stat.label} className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div className="text-xs text-muted">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Pending */}
            {pending.length > 0 && (
                <>
                    <div className="section-header">
                        <h2 className="section-title">⏳ Nuove richieste</h2>
                        <span className={`badge badge-pending`}>{pending.length}</span>
                    </div>
                    <div className="grid-list mb-16">
                        {pending.map(ride => (
                            <div key={ride.id} className="card" style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
                                <div className="d-flex ai-center jc-between mb-8">
                                    <span className="fw-bold">{ride.customer_nickname || ride.customer_email}</span>
                                    <span className={`badge badge-pending`}>⏳ In attesa</span>
                                </div>
                                <div className="ride-card-meta mb-12">
                                    <div className="ride-meta-row">📍 <span>{ride.from_loc} → {ride.to_loc}</span></div>
                                    <div className="ride-meta-row">📅 <span>{formatDate(ride.ride_datetime)}</span></div>
                                    <div className="ride-meta-row">👥 <span>{ride.passengers} passeggeri</span></div>
                                    {ride.notes && <div className="ride-meta-row">📝 <span style={{ color: 'var(--text2)' }}>{ride.notes}</span></div>}
                                </div>
                                <div className="d-flex gap-8">
                                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(ride.id, 'accepted')}>✅ Accetta</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(ride.id, 'refused')}>✕ Rifiuta</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Active */}
            {active.length > 0 && (
                <>
                    <div className="section-header">
                        <h2 className="section-title">🚗 Corse attive</h2>
                    </div>
                    <div className="grid-list mb-16">
                        {active.map(ride => (
                            <div key={ride.id} className="card" style={{ borderColor: 'rgba(34,211,160,0.4)' }}>
                                <div className="d-flex ai-center jc-between mb-8">
                                    <span className="fw-bold">{ride.customer_nickname || ride.customer_email}</span>
                                    <span className="badge badge-accepted">✅ Accettata</span>
                                </div>
                                <div className="ride-card-meta mb-12">
                                    <div className="ride-meta-row">📍 <span>{ride.from_loc} → {ride.to_loc}</span></div>
                                    <div className="ride-meta-row">📅 <span>{formatDate(ride.ride_datetime)}</span></div>
                                    <div className="ride-meta-row">👥 <span>{ride.passengers} passeggeri</span></div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => updateStatus(ride.id, 'completed')}>
                                    🏁 Segna completata
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Past */}
            {past.length > 0 && (
                <>
                    <div className="section-header mb-12">
                        <h2 className="section-title">📜 Storico</h2>
                    </div>
                    <div className="grid-list">
                        {past.slice(0, 5).map(ride => {
                            const st = STATUS_MAP[ride.status];
                            return (
                                <div key={ride.id} className="card card-sm" style={{ opacity: 0.7 }}>
                                    <div className="d-flex ai-center jc-between">
                                        <span className="text-sm fw-bold">{ride.customer_nickname || ride.customer_email}</span>
                                        <span className={`badge ${st?.cls}`}>{st?.emoji} {st?.label}</span>
                                    </div>
                                    <div className="text-xs text-muted mt-8">{ride.from_loc} → {ride.to_loc} · {formatDate(ride.ride_datetime)}</div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {rides.length === 0 && !loading && (
                <div className="empty">
                    <div className="empty-icon">🎉</div>
                    <div className="empty-title">Nessuna corsa ancora!</div>
                    <p className="text-muted">Quando i clienti prenotano, le vedrai qui.</p>
                </div>
            )}

            <footer className="footer mt-16">Made for friends 🚗💨</footer>
        </AppShell>
    );
}
