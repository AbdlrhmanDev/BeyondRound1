'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Lock, CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { type WeekendDay } from "@/services/eventService";

type PaymentMethod = "card" | "apple_pay" | "paypal";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  selectedDay: WeekendDay | null;
  onPaymentComplete: () => void;
}

export default function PaymentModal({
  open,
  onClose,
  selectedDay,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  if (!selectedDay) return null;

  const handleSubmit = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      // In production: call createBooking() + Stripe checkout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, simulate success
      onPaymentComplete();
    } catch {
      setError("Payment didn't go through. Check your details and try again, or use a different method.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid =
    paymentMethod !== "card" || (cardNumber.length >= 15 && expiry.length >= 4 && cvc.length >= 3);

  const methods: { id: PaymentMethod; label: string; icon?: React.ReactNode }[] = [
    { id: "card", label: "Card", icon: <CreditCard className="h-5 w-5" /> },
    { id: "apple_pay", label: "Apple Pay" },
    { id: "paypal", label: "PayPal" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isProcessing && onClose()}>
      <DialogContent
        className="fixed inset-0 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl rounded-none border-0 sm:border p-0 overflow-y-auto bg-background"
        onPointerDownOutside={(e) => isProcessing && e.preventDefault()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-primary px-5 py-5 sm:rounded-t-2xl">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute left-4 top-4 h-11 w-11 flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground transition-opacity disabled:opacity-50"
            aria-label="Close"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <DialogHeader className="pt-2">
            <DialogTitle className="text-center text-xl font-heading text-primary-foreground">
              Confirm your reservation
            </DialogTitle>
            <DialogDescription className="sr-only">
              Complete payment to reserve your weekend meetup spot
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Reservation Summary */}
          <div className="bg-card border border-border rounded-[20px] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">
                  {selectedDay.dateFormatted}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedDay.timeSlot} · Small-group dinner
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Matched group revealed Thu
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Payment method</p>
            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  role="radio"
                  aria-checked={paymentMethod === m.id}
                  className={`
                    flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl border text-sm font-medium transition-all min-h-[56px]
                    ${paymentMethod === m.id
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border bg-card text-muted-foreground hover:border-primary/20"
                    }
                  `}
                >
                  {m.icon && m.icon}
                  <span className={m.icon ? "text-xs" : "text-sm"}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Fields (only when card selected) */}
          {paymentMethod === "card" && (
            <div className="space-y-3">
              <div>
                <label htmlFor="card-number" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Card number
                </label>
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  className="w-full h-[52px] px-4 rounded-2xl border border-border bg-card text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-expiry" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Expiry
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                      setExpiry(val);
                    }}
                    className="w-full h-[52px] px-4 rounded-2xl border border-border bg-card text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="card-cvc" className="block text-xs font-medium text-muted-foreground mb-1.5">
                    CVC
                  </label>
                  <input
                    id="card-cvc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="•••"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full h-[52px] px-4 rounded-2xl border border-border bg-card text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border-l-[3px] border-destructive">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          {/* Primary CTA */}
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !isFormValid}
            className="w-full h-14 text-base font-heading font-semibold bg-accent hover:bg-accent/90 text-white rounded-full shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-live="polite"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Reserving…
              </>
            ) : (
              "Complete reservation"
            )}
          </Button>

          {/* Trust Microcopy */}
          <p className="text-center text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout · Verified doctors only
          </p>

          {/* Cancellation Policy */}
          <div className="text-center space-y-0.5 pb-2">
            <p className="text-xs text-muted-foreground/60">
              Free cancellation until Wednesday 9 pm.
            </p>
            <p className="text-xs text-muted-foreground/60">
              No-shows are charged in full.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
