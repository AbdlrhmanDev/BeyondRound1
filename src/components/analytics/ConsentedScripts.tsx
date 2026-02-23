'use client';

/**
 * ConsentedScripts
 *
 * Loads third-party tracking scripts ONLY after the user has granted consent
 * for the corresponding category. Re-evaluates automatically whenever consent
 * changes (e.g. after the user saves updated preferences).
 *
 * To activate, set these env vars in .env.local:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX
 */

import Script from 'next/script';
import { useCookieConsent } from '@/components/CookieConsentContext';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

export function ConsentedScripts() {
  const { isAllowed } = useCookieConsent();
  if (!GA_ID) return null;

  return (
    <>
      {/* 1) Consent default = denied (قبل أي شيء) */}
      <Script id="ga-consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{
          analytics_storage:'denied',
          ad_storage:'denied',
          ad_user_data:'denied',
          ad_personalization:'denied'
        });
      `}</Script>

      {/* 2) حمّل gtag دائمًا عشان Google يقدر "يشوف" التاغ */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* 3) فعّل GA فقط لما يوافق المستخدم على analytics */}
      {isAllowed('analytics') && (
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','update',{ analytics_storage:'granted' });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}</Script>
      )}
    
  )

      {/* ── Meta Pixel ────────────────────────────────────────────────── */}
      {isAllowed('marketing') && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
          n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
          s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${META_PIXEL_ID}');
          fbq('track','PageView');
        `}</Script>
      )}
    </>
  )
}
