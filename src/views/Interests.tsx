'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { getOnboardingPreferences, saveOnboardingPreferences } from '@/services/onboardingService';
import { Heart, ChevronLeft, X } from 'lucide-react';
import { INTEREST_OPTIONS } from '@/constants/interests';

const Interests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<{
    sports?: string[] | null;
    music_preferences?: string[] | null;
    movie_preferences?: string[] | null;
    other_interests?: string[] | null;
    goals?: string[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const allInterests = [
    ...(preferences?.other_interests || []),
    ...(preferences?.sports || []),
    ...(preferences?.music_preferences || []),
    ...(preferences?.movie_preferences || []),
    ...(preferences?.goals || []),
  ].filter(Boolean);

  const selectedIds = new Set(allInterests);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const prefs = await getOnboardingPreferences(user.id);
        setPreferences(prefs ?? {});
      } catch {
        toast({ title: t('common.error'), description: t('profile.toastFailedToUpdateProfile'), variant: 'destructive' });
        setPreferences({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, t, toast]);

  const isSelected = (id: string) => selectedIds.has(id);

  const getKeyForCategory = (category: string) =>
    category === 'sports' ? 'sports' :
    category === 'music' ? 'music_preferences' :
    category === 'movies' ? 'movie_preferences' :
    category === 'goals' ? 'goals' : 'other_interests';

  const toggleInterest = (opt: (typeof INTEREST_OPTIONS)[0]) => {
    const { id, category } = opt;
    const key = getKeyForCategory(category);
    const current = (preferences?.[key as keyof typeof preferences] as string[] | undefined) || [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setPreferences((p) => ({ ...p, [key]: next }));
  };

  const removeAndSave = async (opt: (typeof INTEREST_OPTIONS)[0]) => {
    const key = getKeyForCategory(opt.category);
    const current = (preferences?.[key as keyof typeof preferences] as string[] | undefined) || [];
    const next = current.filter((x) => x !== opt.id);
    const updated = { ...preferences, [key]: next };
    setPreferences(updated);
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveOnboardingPreferences(user.id, {
        sports: updated?.sports || [],
        music_preferences: updated?.music_preferences || [],
        movie_preferences: updated?.movie_preferences || [],
        other_interests: updated?.other_interests || [],
        goals: updated?.goals || [],
        social_style: updated?.goals || [],
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const success = await saveOnboardingPreferences(user.id, {
        sports: preferences?.sports || [],
        music_preferences: preferences?.music_preferences || [],
        movie_preferences: preferences?.movie_preferences || [],
        other_interests: preferences?.other_interests || [],
        goals: preferences?.goals || [],
        social_style: preferences?.goals || [],
      });
      if (success) {
        toast({ title: t('profile.toastProfileUpdated'), description: t('dashboard.toastProfileDataSavedDesc') });
        setShowPicker(false);
      } else {
        toast({ title: t('common.error'), description: t('profile.toastFailedToUpdateProfile'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('profile.toastError'), description: t('profile.toastErrorDesc'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
            <ChevronLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('dashboard.interests')}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            + {t('dashboard.add')}
          </Button>
        </div>

        {showPicker ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {allInterests.length >= 3
                ? t('dashboard.addAtLeast3')
                : allInterests.length > 0
                  ? t('dashboard.selectXMore', { count: 3 - allInterests.length })
                  : t('dashboard.addAtLeast3')}
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((opt) => {
                const sel = isSelected(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      sel
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-secondary/50 border-border'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || allInterests.length < 3}>
                {saving ? '...' : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setShowPicker(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : allInterests.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {allInterests.map((id) => {
                const opt = INTEREST_OPTIONS.find((o) => o.id === id);
                const label = opt?.label || id;
                const icon = opt?.icon || '•';
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => opt && removeAndSave(opt)}
                      disabled={saving}
                      className="ml-1 rounded-full p-0.5 hover:bg-secondary"
                      aria-label={t('common.remove')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPicker(true)}
              className="gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Heart className="h-4 w-4 text-primary" />
              {t('dashboard.addInterests')}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-10 sm:py-12">
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {t('dashboard.interestsProgress', { current: allInterests.length })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground text-center mb-2">
                {t('dashboard.interestsEmptyHeadline')}
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm mx-auto">
                {t('dashboard.interestsEmptySubline')}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  { key: 'interestsCategorySports', icon: '🏃' },
                  { key: 'interestsCategoryMusic', icon: '🎵' },
                  { key: 'interestsCategoryMovies', icon: '🎬' },
                  { key: 'interestsCategoryHobbies', icon: '📚' },
                  { key: 'interestsCategoryGoals', icon: '🎯' },
                ].map(({ key, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary/60 hover:bg-secondary border border-border/60 transition-colors"
                  >
                    <span>{icon}</span>
                    <span>{t(`dashboard.${key}`)}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={() => setShowPicker(true)}
                  className="gap-2 rounded-xl font-semibold shadow-sm"
                >
                  <Heart className="h-5 w-5" />
                  {t('dashboard.addInterests')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Interests;
