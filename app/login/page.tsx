'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (type: 'customer' | 'driver') => {
        if (type === 'customer') { setEmail('cliente@demo.it'); setPassword('demo1234'); }
        else { setEmail('marco@demo.it'); setPassword('demo1234'); }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="auth-logo">
                    <span className="auth-logo-emoji">🚗</span>
                    <h1 className="auth-title">ClanDestino</h1>
                </div>
                <p className="auth-sub">Accedi al tuo account</p>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email" className="form-input" placeholder="la@tua.email"
                            value={email} onChange={e => setEmail(e.target.value)} required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password" className="form-input" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} required
                        />
                    </div>
                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Accesso...' : 'Accedi 🚀'}
                    </button>
                </form>

                <hr className="divider" />

                <div className="mb-12">
                    <p className="text-sm text-muted mb-8" style={{ textAlign: 'center' }}>🎮 Account demo:</p>
                    <div className="d-flex gap-8">
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('customer')}>
                            👤 Cliente
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('driver')}>
                            🚗 Autista
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text2)' }}>
                    Non hai un account?{' '}
                    <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Registrati</Link>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
                        Password dimenticata?
                    </Link>
                </div>
            </div>
        </div>
    );
}
