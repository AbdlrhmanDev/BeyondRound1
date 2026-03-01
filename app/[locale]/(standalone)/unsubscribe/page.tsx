'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

function UnsubscribeContent() {
    const params = useSearchParams();
    const rawEmail = params.get('email') ?? '';
    const email = decodeURIComponent(rawEmail);

    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

    // If a valid email is in the URL, auto-submit on mount
    useEffect(() => {
        if (email && /\S+@\S+\.\S+/.test(email)) {
            handleUnsubscribe(email);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    async function handleUnsubscribe(addr: string) {
        setStatus('loading');
        try {
            const res = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: addr }),
            });
            setStatus(res.ok ? 'done' : 'error');
        } catch {
            setStatus('error');
        }
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
            <header className="bg-[#4A1526] px-6 py-4">
                <span className="text-white font-bold text-lg tracking-tight">Beyond Rounds</span>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="bg-white rounded-3xl shadow-sm p-10 sm:p-14 w-full max-w-md text-center">

                    {status === 'loading' && (
                        <>
                            <div className="w-12 h-12 rounded-full border-4 border-[#4A1526]/20 border-t-[#4A1526] animate-spin mx-auto mb-6" />
                            <p className="text-[#57534E]">Unsubscribing...</p>
                        </>
                    )}

                    {status === 'done' && (
                        <>
                            <CheckCircle2 className="w-12 h-12 text-[#4A1526] mx-auto mb-5" />
                            <h1 className="text-2xl font-bold text-[#1C1917] mb-3">
                                {"You're unsubscribed"}
                            </h1>
                            <p className="text-[#57534E] leading-relaxed">
                                <strong>{email}</strong> has been removed from all BeyondRounds emails.
                                You won't hear from us again.
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-5" />
                            <h1 className="text-2xl font-bold text-[#1C1917] mb-3">
                                Something went wrong
                            </h1>
                            <p className="text-[#57534E] leading-relaxed mb-6">
                                We couldn't process your request. Please email us directly and we'll remove you immediately.
                            </p>
                            <a
                                href="mailto:hello@beyondrounds.app?subject=Unsubscribe%20request"
                                className="inline-block px-6 py-3 rounded-xl bg-[#4A1526] text-white font-semibold text-sm hover:bg-[#5E1B31] transition-colors"
                            >
                                Email us to unsubscribe
                            </a>
                        </>
                    )}

                    {status === 'idle' && (
                        <>
                            <h1 className="text-2xl font-bold text-[#1C1917] mb-3">Unsubscribe</h1>
                            <p className="text-[#57534E] mb-2">No email address found in the link.</p>
                            <p className="text-sm text-[#57534E]">
                                To unsubscribe, email us at{' '}
                                <a href="mailto:hello@beyondrounds.app" className="text-[#4A1526] underline">
                                    hello@beyondrounds.app
                                </a>
                            </p>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-[#4A1526]/20 border-t-[#4A1526] animate-spin" />
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
