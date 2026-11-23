import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { RiHandCoinLine } from '@remixicon/react';

export function App() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
            <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <RiHandCoinLine className="size-7" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lunasin</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Aplikasi Split Bill & Patungan Praktis Tanpa Ribet
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button>Mulai Split Bill</Button>
                    <Button variant="outline">Pelajari Dulu</Button>
                </div>
            </div>
        </main>
    );
}

const rootElement = document.getElementById('app');
if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
