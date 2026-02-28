'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import { addToast } from '@/components/Toast';

const TAGS = ['Guida smooth 🛣️', 'DJ top 🎵', 'Puntuale ⏰', 'Troppo F1 🏎️', 'Super gentile 😊', 'Auto pulita ✨'];

export default function ReviewPage({ params }: { params: Promise<{ rideId: string }> }) {
    const { rideId } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [stars, setStars] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleTag = (tag: string) =>
        setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (stars === 0) { setError('Scegli almeno una stella ⭐'); return; }
        setError(''); setLoading(true);
        try {
            const r = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ride_id: rideId, stars, review_text: text, tags: selectedTags }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Errore recensione');
            addToast('⭐ Recensione inviata, grazie!', 'success');
            router.push('/my-rides');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Lascia una recensione ⭐</h1>
                <p className="page-subtitle">Come è andata la corsa?</p>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card mb-16">
                    <div className="form-label mb-12">Le tue stelle</div>
                    <div className="stars" style={{ justifyContent: 'center', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span
                                key={s}
                                className={`star ${s <= (hover || stars) ? 'active' : ''}`}
                                style={{ fontSize: '2.5rem' }}
                                onMouseEnter={() => setHover(s)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setStars(s)}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    {stars > 0 && (
                        <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 600, color: 'var(--accent)' }}>
                            {['', 'Pessima 😬', 'Così così 😕', 'Buona 👍', 'Ottima 😊', 'Perfetta 🤩'][stars]}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Tag rapidi</label>
                    <div className="tags">
                        {TAGS.map(tag => (
                            <button
                                type="button"
                                key={tag}
                                className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Commento (facoltativo)</label>
                    <textarea
                        className="form-input"
                        placeholder="Scrivi qualcosa... max 300 caratteri"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        maxLength={300}
                        rows={4}
                    />
                    <span className="text-xs text-muted" style={{ alignSelf: 'flex-end' }}>{text.length}/300</span>
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading || stars === 0}
                    style={{ fontSize: '1rem', padding: '14px' }}>
                    {loading ? 'Invio...' : '⭐ Invia recensione'}
                </button>
            </form>
        </AppShell>
    );
}
