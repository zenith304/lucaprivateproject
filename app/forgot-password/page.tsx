'use client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="auth-logo">
                    <span className="auth-logo-emoji">🔑</span>
                </div>
                <h1 className="auth-title">Password dimenticata?</h1>
                <p className="auth-sub" style={{ marginBottom: 24 }}>
                    Tranquillo, capita a tutti! 😅
                </p>
                <div className="info-box" style={{ textAlign: 'center' }}>
                    📧 In questa versione demo il reset password non è ancora configurato.<br /><br />
                    Usa un <strong>account demo</strong> per esplorare l'app:
                    <br /><br />
                    <strong>Cliente:</strong> cliente@demo.it / demo1234<br />
                    <strong>Autista:</strong> marco@demo.it / demo1234
                </div>
                <Link href="/login" className="btn btn-primary btn-full">
                    ← Torna al login
                </Link>
            </div>
        </div>
    );
}
