import { Resend } from 'resend';
import * as React from 'react';
import { WelcomeEmail } from '../components/emails/welcome';
import { PasswordResetEmail } from '../components/emails/password-reset';
import { ProjectCompletedEmail } from '../components/emails/project-completed';
import { PaymentEmail } from '../components/emails/payment-confirmed';
import { QuizResultEmail } from '../components/emails/quiz-result';
import { EmailVerification } from '../components/emails/email-verification';
import { MagicLinkEmail } from '../components/emails/magic-link';
import { DoctorVerificationEmail } from '../components/emails/doctor-verification';
import { SubscriptionStartedEmail } from '../components/emails/subscription-started';
import { PaymentFailedEmail } from '../components/emails/payment-failed';
import { RefundProcessedEmail } from '../components/emails/refund-processed';
import { BookingConfirmedEmail } from '../components/emails/booking-confirmed';
import { EventReminderEmail } from '../components/emails/event-reminder';
import { AdminAlertEmail } from '../components/emails/admin-alert';
import { checkNotificationExists } from './notificationService';

const resend = new Resend(process.env.RESEND_API_KEY);

// Stream 1: all transactional email from mail.beyondrounds.app
const FROM = `BeyondRounds <${process.env.RESEND_FROM || 'hello@mail.beyondrounds.app'}>`;

// Always use the production URL for links inside emails — never localhost
const EMAIL_BASE_URL = process.env.EMAIL_BASE_URL ?? 'https://app.beyondrounds.app';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    text: string;
    from?: string;
    replyTo?: string;
    headers?: Record<string, string>;
    userId?: string;
    idempotencyKey?: string;
}

/**
 * Resend Email Service
 * Handles transactional email delivery using Resend SDK and React Email templates.
 */
