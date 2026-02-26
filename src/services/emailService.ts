import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import * as React from 'react';
import { WelcomeEmail } from '../components/emails/welcome';
import { WhitelistEmail } from '../components/emails/whitelist-signup';
import { PasswordResetEmail } from '../components/emails/password-reset';
import { ProjectCompletedEmail } from '../components/emails/project-completed';
import { PaymentEmail } from '../components/emails/payment-confirmed';
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

const DEFAULT_FROM = process.env.ZEPTOMAIL_FROM || 'no-reply@beyondrounds.app';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    text: string;
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
                from: DEFAULT_FROM,
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
     * Send a whitelist confirmation email
     */
    async sendWhitelistConfirmation(email: string, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: isDe ? 'Sie sind auf der Warteliste 🎉' : 'You’re on the whitelist 🎉',
            react: React.createElement(WhitelistEmail, { locale }),
            text: isDe 
                ? 'Vielen Dank für Ihr Interesse! Wir haben Sie in unsere exklusive Warteliste aufgenommen. Wir werden Sie benachrichtigen, sobald Sie auf die Plattform zugreifen können.'
                : 'You have been successfully added to our whitelist. We will notify you once you can access the platform.',
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
    },

    /**
     * Send a password reset email
     */
    async sendPasswordReset(email: string, resetLink: string, locale: string = 'en') {
        const isDe = locale === 'de';
        return this.send({
            to: email,
            subject: isDe ? 'Passwort zurücksetzen – BeyondRounds' : 'Reset your password – BeyondRounds',
            react: React.createElement(PasswordResetEmail, { resetLink, locale }),
            text: isDe 
                ? `Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen: ${resetLink}`
                : `Click the following link to reset your password: ${resetLink}`,
        });
    }
};
