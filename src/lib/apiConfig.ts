/**
 * API base URL for servy (Stripe, etc.)
 * When NEXT_PUBLIC_SERVY_URL is set, Stripe calls go through servy.beyondrounds.app
 * Otherwise uses local Next.js API routes (/api/stripe/checkout, /api/stripe/cancel)
 */

const SERVY_URL = process.env.NEXT_PUBLIC_SERVY_URL || "";

export const getServyUrl = (): string => SERVY_URL;

export const useServyProxy = (): boolean => !!SERVY_URL;
