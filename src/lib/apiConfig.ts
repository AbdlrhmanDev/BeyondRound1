/**
 * API base URL for servy (Stripe, etc.)
 * When VITE_SERVY_URL is set, all API calls go through servy.beyondrounds.app
 * Otherwise uses Supabase functions directly
 */

const SERVY_URL = import.meta.env.VITE_SERVY_URL || "";

export const getServyUrl = (): string => SERVY_URL;

export const useServyProxy = (): boolean => !!SERVY_URL;
