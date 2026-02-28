'use client';
import { useEffect, useState } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'default' | 'success' | 'danger' | 'warning';
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastList: Toast[] = [];

export function removeToast(id: string) {
    toastList = toastList.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(toastList));
}

export function addToast(message: string, type: Toast['type'] = 'default', duration = 4000) {
    const id = Math.random().toString(36).slice(2);
    toastList = [...toastList, { id, message, type }];
    toastListeners.forEach((fn) => fn(toastList));
    if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
    }
    return id;
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (t: Toast[]) => setToasts([...t]);
        toastListeners.push(listener);
        return () => { toastListeners = toastListeners.filter((l) => l !== listener); };
    }, []);

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
