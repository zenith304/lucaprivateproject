'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import { addToast } from '@/components/Toast';

interface Driver {
    user_id: string;
    name: string;
    avatar_url: string;
    car_model: string;
    seats: number;
    available: number;
    rating_avg: number;
}

function Avatar({ name, url }: { name: string; url?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (url) return <div className="avatar"><img src={url} alt={name} /></div>;
    return <div className="avatar">{initials}</div>;
}

function BookingForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselected = searchParams.get('driver');

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [form, setForm] = useState({
        driver_user_id: preselected || '',
        from_loc: '', to_loc: '', ride_datetime: '', passengers: 1, notes: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [alternatives, setAlternatives] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/drivers').then(r => r.json()).then(d => {
            setDrivers(d.drivers || []);
            if (!preselected && d.drivers?.length > 0) {
                setForm(f => ({ ...f, driver_user_id: d.drivers[0].user_id }));
            }
        });
    }, []);

    // Min datetime (now + 5min)
    const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

    const selectedDriver = drivers.find(d => d.user_id === form.driver_user_id);

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAlternatives([]);
        setLoading(true);
        try {
            const r = await fetch('/api/rides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await r.json();
            if (!r.ok) {
                if (data.conflict && data.alternatives) {
                    setAlternatives(data.alternatives);
                }
                throw new Error(data.error || 'Errore prenotazione');
            }
            addToast('✅ Prenotazione inviata!', 'success');
            router.push('/my-rides');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'customer') {
        return (
            <AppShell>
                <div className="empty">
                    <div className="empty-icon">🔒</div>
                    <div className="empty-title">Solo i clienti possono prenotare</div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Prenota una corsa 🚀</h1>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                    {alternatives.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <strong>Autisti alternativi disponibili:</strong>
                            {alternatives.map((a: any) => (
                                <div key={a.user_id} style={{ marginTop: 6 }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => { set('driver_user_id', a.user_id); setError(''); setAlternatives([]); }}
                                    >
                                        {a.name} ★{a.rating_avg} ({a.seats} posti)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Scegli autista</label>
                    <select className="form-input" value={form.driver_user_id}
                        onChange={e => set('driver_user_id', e.target.value)} required>
                        {drivers.map(d => (
                            <option key={d.user_id} value={d.user_id}>
                                {d.name} — {d.car_model || 'Auto'} ({d.seats}p) ★{d.rating_avg || '–'} {d.available ? '✓' : '✗'}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedDriver && (
                    <div className="card card-sm mb-16 d-flex ai-center gap-8">
                        <Avatar name={selectedDriver.name} url={selectedDriver.avatar_url} />
                        <div>
                            <div className="fw-bold">{selectedDriver.name}</div>
                            <div className="text-sm text-muted">{selectedDriver.car_model} · {selectedDriver.seats} posti · ★{selectedDriver.rating_avg || '–'}</div>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Partenza 📍</label>
                    <input type="text" className="form-input" placeholder="Da dove parti?"
                        value={form.from_loc} onChange={e => set('from_loc', e.target.value)} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Destinazione 🏁</label>
                    <input type="text" className="form-input" placeholder="Dove vuoi andare?"
                        value={form.to_loc} onChange={e => set('to_loc', e.target.value)} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Data e ora 📅</label>
                    <input type="datetime-local" className="form-input"
                        value={form.ride_datetime} onChange={e => set('ride_datetime', e.target.value)}
                        min={minDatetime} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Passeggeri 👥</label>
                    <div className="stepper">
                        <button type="button" className="stepper-btn"
                            onClick={() => set('passengers', Math.max(1, form.passengers - 1))}>−</button>
                        <span className="stepper-val">{form.passengers}</span>
                        <button type="button" className="stepper-btn"
                            onClick={() => set('passengers', Math.min(selectedDriver?.seats || 8, form.passengers + 1))}>+</button>
                    </div>
                    {selectedDriver && (
                        <span className="text-xs text-muted mt-8">Max {selectedDriver.seats} per questo autista</span>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Note (facoltativo) 📝</label>
                    <textarea className="form-input" placeholder="Qualcosa da sapere? es. 'Ho un bagaglio grande'..."
                        value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading}
                    style={{ fontSize: '1rem', padding: '14px' }}>
                    {loading ? 'Invio...' : '✅ Conferma prenotazione'}
                </button>
            </form>

            <footer className="footer">Made for friends 🚗💨</footer>
        </AppShell>
    );
}

export default function BookingPage() {
    return (
        <Suspense>
            <BookingForm />
        </Suspense>
    );
}
