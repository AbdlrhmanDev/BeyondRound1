'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  getEmailNotifications,
  updateEmailNotifications,
} from '@/lib/profile-settings';

interface EmailNotificationsToggleProps {
  className?: string;
}

export function EmailNotificationsToggle({
  className,
}: EmailNotificationsToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial value from Supabase
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      setIsLoading(true);
      const value = await getEmailNotifications(user.id);
      if (value !== null) {
        setEnabled(value);
      }
      setIsLoading(false);
    }

    loadSettings();
  }, [user?.id]);

  // Handle toggle with optimistic update
  const handleToggle = useCallback(
    async (newValue: boolean) => {
      if (!user?.id || isSaving) return;

      // Optimistic update
      const previousValue = enabled;
      setEnabled(newValue);
      setIsSaving(true);

      try {
        const result = await updateEmailNotifications(user.id, newValue);

        if (!result.success) {
          // Rollback on failure
          setEnabled(previousValue);
          toast({
            title: t('profile.updateFailed'),
            description: result.error || t('profile.tryAgainLater'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: newValue
              ? t('profile.notificationsEnabled')
              : t('profile.notificationsDisabled'),
          });
        }
      } catch (error) {
        // Rollback on error
        setEnabled(previousValue);
        toast({
          title: t('profile.updateFailed'),
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, enabled, isSaving, toast, t]
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Bell
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <label
            htmlFor="email-notifications"
            className="text-sm text-foreground cursor-pointer"
          >
            {t('profile.emailNotifications')}
          </label>
        </div>
        <Switch
          id="email-notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          loading={isSaving}
          aria-label={t('profile.emailNotifications')}
          aria-describedby="email-notifications-desc"
        />
      </div>
      <span id="email-notifications-desc" className="sr-only">
        {t('profile.emailNotificationsDesc')}
      </span>
    </div>
  );
}

export default EmailNotificationsToggle;
