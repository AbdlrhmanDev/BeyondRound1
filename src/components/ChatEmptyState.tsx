'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Coffee, Briefcase, Lightbulb, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatEmptyStateProps {
  otherUserName?: string | null;
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function ChatEmptyState({
  otherUserName,
  onSendMessage,
  className,
}: ChatEmptyStateProps) {
  const { t } = useTranslation();
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);
  const [showIcebreakers, setShowIcebreakers] = useState(false);

  // Icebreakers with icons and translation keys
  const ICEBREAKERS = [
    { icon: Coffee, key: 'coffee' },
    { icon: Briefcase, key: 'project' },
    { icon: Lightbulb, key: 'challenges' },
    { icon: MessageCircle, key: 'whyJoined' },
  ];

  const QUICK_STARTER_KEYS = ['greeting', 'lookingForward', 'hearAboutWork'];

  // Stagger animation for icebreakers
  useEffect(() => {
    const timer = setTimeout(() => setShowIcebreakers(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickStart = (key: string) => {
    const message = t(`chatEmpty.quickStarters.${key}`);
    setSelectedStarter(key);
    onSendMessage?.(message);
  };

  const handleIcebreaker = (key: string) => {
    const message = t(`chatEmpty.icebreakers.${key}`);
    setSelectedStarter(key);
    onSendMessage?.(message);
  };

  const displayName = otherUserName || t('chatEmpty.sayHelloTo', { name: '' }).replace('{{name}}', '').trim() || 'your new connection';

  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-8 min-h-[60vh]', className)}>
      {/* Hero Section - Compact */}
      <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold/10 flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary/20 animate-ping opacity-20" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
          {t('chatEmpty.startConversation')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('chatEmpty.sayHelloTo', { name: otherUserName || displayName })}
        </p>
      </div>

      {/* Quick Start Chips */}
      <div className="w-full max-w-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
          {t('chatEmpty.quickStart')}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_STARTER_KEYS.map((key, index) => {
            const text = t(`chatEmpty.quickStarters.${key}`);
            return (
              <button
                key={key}
                onClick={() => handleQuickStart(key)}
                disabled={!!selectedStarter}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  'bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground',
                  'border border-border/50 hover:border-primary',
                  'hover:shadow-md hover:-translate-y-0.5',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'animate-in fade-in slide-in-from-bottom-2',
                  selectedStarter === key && 'bg-primary text-primary-foreground border-primary'
                )}
                style={{ animationDelay: `${200 + index * 75}ms` }}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Icebreakers Section */}
      <div className={cn(
        'w-full max-w-sm transition-all duration-500',
        showIcebreakers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-secondary/50 rounded-2xl" />
          <div className="relative p-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              {t('chatEmpty.conversationStarters')}
            </p>
            <div className="space-y-2">
              {ICEBREAKERS.map((icebreaker, index) => {
                const Icon = icebreaker.icon;
                const text = t(`chatEmpty.icebreakers.${icebreaker.key}`);
                return (
                  <button
                    key={icebreaker.key}
                    onClick={() => handleIcebreaker(icebreaker.key)}
                    disabled={!!selectedStarter}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                      'bg-background/60 hover:bg-background',
                      'border border-transparent hover:border-primary/30',
                      'group disabled:opacity-50 disabled:cursor-not-allowed',
                      selectedStarter === icebreaker.key && 'bg-primary/10 border-primary/30'
                    )}
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-foreground flex-1">
                      {text}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground/70 text-center mt-6 animate-in fade-in duration-500 delay-700">
        {t('chatEmpty.tip')}
      </p>
    </div>
  );
}

// ============================================
// Chat List Empty State (No groups yet)
// ============================================

interface ChatListEmptyStateProps {
  onBookMeetup?: () => void;
  className?: string;
}

export function ChatListEmptyState({
  onBookMeetup,
  className,
}: ChatListEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card overflow-hidden', className)}>
      {/* Gradient header strip */}
      <div className="h-1.5 bg-gradient-gold" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          {/* Animated icon */}
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            {/* Floating dots animation */}
            <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="absolute -left-2 top-3 w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="absolute right-2 -bottom-1 w-2.5 h-2.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {t('chatEmpty.noGroupChats')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
            {t('chatEmpty.bookToUnlock')}
          </p>

          {/* How it works - compact */}
          <div className="w-full max-w-xs bg-secondary/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                <div className="w-0.5 h-4 bg-border" />
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                <div className="w-0.5 h-4 bg-border" />
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-xs text-foreground">{t('chatEmpty.howItWorks.step1')}</p>
                <p className="text-xs text-foreground">{t('chatEmpty.howItWorks.step2')}</p>
                <p className="text-xs text-foreground">{t('chatEmpty.howItWorks.step3')}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onBookMeetup}
            className="rounded-xl px-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            {t('chatEmpty.bookMeetup')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatEmptyState;
