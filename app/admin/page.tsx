'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    nickname: string | null;
    created_at: string;
    name: string | null;
    car_model: string | null;
    rating_avg: number | null;
    rides_count: number | null;
}

interface AdminRide {
    id: string;
    customer_nickname: string;
    customer_email: string;
    driver_name: string;
    driver_car: string;
    from_loc: string;
    to_loc: string;
    ride_datetime: string;
    passengers: number;
    status: string;
    created_at: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [tab, setTab] = useState<'users' | 'rides'>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [rides, setRides] = useState<AdminRide[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingRide, setEditingRide] = useState<AdminRide | null>(null);
    const [savingRide, setSavingRide] = useState(false);

    const fetchUsers = async () => {
        try {
            const r = await fetch('/api/admin/users');
            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    router.push('/admin/login');
                    return;
                }
                throw new Error('Errore di rete');
            }
            const data = await r.json();
            setUsers(data.users || []);
        } catch { }
    };

    const fetchRides = async () => {
        try {
            const r = await fetch('/api/admin/rides');
            if (r.ok) {
                const data = await r.json();
                setRides(data.rides || []);
            }
        } catch { }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchRides()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const deleteUser = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare l'utente "${name}" e tutti i suoi dati (corse, recensioni etc.)?`)) return;

        try {
            const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (r.ok) {
                setUsers(u => u.filter(user => user.id !== id));
            } else {
                alert('Errore eliminazione utente');
            }
        } catch (e) {
            alert('Errore di rete');
        }
    };

    const deleteRide = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare definitivamente questa corsa?')) return;
        try {
            const r = await fetch(`/api/admin/rides/${id}`, { method: 'DELETE' });
            if (r.ok) setRides(arr => arr.filter(ride => ride.id !== id));
            else alert('Errore eliminazione corsa');
        } catch { alert('Errore di rete'); }
    };

    const saveRideEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRide) return;
        setSavingRide(true);
        try {
            const payload = {
                status: editingRide.status,
                from_loc: editingRide.from_loc,
                to_loc: editingRide.to_loc,
                // Make sure to parse it as an ISO string
                ride_datetime: new Date(editingRide.ride_datetime).toISOString()
            };
            const r = await fetch(`/api/admin/rides/${editingRide.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (r.ok) {
                await fetchRides();
                setEditingRide(null);
            } else {
                alert('Errore salvataggio corsa');
            }
        } catch { alert('Errore di rete'); }
        setSavingRide(false);
    };

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    if (loading) return (
        <AppShell>
            <div className="page-header"><div className="skeleton" style={{ height: 32, width: '60%' }} /></div>
            <div className="skeleton" style={{ height: 80 }} />
        </AppShell>
    );

    return (
        <AppShell>
            <div className="page-header d-flex jc-between ai-center">
                <div>
                    <h1 className="page-title">Pannello Admin 🛡️</h1>
                    <p className="page-subtitle">Gestione utenti e autisti</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Esci</button>
            </div>

            <div className="tabs mb-16" style={{ display: 'flex', gap: 8 }}>
                <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')} style={{ flex: 1 }}>Utenti</button>
                <button className={`btn ${tab === 'rides' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('rides')} style={{ flex: 1 }}>Corse</button>
            </div>

            {tab === 'users' && (
                <div className="card">
                    <div className="section-header mb-16">
                        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Utenti registrati ({users.length})</h2>
                    </div>

                    {users.length === 0 ? (
                        <div className="empty" style={{ padding: '24px 0' }}>Nessun utente trovato</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {users.map(u => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, background: 'var(--bg3)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="fw-bold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {u.role === 'driver' ? '🚗' : '👤'}
                                            {u.role === 'driver' ? u.name : (u.nickname || u.email)}
                                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: u.role === 'driver' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(124, 92, 252, 0.2)', color: u.role === 'driver' ? '#f59e0b' : '#a78bfa', textTransform: 'uppercase' }}>
                                                {u.role}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                                            {u.email}
                                            {u.role === 'driver' && (
                                                <span style={{ marginLeft: 8 }}>• {u.rides_count} corse • ⭐ {u.rating_avg}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => deleteUser(u.id, u.email)}>
                                        Elimina
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'rides' && (
                <div className="card">
                    <div className="section-header mb-16">
                        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Tutte le Corse ({rides.length})</h2>
                    </div>

                    {rides.length === 0 ? (
                        <div className="empty" style={{ padding: '24px 0' }}>Nessuna corsa trovata</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {rides.map(r => (
                                <div key={r.id} style={{ padding: 12, borderRadius: 8, background: 'var(--bg3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div className="fw-bold text-sm">Pass: {r.customer_nickname || r.customer_email}</div>
                                            <div className="text-xs text-muted">Autista: {r.driver_name}</div>
                                        </div>
                                        <span className={`badge badge-${r.status}`} style={{ fontSize: '0.7rem' }}>{r.status}</span>
                                    </div>
                                    <div className="text-sm mb-12">
                                        <div>📍 {r.from_loc} → {r.to_loc}</div>
                                        <div>📅 {new Date(r.ride_datetime).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })} • 👥 {r.passengers}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '6px' }} onClick={() => setEditingRide({
                                            ...r,
                                            ride_datetime: new Date(r.ride_datetime).toISOString().slice(0, 16)
                                        })}>
                                            ✏️ Modifica
                                        </button>
                                        <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '6px' }} onClick={() => deleteRide(r.id)}>
                                            🗑️ Cancella
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {editingRide && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 className="mb-16">Modifica Corsa</h3>
                        <form onSubmit={saveRideEdit}>
                            <div className="form-group">
                                <label className="form-label">Stato</label>
                                <select className="form-input" value={editingRide.status} onChange={e => setEditingRide(r => ({ ...r!, status: e.target.value }))}>
                                    <option value="pending">In attesa (pending)</option>
                                    <option value="accepted">Accettata (accepted)</option>
                                    <option value="refused">Rifiutata (refused)</option>
                                    <option value="completed">Completata (completed)</option>
                                    <option value="cancelled">Annullata (cancelled)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data e ora</label>
                                <input type="datetime-local" className="form-input" value={editingRide.ride_datetime} onChange={e => setEditingRide(r => ({ ...r!, ride_datetime: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Partenza</label>
                                <input type="text" className="form-input" value={editingRide.from_loc} onChange={e => setEditingRide(r => ({ ...r!, from_loc: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Destinazione</label>
                                <input type="text" className="form-input" value={editingRide.to_loc} onChange={e => setEditingRide(r => ({ ...r!, to_loc: e.target.value }))} required />
                            </div>
                            <div className="d-flex gap-8 mt-16">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingRide}>
                                    {savingRide ? 'Salvo...' : 'Salva'}
                                </button>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingRide(null)}>
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
