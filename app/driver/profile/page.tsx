'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import { addToast } from '@/components/Toast';

interface Review {
    id: string;
    stars: number;
    review_text: string;
    tags: string;
    customer_name: string;
    created_at: string;
}

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

function StarDisplay({ n }: { n: number }) {
    return (
        <span style={{ color: '#f59e0b', letterSpacing: 2 }}>
            {'★'.repeat(n)}{'☆'.repeat(5 - n)}
        </span>
    );
}

function Avatar({ name, url }: { name: string; url?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (url) return <div className="avatar-lg"><img src={url} alt={name} /></div>;
    return <div className="avatar-lg">{initials}</div>;
}

function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DriverProfilePage() {
    const { user } = useAuth();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', avatar_url: '', car_model: '', seats: 4 });
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        const r = await fetch('/api/driver/profile');
        const data = await r.json();
        if (data.driver) {
            setDriver(data.driver);
            setForm({ name: data.driver.name, avatar_url: data.driver.avatar_url || '', car_model: data.driver.car_model || '', seats: data.driver.seats });
        }
        setReviews(data.reviews || []);
    };

    useEffect(() => { fetchProfile(); }, []);

    const toggleAvailability = async () => {
        if (!driver) return;
        const r = await fetch('/api/driver/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: !driver.available }),
        });
        const data = await r.json();
        if (r.ok) {
            setDriver(data.driver);
            addToast(data.driver.available ? '✅ Ora sei disponibile!' : '⏸️ Non disponibile', 'success');
        }
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const r = await fetch('/api/driver/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await r.json();
        if (r.ok) {
            setDriver(data.driver);
            setEditing(false);
            addToast('✅ Profilo aggiornato!', 'success');
        } else {
            addToast(data.error || 'Errore', 'danger');
        }
        setSaving(false);
    };

    if (!driver) return (
        <AppShell>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: '60%' }} /></div>
            <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        </AppShell>
    );

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Il mio profilo 👤</h1>
            </div>

            {/* Profile header */}
            <div className="profile-header mb-16">
                <Avatar name={driver.name} url={driver.avatar_url} />
                <div style={{ flex: 1 }}>
                    <div className="fw-bold" style={{ fontSize: '1.15rem' }}>{driver.name}</div>
                    {driver.car_model && <div className="text-sm text-muted">🚗 {driver.car_model}</div>}
                    <div className="text-sm text-muted">👥 {driver.seats} posti</div>
                    <div className="d-flex ai-center gap-8 mt-8" style={{ gap: 8 }}>
                        <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
                        <span className="fw-bold">{driver.rating_avg > 0 ? driver.rating_avg.toFixed(1) : '–'}</span>
                        <span className="text-sm text-muted">({driver.rides_count} corse)</span>
                    </div>
                </div>
            </div>

            {/* Availability toggle */}
            <div className="card card-sm mb-16">
                <div className="d-flex ai-center jc-between">
                    <div>
                        <div className="fw-bold">Disponibilità</div>
                        <div className="text-sm text-muted">
                            {driver.available ? '✅ Sei disponibile a ricevere corse' : '⏸️ Non ricevi prenotazioni'}
                        </div>
                    </div>
                    <div className={`toggle ${driver.available ? 'on' : ''}`} onClick={toggleAvailability} />
                </div>
            </div>

            {/* Edit profile */}
            {editing ? (
                <div className="card mb-16">
                    <div className="section-header mb-12">
                        <h2 className="section-title">Modifica profilo ✏️</h2>
                    </div>
                    <form onSubmit={saveProfile}>
                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input type="text" className="form-input" value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Modello auto</label>
                            <input type="text" className="form-input" value={form.car_model}
                                onChange={e => setForm(f => ({ ...f, car_model: e.target.value }))} placeholder="es. Fiat 500" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Posti in macchina</label>
                            <div className="stepper">
                                <button type="button" className="stepper-btn"
                                    onClick={() => setForm(f => ({ ...f, seats: Math.max(1, f.seats - 1) }))}>−</button>
                                <span className="stepper-val">{form.seats}</span>
                                <button type="button" className="stepper-btn"
                                    onClick={() => setForm(f => ({ ...f, seats: Math.min(8, f.seats + 1) }))}>+</button>
                            </div>
                        </div>
                        <div className="d-flex gap-8">
                            <button className="btn btn-primary" type="submit" disabled={saving}>
                                {saving ? 'Salvo...' : '💾 Salva'}
                            </button>
                            <button className="btn btn-outline" type="button" onClick={() => setEditing(false)}>Annulla</button>
                        </div>
                    </form>
                </div>
            ) : (
                <button className="btn btn-outline btn-full mb-16" onClick={() => setEditing(true)}>
                    ✏️ Modifica profilo
                </button>
            )}

            {/* Reviews */}
            <div className="section-header mb-12">
                <h2 className="section-title">⭐ Recensioni ricevute</h2>
                <span className="text-sm text-muted">{reviews.length}</span>
            </div>

            {reviews.length === 0 ? (
                <div className="empty" style={{ padding: '32px 0' }}>
                    <div className="empty-icon">⭐</div>
                    <div className="empty-title">Nessuna recensione ancora</div>
                </div>
            ) : (
                <div className="grid-list">
                    {reviews.map(r => (
                        <div key={r.id} className="card card-sm">
                            <div className="d-flex ai-center jc-between mb-8">
                                <span className="fw-bold text-sm">{r.customer_name}</span>
                                <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                            </div>
                            <StarDisplay n={r.stars} />
                            {r.review_text && <p className="text-sm" style={{ marginTop: 6, color: 'var(--text2)' }}>{r.review_text}</p>}
                            {r.tags && JSON.parse(r.tags).length > 0 && (
                                <div className="d-flex gap-8 mt-8" style={{ flexWrap: 'wrap', gap: 6 }}>
                                    {JSON.parse(r.tags).map((tag: string) => (
                                        <span key={tag} className="tag selected" style={{ fontSize: '0.75rem', padding: '3px 9px', cursor: 'default' }}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <footer className="footer mt-16">Made for friends 🚗💨</footer>
        </AppShell>
    );
}
