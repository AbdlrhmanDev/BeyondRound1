'use client';

import { Check } from "lucide-react";

export type StepKey = "account" | "verify" | "preferences" | "day" | "reserved" | "match" | "meetup";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "preferences", label: "Prefs" },
  { key: "day", label: "Day" },
  { key: "reserved", label: "Reserved" },
  { key: "match", label: "Match" },
  { key: "meetup", label: "Meetup" },
];

interface ProgressStepperProps {
  currentStep: StepKey;
}

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 shadow-sm"
      role="list"
      aria-label="Your progress"
    >
      <div className="flex items-center justify-between overflow-x-auto snap-x gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          // Show label for current step and its immediate neighbors
          const showLabel = Math.abs(i - currentIndex) <= 1;

          return (
            <div
              key={step.key}
              className="flex items-center flex-1 min-w-0 snap-start"
              role="listitem"
              aria-label={`Step ${i + 1} of ${STEPS.length}: ${step.label}, ${isCompleted ? "completed" : isCurrent ? "current" : "upcoming"}`}
            >
              {/* Dot */}
              <div className="flex flex-col items-center gap-1.5 min-w-[32px]">
                <div
                  className={`
                    relative flex items-center justify-center rounded-full transition-all duration-300
                    ${isCompleted
                      ? "h-3 w-3 bg-accent"
                      : isCurrent
                        ? "h-3.5 w-3.5 bg-primary ring-[3px] ring-primary/15"
                        : "h-3 w-3 bg-border"
                    }
                  `}
                >
                  {isCompleted && (
                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                  )}
                </div>
                {showLabel && (
                  <span
                    className={`text-[10px] leading-none whitespace-nowrap ${
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {/* Connector line (not after last) */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-0.5 rounded-full transition-colors duration-300 ${
                    i < currentIndex ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
