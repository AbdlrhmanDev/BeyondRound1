import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Check, Calendar, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Subscription plans configuration
// Replace these with your actual Stripe Price IDs
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_BASIC || "price_basic",
    description: "Perfect for getting started",
    features: [
      "5 matches per week",
      "Basic profile features",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM || "price_premium",
    description: "Most popular choice",
    features: [
      "Unlimited matches",
      "Advanced matching algorithm",
      "Priority support",
      "Early access to features",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29.99",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_PRO || "price_pro",
    description: "For power users",
    features: [
      "Everything in Premium",
      "1-on-1 matching assistance",
      "VIP events access",
      "Dedicated account manager",
    ],
  },
];

export const BillingSection = () => {
  const { subscription, invoices, loading, isActive, isCanceled, createCheckoutSession, cancelSubscription } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    try {
      setProcessingPlan(priceId);
      await createCheckoutSession(priceId);
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setProcessingPlan(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-500">
        <CardContent className="px-6 py-12">
          <div className="animate-pulse text-muted-foreground text-center">Loading billing information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Current Subscription */}
      {isActive && subscription && (
        <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-500">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">Current Plan</CardTitle>
                <CardDescription>Your active subscription</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium capitalize">{subscription.plan_name || "Premium"}</p>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                </div>
                {subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    Renews on {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                  Your subscription will cancel on {subscription.current_period_end && format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                </p>
              </div>
            )}

            {!subscription.cancel_at_period_end && (
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    setCanceling(true);
                    await cancelSubscription();
                    toast.success("Subscription will cancel at the end of the billing period");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to cancel subscription");
                  } finally {
                    setCanceling(false);
                  }
                }}
                disabled={canceling}
              >
                {canceling ? "Processing..." : "Cancel Subscription"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      {!isActive && (
        <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-500">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">Subscription Plans</CardTitle>
                <CardDescription>Choose the plan that works for you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.priceId)}
                      disabled={processingPlan === plan.priceId}
                    >
                      {processingPlan === plan.priceId ? "Processing..." : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {invoices.length > 0 && (
        <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-600">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">Payment History</CardTitle>
                <CardDescription>Your recent invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.paid_at
                        ? format(new Date(invoice.paid_at), "MMM d, yyyy")
                        : "Pending"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      invoice.status === "paid"
                        ? "default"
                        : invoice.status === "open"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {invoice.status}
                  </Badge>
                  {invoice.hosted_invoice_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {invoice.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.invoice_pdf!, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};
