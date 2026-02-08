'use client';

import { useState } from 'react';
import { joinWaitlist } from '@/services/waitlistService';

interface SignupModalProps {
  onClose: () => void;
}

const specialties = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Family Medicine',
  'Internal Medicine', 'Neurology', 'Oncology', 'Pediatrics',
  'Psychiatry', 'Surgery', 'Other',
];

export default function SignupModal({ onClose }: SignupModalProps) {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !agreed) return;

    setStatus('loading');
    const result = await joinWaitlist({
      email: email.trim(),
      city: city.trim() || undefined,
      medicalSpecialty: specialty || undefined,
    });

    if (result.success) {
      setStatus('success');
    } else {
      setErrorMsg(result.error || 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 cursor-pointer"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re on the list!</h3>
            <p className="text-gray-600 mb-6">We&apos;ll notify you when BeyondRounds launches in your city.</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Join BeyondRounds</h3>
            <p className="text-gray-500 text-sm mb-6">Be the first to know when we launch in your city.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@hospital.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="signup-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="signup-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Berlin"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="signup-specialty" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <select
                  id="signup-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="">Select specialty</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to receive updates from BeyondRounds. No spam, unsubscribe anytime.
                </span>
              </label>

              {status === 'error' && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || !agreed || status === 'loading'}
                className="w-full rounded-full py-3 font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'loading' ? 'Joining...' : 'Get Early Access'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
