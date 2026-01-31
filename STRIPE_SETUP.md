# Stripe Billing & Subscription Setup Guide

This guide will help you set up Stripe billing and subscription functionality for your application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Supabase project with Edge Functions enabled
3. Your application deployed or running locally

## Step 1: Set Up Stripe Products and Prices

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add Product**
3. Create your subscription plans (e.g., Basic, Premium, Pro)
4. For each product:
   - Set the name and description
   - Choose **Recurring** pricing
   - Set the billing period (monthly/yearly)
   - Set the price
   - Copy the **Price ID** (starts with `price_...`)

## Step 2: Configure Environment Variables

### For Local Development

Add these variables to your `.env.local` file:

```env
# Stripe Keys (from Stripe Dashboard → Developers → API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Step 1)
VITE_STRIPE_PRICE_ID_BASIC=price_...
VITE_STRIPE_PRICE_ID_PREMIUM=price_...
VITE_STRIPE_PRICE_ID_PRO=price_...

# Supabase (if not already set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### For Production (Vercel)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the variables above (use production Stripe keys)

### For Supabase Edge Functions

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add these secrets:
   - `STRIPE_SECRET_KEY` (your Stripe secret key)
   - `STRIPE_WEBHOOK_SECRET` (your webhook signing secret - see Step 4)

## Step 3: Run Database Migration

Run the migration to create the necessary tables:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply the migration manually in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/20260121000000_create_subscriptions_and_billing.sql
```

## Step 4: Deploy Supabase Edge Functions

Deploy the Stripe-related Edge Functions:

```bash
# Deploy checkout function
supabase functions deploy stripe-checkout

# Deploy webhook function
supabase functions deploy stripe-webhook
```

## Step 5: Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to:
   ```
   https://your-project-id.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `customer.subscription.trial_will_end`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to your Supabase Edge Function secrets (see Step 2)

## Step 6: Update Price IDs in Code

Update the price IDs in `src/components/BillingSection.tsx`:

```typescript
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_BASIC || "price_basic",
    // ...
  },
  // ... other plans
];
```

Or set them via environment variables (recommended).

## Step 7: Test the Integration

### Test Mode

1. Use Stripe test mode (test API keys start with `pk_test_` and `sk_test_`)
2. Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and any 3-digit CVC

### Testing Flow

1. Start your development server: `npm run dev`
2. Navigate to Settings page
3. Click "Subscribe" on a plan
4. Complete the checkout with a test card
5. Verify:
   - Subscription appears in Stripe Dashboard
   - Subscription data is saved in your database
   - Webhook events are received (check Supabase Edge Function logs)

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint URL is correct
2. Verify webhook secret is set in Supabase secrets
3. Check Supabase Edge Function logs for errors
4. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

### Checkout Not Redirecting

1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
2. Check browser console for errors
3. Ensure Stripe.js is loading: `loadStripe()` should not return null

### Subscription Not Appearing in Database

1. Check webhook is receiving events (Stripe Dashboard → Webhooks → Events)
2. Verify database migration was applied
3. Check Supabase Edge Function logs for errors
4. Ensure RLS policies allow the webhook to insert/update

### Edge Function Errors

1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify all environment variables are set
3. Ensure Stripe SDK is imported correctly (Deno-compatible version)

## Production Checklist

Before going live:

- [ ] Switch to production Stripe keys (`pk_live_...` and `sk_live_...`)
- [ ] Update webhook endpoint to production URL
- [ ] Test complete subscription flow end-to-end
- [ ] Set up monitoring/alerts for failed webhooks
- [ ] Configure Stripe email receipts
- [ ] Set up subscription cancellation flow (if needed)
- [ ] Test subscription renewal
- [ ] Test failed payment handling

## Additional Features to Implement

The current implementation includes:
- ✅ Subscription checkout
- ✅ Webhook handling
- ✅ Subscription status tracking
- ✅ Invoice history

Consider adding:
- [ ] Subscription cancellation UI
- [ ] Payment method management
- [ ] Upgrade/downgrade flows
- [ ] Proration handling
- [ ] Trial periods
- [ ] Coupon/discount codes
- [ ] Usage-based billing (if needed)

## Support

For issues:
1. Check Stripe Dashboard → Logs for API errors
2. Check Supabase Dashboard → Edge Functions → Logs
3. Review browser console for frontend errors
4. Check database for subscription records

## Security Notes

- ⚠️ Never expose `STRIPE_SECRET_KEY` in client-side code
- ✅ Always use environment variables for sensitive keys
- ✅ Verify webhook signatures (already implemented)
- ✅ Use RLS policies to protect user data
- ✅ Validate user authentication before checkout
