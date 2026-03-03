'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const r = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await r.json();

            if (!r.ok) {
                throw new Error(data.error || 'Errore');
            }

            // Redirect to admin dashboard
            router.push('/admin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell>
            <div className="auth-page">
                <div className="auth-box" style={{ maxWidth: 400, margin: '0 auto', marginTop: '10vh' }}>
                    <div className="auth-logo">
                        <span className="auth-logo-emoji">🛡️</span>
                    </div>
                    <h1 className="auth-title">Pannello Segreto</h1>
                    <p className="auth-sub">Accesso riservato agli admin di ClanDestino</p>

                    {error && <div className="error-box">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Password Admin</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Inserisci la password maestro"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                            {loading ? 'Verifica...' : 'Accedi 🔓'}
                        </button>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}
