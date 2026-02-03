'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Smartphone } from 'lucide-react';

/**
 * Shows install instructions for iOS (Share → Add to Home Screen).
 * Hidden when already installed or dismissed.
 */
export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as { standalone?: boolean }).standalone === true;

    setIsIOS(isIOSDevice);
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (isIOSDevice && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', '1');
    setVisible(false);
  };

  if (!visible || !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3 rounded-2xl border border-primary-foreground/10 bg-foreground/95 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-foreground">
            {t('pwa.installTitle', 'Install BeyondRounds')}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/60">
            {t('pwa.installHint', 'Tap Share')} <span aria-hidden>⎋</span> {t('pwa.installThen', 'then "Add to Home Screen"')} <span aria-hidden>➕</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          aria-label={t('common.cancel', 'Dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
