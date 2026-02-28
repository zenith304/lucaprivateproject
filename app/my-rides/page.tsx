'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { addToast } from '@/components/Toast';

interface Ride {
    id: string;
    driver_name: string;
    driver_avatar: string;
    car_model: string;
    from_loc: string;
    to_loc: string;
    ride_datetime: string;
    passengers: number;
    notes: string;
    status: string;
    created_at: string;
    customer_nickname?: string;
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

export default function MyRidesPage() {
    const { user } = useAuth();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRides = () => {
        fetch('/api/rides').then(r => r.json()).then(d => {
            setRides(d.rides || []);
            setLoading(false);
        });
    };

    useEffect(() => { fetchRides(); }, []);

    const cancel = async (id: string) => {
        const r = await fetch(`/api/rides/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
        });
        if (r.ok) {
            addToast('Corsa annullata', 'warning');
            fetchRides();
        }
    };

    if (loading) return (
        <AppShell>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: '70%' }} /></div>
            {[1, 2, 3].map(i => <div key={i} className="card mb-12"><div className="skeleton" style={{ height: 90 }} /></div>)}
        </AppShell>
    );

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Le mie corse 📋</h1>
            </div>

            {rides.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🚗</div>
                    <div className="empty-title">Nessuna corsa ancora!</div>
                    <p className="text-muted" style={{ marginBottom: 16 }}>Prenota la tua prima corsa</p>
                    <Link href="/booking" className="btn btn-primary">Prenota ora 🚀</Link>
                </div>
            ) : (
                <div className="grid-list">
                    {rides.map(ride => {
                        const st = STATUS_MAP[ride.status] || STATUS_MAP.pending;
                        const hasReview = ride.status === 'completed';
                        return (
                            <div key={ride.id} className="card">
                                <div className="d-flex ai-center jc-between mb-8">
                                    <span className="fw-bold">{ride.driver_name}</span>
                                    <span className={`badge ${st.cls}`}>{st.emoji} {st.label}</span>
                                </div>
                                <div className="ride-card-meta mb-12">
                                    <div className="ride-meta-row">📍 <span>{ride.from_loc} → {ride.to_loc}</span></div>
                                    <div className="ride-meta-row">📅 <span>{formatDate(ride.ride_datetime)}</span></div>
                                    <div className="ride-meta-row">👥 <span>{ride.passengers} {ride.passengers === 1 ? 'passeggero' : 'passeggeri'}</span></div>
                                    {ride.notes && <div className="ride-meta-row">📝 <span style={{ color: 'var(--text2)' }}>{ride.notes}</span></div>}
                                </div>
                                <div className="d-flex gap-8" style={{ flexWrap: 'wrap' }}>
                                    {ride.status === 'pending' && (
                                        <button className="btn btn-danger btn-sm" onClick={() => cancel(ride.id)}>
                                            ✕ Annulla
                                        </button>
                                    )}
                                    {hasReview && (
                                        <Link href={`/review/${ride.id}`} className="btn btn-primary btn-sm">
                                            ⭐ Lascia recensione
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <footer className="footer mt-16">Made for friends 🚗💨</footer>
        </AppShell>
    );
}
