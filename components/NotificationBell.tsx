'use client';
import { useEffect, useState, useRef } from 'react';
import { addToast, removeToast } from './Toast';

export default function NotificationBell() {
    const [unread, setUnread] = useState(0);
    const prevUnreadRef = useRef(0);
    const activeToastId = useRef<string | null>(null);

    const fetchNotifs = async () => {
        try {
            const r = await fetch('/api/notifications');
            if (!r.ok) return;
            const data = await r.json();
            const cnt = data.unread || 0;

            if (cnt > prevUnreadRef.current) {
                if (!activeToastId.current) {
                    activeToastId.current = addToast('🚨 Nuova corsa in arrivo!', 'warning', 0);
                }
            } else if (cnt < prevUnreadRef.current && activeToastId.current) {
                removeToast(activeToastId.current);
                activeToastId.current = null;
            } else if (cnt === 0 && activeToastId.current) {
                removeToast(activeToastId.current);
                activeToastId.current = null;
            }

            prevUnreadRef.current = cnt;
            setUnread(cnt);
        } catch { }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 5000);
        return () => clearInterval(interval);
    }, []);

    const markRead = async () => {
        await fetch('/api/notifications', { method: 'POST' });
        if (activeToastId.current) {
            removeToast(activeToastId.current);
            activeToastId.current = null;
        }
        setUnread(0);
        prevUnreadRef.current = 0;
    };

    return (
        <button className="notif-bell" onClick={markRead} title="Notifiche">
            🔔
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
    );
}
