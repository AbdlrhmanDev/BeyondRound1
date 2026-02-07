import { Resend } from 'resend';
import * as React from 'react';
import { WelcomeEmail } from '../components/emails/welcome';
import { WhitelistEmail } from '../components/emails/whitelist-signup';
import { ProjectCompletedEmail } from '../components/emails/project-completed';
import { PaymentEmail } from '../components/emails/payment-confirmed';
import { checkNotificationExists } from './notificationService';

const resend = new Resend(process.env.RESEND_API_KEY);

// Safer default from: Use env var if available, otherwise try to detect localhost
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL ||
    (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') || !process.env.NEXT_PUBLIC_APP_URL
        ? 'onboarding@resend.dev'
        : 'no-reply@beyondrounds.com'); // Using your project name instead of 'yourdomain.com'

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    text: string;
    userId?: string;
    idempotencyKey?: string;
}

/**
 * Resend Email Service
 * Handles transactional email delivery with professional design and delivery best practices.
 */
export const emailService = {
    /**
     * Send a single or multi-recipient email with optional idempotency check
     * @param options SendEmailOptions
     * @returns Promise<{ success: boolean; data?: any; error?: any; alreadySent?: boolean }>
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

            console.log(`Sending email to: ${options.to} from: ${DEFAULT_FROM} with subject: ${options.subject}`);

            const { data, error } = await resend.emails.send({
                from: DEFAULT_FROM,
                to: options.to,
                subject: options.subject,
                react: options.react,
                text: options.text,
            });

            if (error) {
                console.error('Resend Error Response:', JSON.stringify(error, null, 2));
                return { success: false, error };
            }

            console.log('Email sent successfully!', data);
            return { success: true, data };
        } catch (error) {
            console.error('Email Service Unexpected Error:', error);
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
            text: `Hello ${name}, welcome to our platform! Your account has been successfully created.`,
        });
    },

    /**
     * Send a whitelist confirmation email
     */
    async sendWhitelistConfirmation(email: string) {
        return this.send({
            to: email,
            subject: 'You’re on the whitelist 🎉',
            react: React.createElement(WhitelistEmail),
            text: 'You have been successfully added to our whitelist. We will notify you once you can access the platform.',
        });
    },

    /**
     * Send a group notification for completed project
     */
    async sendProjectCompleted(emails: string[], projectName: string, dashboardUrl: string) {
        return this.send({
            to: emails,
            subject: `✅ Project completed: ${projectName}`,
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
            subject: 'Payment confirmed – thank you',
            react: React.createElement(PaymentEmail, { ...details }),
            text: `Your payment of ${details.amount} on ${details.date} was successful. View your invoice: ${details.invoiceUrl}`,
        });
    }
};
