'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { submitContactForm } from '@/services/contactService';

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
        };

        try {
            const result = await submitContactForm(data);
            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500 font-medium">We'll get back to you within 24 hours.</p>
                <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 text-sm font-bold text-primary hover:underline"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">
                    Full Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Dr. Jane Smith"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
                    Email Address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-bold text-slate-700 ml-1">
                    Subject
                </label>
                <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    placeholder="How can we help?"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-bold text-slate-700 ml-1">
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us more about your feedback..."
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none font-medium"
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        Send Message
                        <Send className="w-4 h-4" />
                    </>
                )}
            </button>

            <p className="text-center text-xs text-slate-400 font-bold mt-4 uppercase tracking-wider">
                Response time: within 24 hours
            </p>
        </form>
    );
}
