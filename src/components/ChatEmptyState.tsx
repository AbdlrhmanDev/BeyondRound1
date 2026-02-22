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

export default ChatEmptyState;
