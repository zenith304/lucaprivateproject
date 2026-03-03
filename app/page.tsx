'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

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

function Avatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'avatar-lg' : 'avatar';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (url) return <div className={cls}><img src={url} alt={name} /></div>;
  return <div className={cls}>{initials}</div>;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="d-flex ai-center gap-8" style={{ gap: 4 }}>
      <span style={{ color: '#f59e0b' }}>★</span>
      <span className="fw-bold">{rating > 0 ? rating.toFixed(1) : '–'}</span>
    </span>
  );
}

function DriverCard({ driver, onBook }: { driver: Driver; onBook: (d: Driver) => void }) {
  return (
    <div className="card" onClick={() => onBook(driver)} style={{ cursor: 'pointer' }}>
      <div className="driver-card">
        <Avatar name={driver.name} url={driver.avatar_url} />
        <div style={{ flex: 1 }}>
          <div className="d-flex ai-center jc-between mb-8">
            <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{driver.name}</span>
            <span className={`badge badge-${driver.available ? 'available' : 'unavailable'}`}>
              {driver.available ? '✓ Disponibile' : '✗ Occupato'}
            </span>
          </div>
          <div className="d-flex ai-center gap-8" style={{ color: 'var(--text2)', fontSize: '0.88rem', flexWrap: 'wrap', gap: '10px' }}>
            {driver.car_model && <span>🚗 {driver.car_model}</span>}
            <span>👥 {driver.seats} posti</span>
            <StarDisplay rating={driver.rating_avg} />
            <span>{driver.rides_count} corse</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(d => { setDrivers(d.drivers || []); })
      .catch(() => { })
      .finally(() => setFetching(false));
  }, []);

  const handleBook = (driver: Driver) => {
    if (!user) { router.push('/login'); return; }
    if (user.role === 'driver') return;
    router.push(`/booking?driver=${driver.user_id}`);
  };

  if (loading || fetching) {
    return (
      <AppShell>
        <div className="page-header">
          <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 20, width: '80%' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card mb-12">
            <div className="skeleton" style={{ height: 70, borderRadius: 8 }} />
          </div>
        ))}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">
          {user ? `Ciao ${user.nickname?.split(' ')[0] || '👋'}!` : 'ClanDestino 🚗'}
        </h1>
        <p className="page-subtitle">Scegli il tuo autista preferito</p>
      </div>

      {!user && (
        <div className="card mb-16" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(90,61,224,0.1))', borderColor: 'rgba(124,92,252,0.4)' }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>🎉 Unisciti a ClanDestino!</p>
          <div className="d-flex gap-8">
            <Link href="/register" className="btn btn-primary btn-sm">Registrati</Link>
            <Link href="/login" className="btn btn-outline btn-sm">Accedi</Link>
          </div>
        </div>
      )}

      {user?.role === 'customer' && (
        <Link href="/booking" className="btn btn-primary btn-full mb-16" style={{ fontSize: '1rem', padding: '14px' }}>
          🚀 Prenota una corsa
        </Link>
      )}

      {user?.role === 'driver' && (
        <div className="info-box mb-16">
          👋 Sei loggato come autista. Vai alla <Link href="/driver/dashboard" style={{ color: 'var(--accent)', fontWeight: 600 }}>dashboard</Link> per vedere le prenotazioni.
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">🧑‍✈️ Autisti</h2>
        <Link href="/leaderboard" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Classifica →</Link>
      </div>

      <div className="grid-list">
        {drivers.map(d => (
          <DriverCard key={d.user_id} driver={d} onBook={handleBook} />
        ))}
      </div>

    </AppShell>
  );
}
