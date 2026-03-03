'use client';
import BottomNav from './BottomNav';
import Navbar from './Navbar';
import { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <>
            <Navbar />
            <main className="page">
                <div className="container">
                    {children}
                </div>
            </main>
            <BottomNav />
        </>
    );
}
