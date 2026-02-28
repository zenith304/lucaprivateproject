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

export default function AdminDashboardPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

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
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchUsers();
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
        </AppShell>
    );
}