export const emailService = {
    /**
     * Send a single or multi-recipient email with optional idempotency check
     */
    async send(options: SendEmailOptions) {
        try {
            if (!process.env.RESEND_API_KEY) {
                throw new Error('RESEND_API_KEY is not defined in environment variables');
            }

            // Optional Idempotency Check
            if (options.userId && options.idempotencyKey) {
                const exists = await checkNotificationExists(options.userId, 'email_sent', `%${options.idempotencyKey}%`);
                if (exists) {
                    console.info('Email already sent (idempotency check):', options.idempotencyKey);
                    return { success: true, alreadySent: true };
                }
            }

            const to = Array.isArray(options.to) ? options.to : [options.to];
            console.log(`Sending email via Resend to: ${to.join(', ')} subject: ${options.subject}`);

            const { data, error } = await resend.emails.send({
                from: options.from || FROM,
                to,
                replyTo: options.replyTo,
                subject: options.subject,
                react: options.react,
                text: options.text,
                headers: options.headers,
            });

            if (error) throw error;

            console.log('Email sent successfully!', data?.id);
            return { success: true, data };
        } catch (error) {
            console.error('Email Service Error:', error);
            return { success: false, error };
        }
    },

    /**
     * Send a welcome email to a new user
     */
    async sendWelcome(email: string, name: string) {
        return this.send({
            to: email,
            subject: 'Welcome! Your account has been created',
            react: React.createElement(WelcomeEmail, { name }),
            text: `Hello Doctor, welcome to our platform! Your account has been successfully created.`,
        });
    },

    /**
     * Send a magic link (passwordless sign-in) email
     */
    async sendMagicLink(email: string, magicLink: string, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: isDe
                ? 'Ihr Anmeldelink \u2013 BeyondRounds'
                : 'Your sign-in link \u2013 BeyondRounds',
            react: React.createElement(MagicLinkEmail, { magicLink, locale }),
            text: isDe
                ? `Klicken Sie auf den folgenden Link, um sich anzumelden (läuft in 15 Minuten ab): ${magicLink}`
                : `Click the following link to sign in (expires in 15 minutes): ${magicLink}`,
        });
    },

    /**
     * Send a group notification for completed project
     */
    async sendProjectCompleted(emails: string[], projectName: string, dashboardUrl: string) {
        return this.send({
            to: emails,
            subject: `\u2705 Project completed: ${projectName}`,
            react: React.createElement(ProjectCompletedEmail, { projectName, dashboardUrl }),
            text: `Project "${projectName}" has been completed and is ready for use. View it here: ${dashboardUrl}`,
        });
    },

    /**
     * Send a payment confirmation email
     */
    async sendPaymentConfirmation(email: string, details: { amount: string, date: string, invoiceUrl: string }) {
        return this.send({
            to: email,
            subject: 'Payment confirmed \u2013 thank you',
            react: React.createElement(PaymentEmail, { ...details }),
            text: `Your payment of ${details.amount} on ${details.date} was successful. View your invoice: ${details.invoiceUrl}`,
        });
    },

    /**
     * Send a quiz result email with Social Health Score
     */
    async sendQuizResult(email: string, firstName: string, score: number, locale: string = 'en') {
        const isDe = locale === 'de';
        const loc = isDe ? 'de' : 'en';
        const unsubUrl = `${EMAIL_BASE_URL}/${loc}/unsubscribe?email=${encodeURIComponent(email)}`;
        return this.send({
            to: email,
            subject: isDe
                ? `Ihr Social Health Score: ${score}/100`
                : `Your Social Health Score: ${score}/100`,
            react: React.createElement(QuizResultEmail, { firstName, score, locale, unsubUrl }),
            text: isDe
                ? `Hallo ${firstName},\n\nIhr Social Health Score beträgt ${score}/100.\n\nTreten Sie der BeyondRounds Early-Access-Liste bei: https://beyondrounds.app/de/waitlist\n\n— Mostafa\nGründer, BeyondRounds`
                : `Hi ${firstName},\n\nYour Social Health Score is ${score}/100.\n\nJoin the BeyondRounds early access list: https://beyondrounds.app/en/waitlist\n\n— Mostafa\nFounder, BeyondRounds`,
        });
    },

    /**
     * Send a password reset email
     */
    async sendPasswordReset(email: string, resetLink: string, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: isDe ? 'Passwort zurücksetzen \u2013 BeyondRounds' : 'Reset your password \u2013 BeyondRounds',
            react: React.createElement(PasswordResetEmail, { resetLink, locale }),
            text: isDe
                ? `Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen: ${resetLink}`
                : `Click the following link to reset your password: ${resetLink}`,
        });
    },

    /**
     * Send an email verification link to a new user
     */
    async sendEmailVerification(email: string, verificationLink: string, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: isDe ? 'E-Mail-Adresse bestätigen \u2013 BeyondRounds' : 'Verify your email \u2013 BeyondRounds',
            react: React.createElement(EmailVerification, { verificationLink, locale }),
            text: isDe
                ? `Bitte bestätigen Sie Ihre E-Mail-Adresse: ${verificationLink}`
                : `Please verify your email address: ${verificationLink}`,
        });
    },

    /**
     * Send doctor verification result (approved or rejected)
     */
    async sendDoctorVerification(email: string, firstName: string, approved: boolean, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: approved
                ? (isDe ? 'Verifizierung genehmigt \u2013 BeyondRounds' : 'Verification approved \u2013 BeyondRounds')
                : (isDe ? 'Update zu Ihrer Verifizierung \u2013 BeyondRounds' : 'Update on your verification \u2013 BeyondRounds'),
            react: React.createElement(DoctorVerificationEmail, { approved, firstName, locale }),
            text: approved
                ? `Hi ${firstName}, your doctor verification has been approved. You now have full access to BeyondRounds.`
                : `Hi ${firstName}, we were unable to approve your verification. Please resubmit your documents.`,
        });
    },

    /**
     * Send subscription started / renewal confirmation
     */
    async sendSubscriptionStarted(email: string, planName: string, nextBillingDate: string, amount: string) {
        return this.send({
            to: email,
            subject: 'Your BeyondRounds subscription is active',
            react: React.createElement(SubscriptionStartedEmail, { planName, nextBillingDate, amount }),
            text: `Your ${planName} subscription is now active. Next billing date: ${nextBillingDate}. Amount: ${amount}.`,
        });
    },

    /**
     * Send payment failed notification
     */
    async sendPaymentFailed(email: string, amount: string, nextRetryDate: string, updatePaymentUrl: string) {
        return this.send({
            to: email,
            subject: 'Action required: payment failed \u2013 BeyondRounds',
            react: React.createElement(PaymentFailedEmail, { amount, nextRetryDate, updatePaymentUrl }),
            text: `Your payment of ${amount} failed. We'll retry on ${nextRetryDate}. Update your payment method: ${updatePaymentUrl}`,
        });
    },

    /**
     * Send refund processed notification
     */
    async sendRefundProcessed(email: string, amount: string, planName: string) {
        return this.send({
            to: email,
            subject: 'Your refund has been processed \u2013 BeyondRounds',
            react: React.createElement(RefundProcessedEmail, { amount, planName }),
            text: `Your refund of ${amount} for ${planName} has been processed. Please allow 5–10 business days.`,
        });
    },

    /**
     * Send booking confirmation / change / cancellation
     */
    async sendBookingConfirmed(email: string, details: {
        eventDate: string;
        eventTime: string;
        venue: string;
        city: string;
        action: 'confirmed' | 'changed' | 'canceled';
        locale?: string;
    }) {
        const { action, locale = 'en', ...rest } = details;
        const subjects = {
            confirmed: 'Booking confirmed \u2013 BeyondRounds',
            changed: 'Booking updated \u2013 BeyondRounds',
            canceled: 'Booking canceled \u2013 BeyondRounds',
        };
        return this.send({
            to: email,
            subject: subjects[action],
            react: React.createElement(BookingConfirmedEmail, { ...rest, action, locale }),
            text: `Your booking has been ${action}. Date: ${details.eventDate} at ${details.eventTime}, ${details.venue}, ${details.city}.`,
        });
    },

    /**
     * Send event reminder (24h or 2h before)
     */
    async sendEventReminder(email: string, details: {
        eventDate: string;
        eventTime: string;
        venue: string;
        city: string;
        locale?: string;
    }, hoursUntil: 24 | 2) {
        const { locale = 'en', ...rest } = details;
        return this.send({
            to: email,
            subject: hoursUntil === 2
                ? 'Your event starts in 2 hours \u2013 BeyondRounds'
                : 'Reminder: your event is tomorrow \u2013 BeyondRounds',
            react: React.createElement(EventReminderEmail, { ...rest, hoursUntil, locale }),
            text: `Reminder: your event is ${hoursUntil === 2 ? 'in 2 hours' : 'tomorrow'} at ${details.eventTime}, ${details.venue}, ${details.city}.`,
        });
    },

    /**
     * Send an admin alert (silently skips if ADMIN_EMAIL is not set)
     */
    async sendAdminAlert(type: 'new_signup' | 'payment_failed' | 'booking_created', details: Record<string, string>) {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) return { success: true, skipped: true };

        const subjects = {
            new_signup: '🆕 New signup – BeyondRounds',
            payment_failed: '⚠️ Payment failed – BeyondRounds',
            booking_created: '📅 New booking – BeyondRounds',
        };

        return this.send({
            to: adminEmail,
            subject: subjects[type],
            react: React.createElement(AdminAlertEmail, { type, details }),
            text: `Admin alert [${type}]:\n${Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n')}`,
        });
    },
};
