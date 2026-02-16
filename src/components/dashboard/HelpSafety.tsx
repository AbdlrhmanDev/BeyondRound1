'use client';

import { Flag, ShieldCheck, BookOpen } from "lucide-react";

interface HelpSafetyProps {
  onReport?: () => void;
  onNoShow?: () => void;
  onStandards?: () => void;
}

const CHIPS = [
  { id: "report", label: "Report issue", icon: Flag },
  { id: "noshow", label: "No-show support", icon: ShieldCheck },
  { id: "standards", label: "Our standards", icon: BookOpen },
] as const;

export default function HelpSafety({ onReport, onNoShow, onStandards }: HelpSafetyProps) {
  const handlers: Record<string, (() => void) | undefined> = {
    report: onReport,
    noshow: onNoShow,
    standards: onStandards,
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Support
      </p>
      <div className="flex gap-2 flex-wrap">
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={handlers[chip.id]}
            className="inline-flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:shadow-soft transition-all active:scale-[0.98] min-h-[44px]"
          >
            <chip.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
