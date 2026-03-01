'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Question data ──────────────────────────────────────────────────────────

const YES_NO_QUESTIONS = [
    'Do you currently have friends in Berlin outside of your hospital colleagues?',
    'In the past month, have you done a social activity (coffee, sports, dinner) with someone who isn\'t a coworker?',
    'Do you have at least 2-3 people you could text right now to make weekend plans?',
    'Are you part of any social groups, clubs, or regular meetups in Berlin?',
    'When you have free time, do you usually have plans or people to hang out with?',
    'Have you met any new people (not through work) in the past 3 months?',
    'Do you feel like you have a supportive social circle in Berlin?',
    'Can you easily find people who share your interests (sports, hobbies, food)?',
    'Do you feel connected to the Berlin community outside of medicine?',
    'Are you satisfied with your current social life in Berlin?',
];

const QUALIFYING_QUESTIONS: { question: string; options: string[] }[] = [
    {
        question: 'Which best describes your current situation?',
        options: [
            'I just moved to Berlin (0-6 months)',
            "I've been here 6-12 months",
            "I've been here 1-2 years",
            "I've been here 2+ years",
        ],
    },
    {
        question: 'What\'s your goal in the next 90 days?',
        options: [
            'Build a solid friend group (2-5 close friends)',
            'Find activity partners (sports, hiking, etc.)',
            'Just have people to grab coffee with',
            'Expand my network beyond work',
        ],
    },
    {
        question: "What's stopping you from making friends in Berlin right now?",
        options: [
            'My schedule is too unpredictable',
            "I don't know where to meet people",
            "I've tried but nothing worked",
            "I'm too tired after work",
            "Language barrier (my German isn't great)",
        ],
    },
    {
        question: 'Which solution would suit you best?',
        options: [
            'Premium matching service (\u20ac19.99/month) \u2014 I value my time',
            'Affordable option (\u20ac9.99/month) \u2014 I\'m budget-conscious',
            'Free community \u2014 I prefer no cost',
            'One-time trial (\u20ac9.99) \u2014 I want to test first',
        ],
    },
];

// ─── Score helpers ───────────────────────────────────────────────────────────

