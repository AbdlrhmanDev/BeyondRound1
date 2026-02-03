'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CalculateScoreBadge } from '@/components/CalculateScoreBadge';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/profileService';
import { saveOnboardingPreferences } from '@/services/onboardingService';

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showScore, setShowScore] = useState(false);
  const [savingPending, setSavingPending] = useState(true);

  useEffect(() => {
    const runWelcomeFlow = async () => {
      // Wait for auth to load
      if (!user?.id) {
        setTimeout(() => {
          setSavingPending(false);
          setShowScore(true);
        }, 400);
        return;
      }

      // Skip if already shown before
      const storageKey = `shown_welcome_score_${user.id}`;
      if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        router.replace(`/${locale}/dashboard`);
        return;
      }

      // Save pending onboarding data from signup (before email verification)
      const pendingStr = typeof window !== 'undefined' ? localStorage.getItem('pending_onboarding_data') : null;
      if (pendingStr) {
        try {
          const { personalInfo, answers } = JSON.parse(pendingStr);
          const socialStyleFromGoals = answers?.goals || [];

          await updateProfile(user.id, {
            full_name: personalInfo?.name || null,
            country: personalInfo?.country || null,
            state: personalInfo?.state || null,
            city: personalInfo?.city || null,
            neighborhood: personalInfo?.neighborhood || null,
            gender: personalInfo?.gender || null,
            birth_year: personalInfo?.birthYear ? parseInt(personalInfo.birthYear) : null,
            gender_preference: personalInfo?.genderPreference || null,
            nationality: personalInfo?.nationality || null,
          });

          const prefsSuccess = await saveOnboardingPreferences(user.id, {
            specialty: answers?.specialty?.[0] || null,
            specialty_preference: answers?.specialty_preference?.[0] || 'no_preference',
            group_language_preference: answers?.group_language_preference?.[0] || 'both',
            career_stage: answers?.stage?.[0] || null,
            sports: answers?.sports || [],
            activity_level: answers?.activity_level?.[0] || null,
            music_preferences: answers?.music_preferences || [],
            movie_preferences: answers?.movie_preferences || [],
            other_interests: answers?.other_interests || [],
            meeting_activities: answers?.meeting_activities || ['coffee', 'dinner'],
            social_energy: answers?.social_energy?.[0] || 'moderate',
            conversation_style: answers?.conversation_style?.[0] || 'mix',
            availability_slots: answers?.availability || [],
            meeting_frequency: answers?.meeting_frequency?.[0] || 'flexible',
            goals: answers?.goals || [],
            social_style: socialStyleFromGoals,
            dietary_preferences: answers?.dietary_preferences || [],
            life_stage: answers?.life_stage?.[0] || null,
            ideal_weekend: answers?.ideal_weekend || [],
            completed_at: new Date().toISOString(),
          });

          if (prefsSuccess) {
            localStorage.removeItem('pending_onboarding_data');
          }
        } catch {
          // Keep pending data for Dashboard to retry
        }
      }

      setSavingPending(false);
      setShowScore(true);
    };

    runWelcomeFlow();
  }, [user?.id, locale, router]);

  const handleComplete = () => {
    if (user?.id && typeof window !== 'undefined') {
      localStorage.setItem(`shown_welcome_score_${user.id}`, 'true');
    }
    router.replace(`/${locale}/dashboard`);
  };

  if (!showScore || savingPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foreground dark:bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <CalculateScoreBadge
        label={t('onboarding.scoreBadge.calculating')}
        completeLabel={t('onboarding.scoreBadge.complete')}
        allDoneTitle={t('onboarding.allDone')}
        allDoneSubtitle={t('onboarding.allDoneSubtitle')}
        goToDashboardLabel={t('onboarding.goToDashboard')}
        onComplete={handleComplete}
      />
    </div>
  );
}
