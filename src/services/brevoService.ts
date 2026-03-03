/**
 * Brevo Service
 * Manages marketing contacts via the Brevo REST API.
 *
 * Strategy: Option A — Brevo Automation UI only.
 * This service does ONE thing: add the contact to the Waitlist list.
 * The Brevo automation workflow fires automatically from the
 * "Contact added to list" trigger and handles all drip emails.
 * No code-side scheduling — the Automation UI owns the sequence.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';

interface AddContactOptions {
    email: string;
    firstName?: string;
    locale?: string;
}

interface SendTemplateOptions {
    templateId: number;
    to: string;
    firstName?: string;
    locale?: string;
}

interface BrevoResult {
    success: boolean;
    error?: string;
}

function resolveApiKey(): string | null {
    const raw = process.env.BREVO_API_KEY;
    if (!raw) return null;
    // Support base64-encoded JSON format: {"api_key":"xkeysib-..."}
    try {
        const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        if (decoded?.api_key) return decoded.api_key;
    } catch { /* not base64 JSON — use as-is */ }
    return raw;
}

export const brevoService = {
    /**
     * Upserts a contact in Brevo and guarantees they are in the waitlist list.
     * Two-step: (1) upsert contact with attributes, (2) explicitly add to list.
     * Step 2 is separate because upsert can silently skip listIds on duplicate contacts.
     *
     * Never throws — Brevo failure must not break the signup response.
     */
    async addContact({ email, firstName, locale = 'en' }: AddContactOptions): Promise<BrevoResult> {
        const apiKey = resolveApiKey();
        if (!apiKey) {
            console.warn('[brevo] BREVO_API_KEY not set — skipping');
            return { success: false, error: 'BREVO_API_KEY not configured' };
        }

        const rawListId = process.env.BREVO_LIST_ID;
        if (!rawListId) {
            console.error('[brevo] BREVO_LIST_ID is not set — contact will not join the list and automation will not fire');
            return { success: false, error: 'BREVO_LIST_ID not configured' };
        }

        const listId = Number(rawListId);
        if (!Number.isFinite(listId)) {
            console.error('[brevo] BREVO_LIST_ID is not a valid number:', rawListId);
            return { success: false, error: 'BREVO_LIST_ID invalid' };
        }

        console.log('[brevo] listId:', listId);
        console.log('[brevo] enrolling:', email);

        const headers = {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // ── Step 1: Upsert contact with attributes ────────────────────────────
        try {
            const res = await fetch(`${BREVO_API_URL}/contacts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email,
                    updateEnabled: true,   // safe to call on duplicate signups
                    attributes: {
                        ...(firstName ? { FIRSTNAME: firstName } : {}),
                        LOCALE: locale.toUpperCase(),
                    },
                }),
            });

            // 201 = created, 204 = updated — both are success
            if (res.status !== 201 && res.status !== 204) {
                const data: { message?: string } = await res.json().catch(() => ({}));
                console.error('[brevo] upsert failed:', res.status, data);
                return { success: false, error: data.message ?? `HTTP ${res.status}` };
            }

            console.log('[brevo] Contact upserted:', email);
        } catch (err) {
            console.error('[brevo] upsert network error:', err);
            return { success: false, error: 'Network error (upsert)' };
        }

        // ── Step 2: Explicitly add to list (guarantees automation fires) ──────
        // The upsert endpoint can skip listIds for already-existing contacts.
        // This call is idempotent — safe to call even if already in the list.
        try {
            const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/add`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ emails: [email] }),
            });

            if (res.ok) {
                console.log('[brevo] Contact added to list', listId, '— automation will fire for:', email);
                return { success: true };
            }

            const data: { message?: string } = await res.json().catch(() => ({}));
            console.error('[brevo] list-add failed:', res.status, data);
            return { success: false, error: data.message ?? `HTTP ${res.status}` };
        } catch (err) {
            console.error('[brevo] list-add network error:', err);
            return { success: false, error: 'Network error (list-add)' };
        }
    },

    /**
     * Sends a single Brevo template immediately via the transactional API.
     * Use this for: manual triggers, testing a specific template, launch broadcast.
     *
     * Requires sender to be set explicitly — Brevo rejects /smtp/email without it.
     * params must include FIRSTNAME and LOCALE so template variables resolve.
     */
    async sendTemplate({ templateId, to, firstName = '', locale = 'en' }: SendTemplateOptions): Promise<BrevoResult> {
        const apiKey = resolveApiKey();
        if (!apiKey) {
            console.warn('[brevo] BREVO_API_KEY not set — skipping sendTemplate');
            return { success: false, error: 'BREVO_API_KEY not configured' };
        }

        const senderEmail = process.env.BREVO_FROM ?? 'updates@news.beyondrounds.app';

        try {
            const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
                method: 'POST',
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    sender: { name: 'BeyondRounds Updates', email: senderEmail },
                    to: [{ email: to }],
                    templateId,
                    params: {
                        FIRSTNAME: firstName,
                        LOCALE: locale.toUpperCase(),
                    },
                }),
            });

            if (res.ok) {
                console.log(`[brevo] Sent template ${templateId} to ${to}`);
                return { success: true };
            }

            const data: { message?: string } = await res.json().catch(() => ({}));
            console.error(`[brevo] sendTemplate failed (${res.status}):`, data);
            return { success: false, error: data.message ?? `HTTP ${res.status}` };
        } catch (err) {
            console.error('[brevo] sendTemplate network error:', err);
            return { success: false, error: 'Network error' };
        }
    },
};
