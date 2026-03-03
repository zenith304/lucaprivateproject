'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function RegisterPage() {
    const { refresh } = useAuth();
    const router = useRouter();
    const [role, setRole] = useState<'customer' | 'driver'>('customer');
    const [form, setForm] = useState({
        email: '', password: '', nickname: '', name: '',
        car_model: '', seats: 4, avatar_url: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: any = { ...form, role };
            const r = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Errore registrazione');
            await refresh();
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="auth-logo">
                    <span className="auth-logo-emoji">🎉</span>
                </div>
                <h1 className="auth-title">Crea account</h1>
                <p className="auth-sub">Scegli il tuo ruolo</p>

                <div className="role-selector">
                    <button
                        type="button"
                        className={`role-btn ${role === 'customer' ? 'selected' : ''}`}
                        onClick={() => setRole('customer')}
                    >
                        <span>👤</span> Sono un cliente
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${role === 'driver' ? 'selected' : ''}`}
                        onClick={() => setRole('driver')}
                    >
                        <span>🚗</span> Sono un autista
                    </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="la@tua.email"
                            value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="Min 6 caratteri"
                            value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                    </div>

                    {role === 'customer' ? (
                        <div className="form-group">
                            <label className="form-label">Nickname (facoltativo)</label>
                            <input type="text" className="form-input" placeholder="Come ti chiamano gli amici?"
                                value={form.nickname} onChange={e => set('nickname', e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Nome / Nickname</label>
                                <input type="text" className="form-input" placeholder="Come ti chiami?"
                                    value={form.name} onChange={e => set('name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modello auto (facoltativo)</label>
                                <input type="text" className="form-input" placeholder="es. Fiat 500"
                                    value={form.car_model} onChange={e => set('car_model', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Posti in macchina (obbligatorio)</label>
                                <div className="stepper">
                                    <button type="button" className="stepper-btn"
                                        onClick={() => set('seats', Math.max(1, form.seats - 1))}>−</button>
                                    <span className="stepper-val">{form.seats}</span>
                                    <button type="button" className="stepper-btn"
                                        onClick={() => set('seats', Math.min(8, form.seats + 1))}>+</button>
                                </div>
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Registrazione...' : 'Crea account 🎉'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9rem', color: 'var(--text2)' }}>
                    Hai già un account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Accedi</Link>
                </div>
            </div>
        </div>
    );
}
