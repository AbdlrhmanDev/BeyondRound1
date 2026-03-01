'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';

// ─── Question registry ───────────────────────────────────────────────────────
// Add new question keys here as needed.

const QUESTIONS: Record<string, { title: string; options: string[] }> = {
    social_blocker: {
        title: "What's the biggest thing blocking you socially in Berlin right now?",
        options: [
            'My schedule is too unpredictable',
            "I don't know where to meet people",
            "I've tried but nothing worked",
            "I'm too tired after work",
            "Language barrier — my German isn't great",
        ],
    },
};

// ─── Content ─────────────────────────────────────────────────────────────────

function FeedbackContent() {
    const params = useSearchParams();
    const questionKey = params.get('q') ?? '';
    const fromEmail = decodeURIComponent(params.get('from') ?? '');

    const question = QUESTIONS[questionKey];

    const [selected, setSelected] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

    async function handleSelect(option: string) {
        if (status !== 'idle') return;
        setSelected(option);
        setStatus('loading');

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: questionKey,
                    answer: option,
                    email: fromEmail || undefined,
                    source: 'email_drip_2',
                }),
            });
            setStatus(res.ok ? 'done' : 'error');
        } catch {
            setStatus('error');
        }
    }

    // Unknown question key
    if (!question) {
        return (
            <div className="bg-white rounded-3xl shadow-sm p-10 sm:p-14 w-full max-w-lg text-center">
                <p className="text-[#57534E]">This link is no longer valid.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-12 w-full max-w-lg">
            {status === 'done' ? (
                /* ── Thank-you state ── */
                <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-[#4A1526] mx-auto mb-5" />
                    <h2 className="text-2xl font-bold text-[#1C1917] mb-3">
                        Thanks — that really helps.
                    </h2>
                    <p className="text-[#57534E] leading-relaxed mb-8">
                        We use answers like yours to build groups that actually work for doctors in Berlin.
                        {"You'll"} hear from us when your wave opens.
                    </p>
                    <a
                        href="/en/quiz"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4A1526] text-white font-semibold text-sm hover:bg-[#5E1B31] transition-colors"
                    >
                        See your Social Health Score <ArrowRight className="w-4 h-4" />
                    </a>
                    <p className="text-xs text-[#57534E] mt-3">Takes 2 minutes</p>
                </div>
            ) : (
                /* ── Question state ── */
                <>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#4A1526] mb-4">
                        Quick question
                    </p>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] leading-snug mb-8">
                        {question.title}
                    </h1>

                    <div className="flex flex-col gap-3">
                        {question.options.map((opt, i) => {
                            const isSelected = selected === opt;
                            const isLoading = isSelected && status === 'loading';
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(opt)}
                                    disabled={status !== 'idle'}
                                    className={[
                                        'text-left py-4 px-5 rounded-xl border-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1526]',
                                        isSelected
                                            ? 'border-[#4A1526] bg-[#4A1526] text-white'
                                            : 'border-[#1C1917]/10 bg-white text-[#1C1917] hover:border-[#4A1526] hover:bg-[#FAF7F2]',
                                        status !== 'idle' && !isSelected ? 'opacity-40 cursor-default' : '',
                                    ].join(' ')}
                                >
                                    <span className={`font-bold mr-3 ${isSelected ? 'text-white' : 'text-[#4A1526]'}`}>
                                        {String.fromCharCode(65 + i)})
                                    </span>
                                    {isLoading ? 'Saving...' : opt}
                                </button>
                            );
                        })}
                    </div>

                    {status === 'error' && (
                        <p className="mt-4 text-sm text-red-500 text-center">
                            Something went wrong. Please try again.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
            <header className="bg-[#4A1526] px-6 py-4">
                <span className="text-white font-bold text-lg tracking-tight">Beyond Rounds</span>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-16">
                <Suspense fallback={
                    <div className="w-10 h-10 rounded-full border-4 border-[#4A1526]/20 border-t-[#4A1526] animate-spin" />
                }>
                    <FeedbackContent />
                </Suspense>
            </main>
        </div>
    );
}
