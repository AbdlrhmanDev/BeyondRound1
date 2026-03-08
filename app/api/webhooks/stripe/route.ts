import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/integrations/supabase/server';
import { emailService } from '@/services/emailService';

export const dynamic = 'force-dynamic';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-02-25.clover',
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCustomerEmail(customerId: string): Promise<string | null> {
    try {
        const stripe = getStripe();
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) return null;
        return (customer as Stripe.Customer).email ?? null;
    } catch {
        return null;
    }
}

async function getBookingDetails(bookingId: string) {
    const admin = createAdminClient();
    const { data } = await admin
        .from('bookings' as any)
        .select('id, user_id, event_id, events(date_time, venue, city)')
        .eq('id', bookingId)
        .maybeSingle();
    return data as {
        id: string;
        user_id: string;
        event_id: string;
        events: { date_time: string; venue: string; city: string } | null;
    } | null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_EMAILS;
    if (!webhookSecret) {
        console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET_EMAILS not set');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Raw body required for HMAC signature verification
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            // ── checkout.session.completed ────────────────────────────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const email = session.customer_email
                    ?? (session.customer ? await getCustomerEmail(session.customer as string) : null);

                if (!email) break;

                if (session.mode === 'subscription') {
                    // New subscription
                    const sub = session.subscription
                        ? await stripe.subscriptions.retrieve(session.subscription as string)
                        : null;
                    const priceItem = sub?.items.data[0];
                    const planName = priceItem?.price.nickname ?? 'BeyondRounds Membership';
                    const amount = priceItem
                        ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: priceItem.price.currency.toUpperCase() })
                            .format((priceItem.price.unit_amount ?? 0) / 100)
                        : '';
                    const nextBillingDate = (sub as any)?.current_period_end
                        ? new Date((sub as any).current_period_end * 1000).toLocaleDateString('en-GB')
                        : '';

                    await Promise.all([
                        emailService.sendSubscriptionStarted(email, planName, nextBillingDate, amount),
                        emailService.sendAdminAlert('new_signup', {
                            email,
                            plan: planName,
                            amount,
                            session_id: session.id,
                        }),
                    ]);
                } else if (session.mode === 'payment' && session.client_reference_id) {
                    // One-time payment linked to a booking
                    const bookingId = session.client_reference_id;
                    const booking = await getBookingDetails(bookingId);

                    if (booking?.events) {
                        const dt = new Date(booking.events.date_time);
                        await Promise.all([
                            emailService.sendBookingConfirmed(email, {
                                eventDate: dt.toLocaleDateString('en-GB'),
                                eventTime: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                                venue: booking.events.venue,
                                city: booking.events.city,
                                action: 'confirmed',
                            }),
                            emailService.sendAdminAlert('booking_created', {
                                email,
                                booking_id: bookingId,
                                event_date: dt.toISOString(),
                                venue: booking.events.venue,
                                city: booking.events.city,
                            }),
                        ]);
                    }
                } else if (session.mode === 'payment') {
                    // Generic one-time payment
                    const amount = session.amount_total
                        ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: (session.currency ?? 'eur').toUpperCase() })
                            .format(session.amount_total / 100)
                        : '';
                    await emailService.sendPaymentConfirmation(email, {
                        amount,
                        date: new Date().toLocaleDateString('en-GB'),
                        invoiceUrl: session.url ?? '',
                    });
                }
                break;
            }

            // ── customer.subscription.updated ────────────────────────────────
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const prevSub = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;

                // Only send when transitioning to active
                if (sub.status === 'active' && prevSub?.status && prevSub.status !== 'active') {
                    const email = sub.customer
                        ? await getCustomerEmail(sub.customer as string)
                        : null;
                    if (!email) break;

                    const priceItem = sub.items.data[0];
                    const planName = priceItem?.price.nickname ?? 'BeyondRounds Membership';
                    const amount = priceItem
                        ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: priceItem.price.currency.toUpperCase() })
                            .format((priceItem.price.unit_amount ?? 0) / 100)
                        : '';
                    const nextBillingDate = new Date((sub as any).current_period_end * 1000).toLocaleDateString('en-GB');

                    await emailService.sendSubscriptionStarted(email, planName, nextBillingDate, amount);
                }
                break;
            }

            // ── invoice.payment_failed ────────────────────────────────────────
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const email = invoice.customer_email
                    ?? (invoice.customer ? await getCustomerEmail(invoice.customer as string) : null);
                if (!email) break;

                const amount = invoice.amount_due
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: (invoice.currency ?? 'eur').toUpperCase() })
                        .format(invoice.amount_due / 100)
                    : '';

                // Get next retry date
                const nextRetry = invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('en-GB')
                    : 'soon';

                // Generate Stripe billing portal URL
                let portalUrl = 'https://billing.stripe.com';
                if (invoice.customer) {
                    try {
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.beyondrounds.app';
                        const session = await stripe.billingPortal.sessions.create({
                            customer: invoice.customer as string,
                            return_url: `${appUrl}/settings?tab=billing`,
                        });
                        portalUrl = session.url;
                    } catch {
                        // fall back to default portal URL
                    }
                }

                await Promise.all([
                    emailService.sendPaymentFailed(email, amount, nextRetry, portalUrl),
                    emailService.sendAdminAlert('payment_failed', {
                        email,
                        amount,
                        invoice_id: invoice.id ?? '',
                        next_retry: nextRetry,
                    }),
                ]);
                break;
            }

            // ── charge.refunded ───────────────────────────────────────────────
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                const email = charge.billing_details.email
                    ?? (charge.customer ? await getCustomerEmail(charge.customer as string) : null);
                if (!email) break;

                const amount = charge.amount_refunded
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: (charge.currency ?? 'eur').toUpperCase() })
                        .format(charge.amount_refunded / 100)
                    : '';

                await emailService.sendRefundProcessed(email, amount, 'BeyondRounds');
                break;
            }

            // ── customer.subscription.deleted ─────────────────────────────────
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const email = sub.customer
                    ? await getCustomerEmail(sub.customer as string)
                    : null;
                if (!email) break;

                const priceItem = sub.items.data[0];
                const planName = priceItem?.price.nickname ?? 'BeyondRounds Membership';
                const amount = priceItem
                    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: priceItem.price.currency.toUpperCase() })
                        .format((priceItem.price.unit_amount ?? 0) / 100)
                    : '';

                await emailService.sendRefundProcessed(email, amount, planName);
                break;
            }

            default:
                // Unhandled event type — acknowledge and ignore
                break;
        }
    } catch (err) {
        console.error('[stripe-webhook] Handler error:', err instanceof Error ? err.message : err);
        // Return 200 to prevent Stripe retries for application-level errors
    }

    return NextResponse.json({ received: true });
}
