/**
 * Multi-subdomain domain configuration for BeyondRounds SaaS
 * Used for redirects, CORS, and cookie domain
 */

export const ROOT_DOMAIN = "beyondrounds.app";

export const DOMAINS = {
  marketing: `https://${ROOT_DOMAIN}`,
  whitelist: `https://whitelist.${ROOT_DOMAIN}`,
  servy: `https://servy.${ROOT_DOMAIN}`,
  admin: `https://admin.${ROOT_DOMAIN}`,
  app: `https://app.${ROOT_DOMAIN}`,
} as const;

/** Origins allowed to call the servy API */
export const ALLOWED_API_ORIGINS = [
  DOMAINS.app,
  DOMAINS.admin,
  DOMAINS.whitelist,
] as const;

/** Cookie domain for cross-subdomain auth (e.g. .beyondrounds.app) */
export const COOKIE_DOMAIN = `.${ROOT_DOMAIN}`;

/** Check if current host is a production beyondrounds subdomain */
export const isProductionSubdomain = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === ROOT_DOMAIN ||
    window.location.hostname.endsWith(`.${ROOT_DOMAIN}`)
  );
};
