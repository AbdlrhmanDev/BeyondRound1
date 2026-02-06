'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  MapPin,
  Calendar,
  Coffee,
  MessageCircle,
  Users,
  Send,
  Loader2,
  HandMetal,
  Clock,
  MapPinned
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface GroupChatEmptyStateProps {
  members: Member[];
  currentUserId?: string;
  groupName?: string;
  onSendMessage?: (message: string) => void;
  onAISuggestion?: () => void;
  aiLoading?: boolean;
  className?: string;
}

export function GroupChatEmptyState({
  members,
  currentUserId,
  groupName,
  onSendMessage,
  onAISuggestion,
  aiLoading = false,
  className,
}: GroupChatEmptyStateProps) {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Get current user's first name for personalized messages
  const currentUser = members.find(m => m.user_id === currentUserId);
  const firstName = currentUser?.full_name?.split(' ')[0] || 'there';

  // Other members (excluding current user)
  const otherMembers = members.filter(m => m.user_id !== currentUserId);
  const otherNames = otherMembers
    .slice(0, 2)
    .map(m => m.full_name?.split(' ')[0] || 'Someone')
    .join(', ');
  const moreCount = Math.max(0, otherMembers.length - 2);

  // Stagger animations
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 100);
    const t2 = setTimeout(() => setShowActions(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Quick action messages - contextual to group meetups
  const QUICK_MESSAGES = [
    {
      id: 'intro',
      icon: HandMetal,
      label: t('groupChatEmpty.actions.introduce'),
      message: t('groupChatEmpty.messages.intro', { name: firstName }),
    },
    {
      id: 'availability',
      icon: Clock,
      label: t('groupChatEmpty.actions.availability'),
      message: t('groupChatEmpty.messages.availability'),
    },
    {
      id: 'location',
      icon: MapPinned,
      label: t('groupChatEmpty.actions.location'),
      message: t('groupChatEmpty.messages.location'),
    },
  ];

  // Conversation starters - tappable chips
  const STARTERS = [
    { id: 'wave', text: t('groupChatEmpty.starters.wave') },
    { id: 'weekend', text: t('groupChatEmpty.starters.weekend') },
    { id: 'coffee', text: t('groupChatEmpty.starters.coffee') },
    { id: 'excited', text: t('groupChatEmpty.starters.excited') },
  ];

  const handleQuickAction = (action: typeof QUICK_MESSAGES[0]) => {
    setSelectedAction(action.id);
    onSendMessage?.(action.message);
  };

  const handleStarter = (starter: typeof STARTERS[0]) => {
    setSelectedAction(starter.id);
    onSendMessage?.(starter.text);
  };

  return (
    <div className={cn('flex flex-col items-center px-4 py-8', className)}>
      {/* Member Avatars - Visual social proof */}
      <div className={cn(
        'flex items-center justify-center mb-4 transition-all duration-500',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <div className="flex -space-x-3">
          {otherMembers.slice(0, 4).map((member, idx) => {
            const initials = member.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || 'U';
            return (
              <Avatar
                key={member.user_id}
                className={cn(
                  'h-12 w-12 border-3 border-background shadow-lg ring-2 ring-primary/10',
                  'animate-in fade-in zoom-in duration-300'
                )}
                style={{ animationDelay: `${idx * 100}ms`, zIndex: 10 - idx }}
              >
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {moreCount > 0 && (
            <div className="h-12 w-12 rounded-full border-3 border-background bg-secondary flex items-center justify-center shadow-lg">
              <span className="text-sm font-semibold text-muted-foreground">+{moreCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className={cn(
        'text-center mb-6 transition-all duration-500 delay-100',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {t('groupChatEmpty.title')}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          {otherNames && moreCount > 0
            ? t('groupChatEmpty.subtitleWithMore', { names: otherNames, count: moreCount })
            : otherNames
              ? t('groupChatEmpty.subtitleNames', { names: otherNames })
              : t('groupChatEmpty.subtitle')
          }
        </p>
      </div>

      {/* Quick Start Chips - One-tap messages */}
      <div className={cn(
        'w-full max-w-sm mb-6 transition-all duration-500',
        showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-2">
          <Send className="h-3 w-3" />
          {t('groupChatEmpty.tapToSend')}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {STARTERS.map((starter, index) => (
            <button
              key={starter.id}
              onClick={() => handleStarter(starter)}
              disabled={!!selectedAction}
              className={cn(
                'px-3 py-2 rounded-full text-sm transition-all duration-200',
                'bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground',
                'border border-border/50 hover:border-primary',
                'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selectedAction === starter.id && 'bg-primary text-primary-foreground border-primary'
              )}
              style={{ animationDelay: `${500 + index * 75}ms` }}
            >
              {starter.text}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions - Plan the meetup */}
      <div className={cn(
        'w-full max-w-sm transition-all duration-500 delay-200',
        showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl" />
          <div className="relative p-4 rounded-2xl border border-border/40 bg-card/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coffee className="h-3.5 w-3.5" />
              {t('groupChatEmpty.planMeetup')}
            </p>
            <div className="space-y-2">
              {QUICK_MESSAGES.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={!!selectedAction}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                      'bg-background/60 hover:bg-background',
                      'border border-transparent hover:border-primary/30',
                      'group disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:shadow-sm active:scale-[0.98]',
                      selectedAction === action.id && 'bg-primary/10 border-primary/30'
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-foreground flex-1 font-medium">
                      {action.label}
                    </span>
                    <Send className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestion CTA - Premium feature */}
      <div className={cn(
        'mt-6 transition-all duration-500 delay-300',
        showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <Button
          variant="default"
          size="lg"
          onClick={onAISuggestion}
          disabled={aiLoading || !!selectedAction}
          className={cn(
            'gap-2 rounded-full shadow-lg hover:shadow-xl transition-all',
            'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary',
            'px-6'
          )}
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t('groupChatEmpty.aiSuggestion')}
        </Button>
        <p className="text-xs text-muted-foreground/60 text-center mt-2">
          {t('groupChatEmpty.aiHint')}
        </p>
      </div>
    </div>
  );
}

export default GroupChatEmptyState;
