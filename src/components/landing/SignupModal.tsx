'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { joinWaitlist } from '@/services/waitlistService';

interface SignupModalProps {
  onClose: () => void;
}

const specialties = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Family Medicine',
  'Internal Medicine', 'Neurology', 'Oncology', 'Pediatrics',
  'Psychiatry', 'Surgery', 'Other',
];

// ─── Shared input classes ────────────────────────────────
const inputClass = [
  'w-full rounded-[18px] border border-[#E8E0DA] bg-[#FDFBF9] px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200',
  'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
  'hover:border-[#D4C9C1]',
].join(' ');

// ─── Custom Select (Listbox) ────────────────────────────
function SpecialtySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusIdx < 0) return;
    const list = listRef.current;
    const item = list?.children[focusIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusIdx, open]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    const idx = value ? specialties.indexOf(value) : 0;
    setFocusIdx(idx >= 0 ? idx : 0);
  }, [value]);

  const selectItem = useCallback((item: string) => {
    onChange(item);
    setOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          handleOpen();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIdx((i) => Math.min(i + 1, specialties.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIdx((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIdx >= 0) selectItem(specialties[focusIdx]);
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case 'Home':
          e.preventDefault();
          setFocusIdx(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIdx(specialties.length - 1);
          break;
        default: {
          // Type-ahead: jump to first match
          const char = e.key.toLowerCase();
          if (char.length === 1) {
            const idx = specialties.findIndex(
              (s) => s.toLowerCase().startsWith(char)
            );
            if (idx >= 0) setFocusIdx(idx);
          }
        }
      }
    },
    [open, focusIdx, handleOpen, selectItem]
  );

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="specialty-listbox"
        aria-label="Select specialty"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={[
          'w-full rounded-[18px] border bg-[#FDFBF9] px-4 py-3',
          'text-sm text-left transition-all duration-200 min-h-[48px]',
          'flex items-center justify-between gap-2',
          open
            ? 'border-[#F6B4A8] ring-[3px] ring-[#F6B4A8]/40'
            : 'border-[#E8E0DA] hover:border-[#D4C9C1]',
          'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
        ].join(' ')}
      >
        <span className={value ? 'text-[#1A0A12]' : 'text-[#5E555B]/50'}>
          {value || 'Select specialty'}
        </span>
        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5E555B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <ul
          ref={listRef}
          id="specialty-listbox"
          role="listbox"
          aria-label="Specialties"
          className={[
            'absolute z-50 mt-2 w-full rounded-[18px] border border-[#E8E0DA]/60',
            'bg-[#FDFBF9] py-1.5 shadow-[0_8px_30px_rgba(58,11,34,0.08)]',
            'max-h-[280px] overflow-y-auto',
            'animate-fade-in',
          ].join(' ')}
        >
          {specialties.map((s, i) => {
            const isSelected = s === value;
            const isFocused = i === focusIdx;
            return (
              <li
                key={s}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectItem(s)}
                onMouseEnter={() => setFocusIdx(i)}
                className={[
                  'flex items-center justify-between px-4 min-h-[44px] mx-1.5 rounded-[14px]',
                  'text-sm cursor-pointer transition-colors duration-150 select-none',
                  // Selected state
                  isSelected && !isFocused
                    ? 'bg-[#F27C5C]/[0.12] text-[#3A0B22] font-medium'
                    : '',
                  // Focused (keyboard/hover) state
                  isFocused && isSelected
                    ? 'bg-[#F27C5C]/[0.16] text-[#3A0B22] font-medium'
                    : isFocused
                      ? 'bg-[#3A0B22]/[0.06] text-[#1A0A12]'
                      : '',
                  // Default
                  !isSelected && !isFocused ? 'text-[#1A0A12]' : '',
                ].join(' ')}
              >
                <span>{s}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F27C5C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Custom Checkbox ────────────────────────────────────
function PremiumCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span
          className={[
            'flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-[1.5px] transition-all duration-200',
            checked
              ? 'bg-[#3A0B22] border-[#3A0B22]'
              : 'border-[#D4C9C1] bg-white group-hover:border-[#F6B4A8]',
            'peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#F6B4A8]/40',
          ].join(' ')}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
      </span>
      <span className="text-xs text-[#5E555B] leading-relaxed">{children}</span>
    </label>
  );
}

// ─── Main Modal ─────────────────────────────────────────
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
        className="absolute inset-0 bg-[#1A0A12]/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal card */}
      <div className="relative bg-[#FDFBF9] rounded-[24px] shadow-[0_16px_60px_rgba(58,11,34,0.12)] w-full max-w-md p-6 sm:p-8 animate-fade-in border border-[#E8E0DA]/40">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.06] transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#F27C5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A0A12] mb-2 font-display">
              You&apos;re on the list!
            </h3>
            <p className="text-[#5E555B] text-sm mb-6">
              We&apos;ll notify you when BeyondRounds launches in your city.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full px-8 py-3 font-semibold text-sm bg-[#3A0B22] text-white hover:bg-[#4B0F2D] active:scale-[0.98] transition-all min-h-[48px] shadow-[0_2px_12px_rgba(58,11,34,0.2)]"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h3 className="text-xl font-bold text-[#1A0A12] mb-1 font-display">
              Join BeyondRounds
            </h3>
            <p className="text-[#5E555B] text-sm mb-6">
              Be the first to know when we launch in your city.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-[#3A0B22] mb-1.5">
                  Email <span className="text-[#F27C5C]">*</span>
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@hospital.com"
                  className={inputClass}
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="signup-city" className="block text-sm font-medium text-[#3A0B22] mb-1.5">
                  City
                </label>
                <input
                  id="signup-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Berlin"
                  className={inputClass}
                />
              </div>

              {/* Specialty — custom select */}
              <div>
                <label className="block text-sm font-medium text-[#3A0B22] mb-1.5">
                  Specialty
                </label>
                <SpecialtySelect value={specialty} onChange={setSpecialty} />
              </div>

              {/* Consent checkbox */}
              <PremiumCheckbox checked={agreed} onChange={setAgreed}>
                I agree to receive updates from BeyondRounds. No spam, unsubscribe anytime.
              </PremiumCheckbox>

              {/* Error message */}
              {status === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 rounded-[12px] px-3 py-2">{errorMsg}</p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!email.trim() || !agreed || status === 'loading'}
                className={[
                  'w-full rounded-full py-3.5 font-semibold text-sm text-white min-h-[48px]',
                  'bg-gradient-to-r from-[#F27C5C] to-[#F6B4A8]',
                  'shadow-[0_2px_12px_rgba(242,124,92,0.25)]',
                  'hover:shadow-[0_4px_20px_rgba(242,124,92,0.35)] hover:-translate-y-0.5',
                  'active:translate-y-0 active:shadow-[0_2px_8px_rgba(242,124,92,0.2)]',
                  'disabled:from-[#F6B4A8]/60 disabled:to-[#F6B4A8]/40 disabled:text-white/60 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                ].join(' ')}
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Get Early Access'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
