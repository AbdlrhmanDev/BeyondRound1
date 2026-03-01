import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import * as React from 'react';
import { WelcomeEmail } from '../components/emails/welcome';
import { WhitelistEmail } from '../components/emails/whitelist-signup';
import { PasswordResetEmail } from '../components/emails/password-reset';
import { ProjectCompletedEmail } from '../components/emails/project-completed';
import { PaymentEmail } from '../components/emails/payment-confirmed';
import { QuizResultEmail } from '../components/emails/quiz-result';
import { checkNotificationExists } from './notificationService';

// ZeptoMail SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.ZEPTOMAIL_SMTP_HOST,
    port: Number(process.env.ZEPTOMAIL_SMTP_PORT) || 465,
    secure: (process.env.ZEPTOMAIL_SMTP_PORT === '465'),
    auth: {
        user: process.env.ZEPTOMAIL_SMTP_USER,
        pass: process.env.ZEPTOMAIL_SMTP_PASS,
    },
});

const DEFAULT_FROM = process.env.ZEPTOMAIL_FROM || 'hello@beyondrounds.app';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    text: string;
    from?: string;
    userId?: string;
    idempotencyKey?: string;
}

/**
 * ZeptoMail (SMTP) Email Service
 * Handles transactional email delivery using Nodemailer and React Email templates.
 */
export const emailService = {
    /**
     * Send a single or multi-recipient email with optional idempotency check
     * @param options SendEmailOptions
     * @returns Promise<{ success: boolean; data?: any; error?: any; alreadySent?: boolean }>
     */
    async send(options: SendEmailOptions) {
        try {
            if (!process.env.ZEPTOMAIL_SMTP_PASS) {
                throw new Error('ZEPTOMAIL_SMTP_PASS is not defined in environment variables');
            }

            // Optional Idempotency Check
            if (options.userId && options.idempotencyKey) {
                const exists = await checkNotificationExists(options.userId, 'email_sent', `%${options.idempotencyKey}%`);
                if (exists) {
                    console.info('Email already sent (idempotency check):', options.idempotencyKey);
                    return { success: true, alreadySent: true };
                }
            }

            console.log(`Sending email via ZeptoMail to: ${options.to} from: ${DEFAULT_FROM} with subject: ${options.subject}`);

            // Render React template to HTML
            const html = await render(options.react);

            const info = await transporter.sendMail({
                from: options.from || DEFAULT_FROM,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html,
                text: options.text,
            });

            console.log('Email sent successfully!', info.messageId);
            return { success: true, data: info };
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
            text: `Hello ${name}, welcome to our platform! Your account has been successfully created.`,
        });
    },

    /**
     * Send a whitelist confirmation email (Email 0 — immediate)
     */
    async sendWhitelistConfirmation(email: string, locale: string = 'en') {
        const isDe = locale === 'de';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.beyondrounds.app';
        const unsubUrl = `${appUrl}/en/unsubscribe?email=${encodeURIComponent(email)}`;

        return this.send({
            to: email,
            from: process.env.ZEPTOMAIL_FROM || 'waitlist@beyondrounds.app',
            subject: isDe
                ? 'Sie sind auf der BeyondRounds Early-Access-Liste'
                : "You're on the BeyondRounds early access list",
            react: React.createElement(WhitelistEmail, { locale, unsubUrl }),
            text: isDe
                ? `Sie sind dabei.\n\nBeyondRounds ist eine verifizierte Community nur für Ärzte in Berlin.\n\nWas als Nächstes passiert:\n1. Wir senden Ihnen eine E-Mail, sobald ein Platz frei wird\n2. Sie verifizieren sich einmal (schnell + privat)\n3. Sie erhalten Ihre erste Match-Gruppe\n\n— Mostafa\nGründer, BeyondRounds`
                : `You're in.\n\nBeyondRounds is a verified doctors-only community in Berlin. We're opening access in small waves to keep matching quality high.\n\nWhat happens next:\n1. We'll email you when a spot opens\n2. You'll verify once (quick + private)\n3. You'll get your first match group\n\n— Mostafa\nFounder, BeyondRounds`,
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
        const unsubUrl = `https://beyondrounds.app/${loc}/unsubscribe?email=${encodeURIComponent(email)}`;
        return this.send({
            to: email,
            from: process.env.ZEPTOMAIL_FROM || 'waitlist@beyondrounds.app',
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
    }
};