function getScoreBand(score: number) {
    if (score <= 30) return {
        label: 'Still forming',
        color: '#DC2626',
        bg: '#FEF2F2',
        message: "Your social foundation in Berlin is still in its early stages. That's exactly what BeyondRounds is built for — we match verified doctors into small curated groups so you actually meet people, not just collect contacts.",
    };
    if (score <= 60) return {
        label: 'Developing',
        color: '#D97706',
        bg: '#FFFBEB',
        message: "You have some connections in Berlin, but building a genuine friend group takes time and the right system. BeyondRounds does the heavy lifting: verified peers, curated groups, suggested venues — every week.",
    };
    if (score <= 80) return {
        label: 'Growing',
        color: '#2563EB',
        bg: '#EFF6FF',
        message: "You're building a solid social life in Berlin. BeyondRounds can help you go deeper — meeting verified peers who truly understand the demands of a medical career.",
    };
    return {
        label: 'Strong',
        color: '#16A34A',
        bg: '#F0FDF4',
        message: "You have a strong social life in Berlin. BeyondRounds can still add value by connecting you with verified peers in curated small groups — quality over quantity.",
    };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = Math.round((current / total) * 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-[#57534E] mb-1.5">
                <span>Question {current} of {total}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-[#4A1526] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

function YesNoCard({ question, qNum, onAnswer }: {
    question: string;
    qNum: number;
    onAnswer: (yes: boolean) => void;
}) {
    return (
        <div className="space-y-5">
            <p className="text-xl sm:text-2xl font-semibold text-[#1C1917] leading-snug">
                {question}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
                {[true, false].map((val) => (
                    <button
                        key={String(val)}
                        onClick={() => onAnswer(val)}
                        className="group py-5 rounded-2xl border-2 border-[#1C1917]/10 bg-white hover:border-[#4A1526] hover:bg-[#4A1526] text-[#1C1917] hover:text-white font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1526]"
                    >
                        {val ? 'Yes' : 'No'}
                    </button>
                ))}
            </div>
            <p className="text-xs text-[#57534E] text-center">Question {qNum} of 15</p>
        </div>
    );
}

function MultiChoiceCard({ question, options, qNum, onAnswer }: {
    question: string;
    options: string[];
    qNum: number;
    onAnswer: (val: string) => void;
}) {
    return (
        <div className="space-y-5">
            <p className="text-xl sm:text-2xl font-semibold text-[#1C1917] leading-snug">
                {question}
            </p>
            <div className="flex flex-col gap-3 mt-4">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => onAnswer(opt)}
                        className="text-left py-4 px-5 rounded-xl border-2 border-[#1C1917]/10 bg-white hover:border-[#4A1526] hover:bg-[#FAF7F2] text-[#1C1917] font-medium transition-all duration-150 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1526]"
                    >
                        <span className="text-[#4A1526] font-bold mr-3">
                            {String.fromCharCode(65 + i)})
                        </span>
                        {opt}
                    </button>
                ))}
            </div>
            <p className="text-xs text-[#57534E] text-center">Question {qNum} of 15</p>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Phase = 'contact' | 'yesno' | 'qualifying' | 'open' | 'results';

export default function Quiz() {
    const { toast } = useToast();

    // Contact info
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('Berlin, Germany');

    // Answers
    const [yesNoAnswers, setYesNoAnswers] = useState<boolean[]>([]);
    const [qualAnswers, setQualAnswers] = useState<string[]>([]);
    const [openText, setOpenText] = useState('');

    // Navigation
    const [phase, setPhase] = useState<Phase>('contact');
    const [yesNoIdx, setYesNoIdx] = useState(0);   // 0-9
    const [qualIdx, setQualIdx] = useState(0);       // 0-3

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const openRef = useRef<HTMLTextAreaElement>(null);

    // Try to detect location via browser geolocation API name (city only, no coords sent)
    useEffect(() => {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            // We'll just leave it as "Berlin, Germany" default unless user changes it
        }
    }, []);

    // Focus textarea when reaching open question
    useEffect(() => {
        if (phase === 'open') openRef.current?.focus();
    }, [phase]);

    const contactValid = firstName.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

    function handleContactNext() {
        if (!contactValid) return;
        setDirection(1);
        setPhase('yesno');
    }

    function handleYesNo(val: boolean) {
        const next = [...yesNoAnswers, val];
        setYesNoAnswers(next);
        setDirection(1);
        if (yesNoIdx < YES_NO_QUESTIONS.length - 1) {
            setYesNoIdx(yesNoIdx + 1);
        } else {
            setPhase('qualifying');
        }
    }

    function handleQualAnswer(val: string) {
        const next = [...qualAnswers, val];
        setQualAnswers(next);
        setDirection(1);
        if (qualIdx < QUALIFYING_QUESTIONS.length - 1) {
            setQualIdx(qualIdx + 1);
        } else {
            setPhase('open');
        }
    }

    async function handleSubmit() {
        setSubmitting(true);
        try {
            const res = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    email: email.trim(),
                    phone: phone.trim() || undefined,
                    location: location.trim() || undefined,
                    yesNoAnswers,
                    q11: qualAnswers[0],
                    q12: qualAnswers[1],
                    q13: qualAnswers[2],
                    q14: qualAnswers[3],
                    q15: openText.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Submission failed');
            setScore(data.score as number);
            setDirection(1);
            setPhase('results');
        } catch (err) {
            console.error(err);
            toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    }

    function goBack() {
        setDirection(-1);
        if (phase === 'yesno') {
            if (yesNoIdx > 0) {
                setYesNoAnswers(yesNoAnswers.slice(0, -1));
                setYesNoIdx(yesNoIdx - 1);
            } else {
                setPhase('contact');
            }
        } else if (phase === 'qualifying') {
            if (qualIdx > 0) {
                setQualAnswers(qualAnswers.slice(0, -1));
                setQualIdx(qualIdx - 1);
            } else {
                setYesNoIdx(YES_NO_QUESTIONS.length - 1);
                setYesNoAnswers(yesNoAnswers.slice(0, -1));
                setPhase('yesno');
            }
        } else if (phase === 'open') {
            setQualIdx(QUALIFYING_QUESTIONS.length - 1);
            setQualAnswers(qualAnswers.slice(0, -1));
            setPhase('qualifying');
        }
    }

    const currentQNum =
        phase === 'yesno' ? yesNoIdx + 1
        : phase === 'qualifying' ? 10 + qualIdx + 1
        : phase === 'open' ? 15
        : 0;

    const band = getScoreBand(score);

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

            {/* Top bar */}
            <header className="bg-[#4A1526] px-6 py-4">
                <span className="text-white font-bold text-lg tracking-tight">Beyond Rounds</span>
            </header>

            <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
                <div className="w-full max-w-lg">

                    {/* ── Contact capture ── */}
                    <AnimatePresence mode="wait" custom={direction}>
                        {phase === 'contact' && (
                            <motion.div
                                key="contact"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25 }}
                                className="bg-white rounded-3xl shadow-sm p-8 sm:p-10"
                            >
                                <p className="text-xs font-bold uppercase tracking-widest text-[#4A1526] mb-3">
                                    Before we start
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] mb-2 leading-tight">
                                    What's your Social Health Score?
                                </h1>
                                <p className="text-[#57534E] mb-8 leading-relaxed">
                                    15 quick questions. See how your social life in Berlin compares — and what to do about it.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Your first name"
                                            className="w-full h-12 rounded-xl border border-[#1C1917]/15 px-4 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#4A1526] focus:ring-2 focus:ring-[#4A1526]/10 transition-all bg-[#FAF7F2]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full h-12 rounded-xl border border-[#1C1917]/15 px-4 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#4A1526] focus:ring-2 focus:ring-[#4A1526]/10 transition-all bg-[#FAF7F2]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                                            Phone <span className="text-[#57534E] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+49 ..."
                                            className="w-full h-12 rounded-xl border border-[#1C1917]/15 px-4 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#4A1526] focus:ring-2 focus:ring-[#4A1526]/10 transition-all bg-[#FAF7F2]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Berlin, Germany"
                                            className="w-full h-12 rounded-xl border border-[#1C1917]/15 px-4 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#4A1526] focus:ring-2 focus:ring-[#4A1526]/10 transition-all bg-[#FAF7F2]"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleContactNext}
                                    disabled={!contactValid}
                                    className="mt-8 w-full h-14 rounded-2xl bg-[#4A1526] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#5E1B31] transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1526]"
                                >
                                    Start the quiz <ArrowRight className="w-5 h-5" />
                                </button>
                                <p className="text-center text-xs text-[#57534E] mt-4">
                                    No spam. Takes about 2 minutes.
                                </p>
                            </motion.div>
                        )}

                        {/* ── Yes / No questions ── */}
                        {phase === 'yesno' && (
                            <motion.div
                                key={`yn-${yesNoIdx}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22 }}
                                className="bg-white rounded-3xl shadow-sm p-8 sm:p-10"
                            >
                                <div className="mb-8">
                                    <ProgressBar current={currentQNum} total={15} />
                                </div>
                                <YesNoCard
                                    question={YES_NO_QUESTIONS[yesNoIdx]}
                                    qNum={currentQNum}
                                    onAnswer={handleYesNo}
                                />
                                <button
                                    onClick={goBack}
                                    className="mt-6 flex items-center gap-1 text-sm text-[#57534E] hover:text-[#1C1917] transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </motion.div>
                        )}

                        {/* ── Qualifying questions ── */}
                        {phase === 'qualifying' && (
                            <motion.div
                                key={`qual-${qualIdx}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22 }}
                                className="bg-white rounded-3xl shadow-sm p-8 sm:p-10"
                            >
                                <div className="mb-8">
                                    <ProgressBar current={currentQNum} total={15} />
                                </div>
                                <MultiChoiceCard
                                    question={QUALIFYING_QUESTIONS[qualIdx].question}
                                    options={QUALIFYING_QUESTIONS[qualIdx].options}
                                    qNum={currentQNum}
                                    onAnswer={handleQualAnswer}
                                />
                                <button
                                    onClick={goBack}
                                    className="mt-6 flex items-center gap-1 text-sm text-[#57534E] hover:text-[#1C1917] transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </motion.div>
                        )}

                        {/* ── Open text (Q15) ── */}
                        {phase === 'open' && (
                            <motion.div
                                key="open"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22 }}
                                className="bg-white rounded-3xl shadow-sm p-8 sm:p-10"
                            >
                                <div className="mb-8">
                                    <ProgressBar current={15} total={15} />
                                </div>
                                <p className="text-xl sm:text-2xl font-semibold text-[#1C1917] leading-snug mb-2">
                                    Is there anything else we should know?
                                </p>
                                <p className="text-sm text-[#57534E] mb-6">
                                    Optional — but it helps us match you better.
                                </p>
                                <textarea
                                    ref={openRef}
                                    value={openText}
                                    onChange={(e) => setOpenText(e.target.value)}
                                    placeholder="Your situation, what you're looking for, anything relevant..."
                                    rows={4}
                                    className="w-full rounded-xl border border-[#1C1917]/15 px-4 py-3 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#4A1526] focus:ring-2 focus:ring-[#4A1526]/10 transition-all bg-[#FAF7F2] resize-none"
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="mt-6 w-full h-14 rounded-2xl bg-[#4A1526] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#5E1B31] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1526]"
                                >
                                    {submitting ? 'Calculating...' : 'See my results'}
                                    {!submitting && <ArrowRight className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={goBack}
                                    className="mt-4 flex items-center gap-1 text-sm text-[#57534E] hover:text-[#1C1917] transition-colors mx-auto"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </motion.div>
                        )}

                        {/* ── Results ── */}
                        {phase === 'results' && (
                            <motion.div
                                key="results"
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                {/* Score card */}
                                <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-10 mb-6 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-[#4A1526] mx-auto mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-[#57534E] mb-4">
                                        Your Social Health Score
                                    </p>

                                    {/* Animated score ring */}
                                    <div className="relative w-36 h-36 mx-auto mb-4">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                                            <motion.circle
                                                cx="60" cy="60" r="50"
                                                fill="none"
                                                stroke={band.color}
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 50}`}
                                                strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                                                initial={{ strokeDashoffset: `${2 * Math.PI * 50}` }}
                                                animate={{ strokeDashoffset: `${2 * Math.PI * 50 * (1 - score / 100)}` }}
                                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-extrabold" style={{ color: band.color }}>{score}</span>
                                            <span className="text-xs text-[#57534E]">out of 100</span>
                                        </div>
                                    </div>

                                    <p className="text-xl font-bold mb-1" style={{ color: band.color }}>{band.label}</p>
                                    <p className="text-sm text-[#57534E]">We sent your results to {email}</p>
                                </div>

                                {/* Interpretation + CTA */}
                                <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-10">
                                    <div
                                        className="rounded-2xl px-6 py-5 mb-6 border-l-4"
                                        style={{ background: band.bg, borderColor: band.color }}
                                    >
                                        <p className="text-base text-[#1C1917] leading-7">{band.message}</p>
                                    </div>
                                    <p className="text-base text-[#1C1917] leading-7 mb-6">
                                        BeyondRounds is opening in small waves. Join the early access list to be first in line when your wave opens.
                                    </p>
                                    <a
                                        href={`/en/waitlist`}
                                        className="flex items-center justify-center gap-2 h-14 w-full rounded-2xl bg-[#F26449] text-white font-bold text-base hover:bg-[#E05A3E] transition-colors shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F26449]"
                                    >
                                        Join the early access list <ArrowRight className="w-5 h-5" />
                                    </a>
                                    <p className="text-center text-xs text-[#57534E] mt-4">
                                        Free to join. No spam. Verification happens after signup.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </main>
        </div>
    );
}
