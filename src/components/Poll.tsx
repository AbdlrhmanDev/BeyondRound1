'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Users, X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PollWithVotes, votePoll, unvotePoll, closePoll, deletePoll } from '@/services/pollService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Lock, Trash2 } from 'lucide-react';

interface PollProps {
  poll: PollWithVotes;
  userId: string;
  onVoteChange?: () => void;
  isOwn?: boolean;
}

export const Poll = ({ poll, userId, onVoteChange, isOwn = false }: PollProps) => {
  const { t } = useTranslation();
  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState<number[]>(poll.user_votes);
  const [localVoteCounts, setLocalVoteCounts] = useState<number[]>(poll.vote_counts);

  const handleVote = async (optionIndex: number) => {
    if (poll.is_closed || isVoting) return;

    setIsVoting(true);
    const isAlreadyVoted = localVotes.includes(optionIndex);

    // Optimistic update
    if (isAlreadyVoted) {
      setLocalVotes(localVotes.filter((v) => v !== optionIndex));
      setLocalVoteCounts(
        localVoteCounts.map((count, idx) => (idx === optionIndex ? Math.max(0, count - 1) : count))
      );
    } else {
      // For single choice, remove previous vote first
      if (!poll.is_multiple_choice && localVotes.length > 0) {
        const prevVote = localVotes[0];
        setLocalVoteCounts(
          localVoteCounts.map((count, idx) => (idx === prevVote ? Math.max(0, count - 1) : count))
        );
        await unvotePoll(poll.id, userId, prevVote);
      }
      setLocalVotes(poll.is_multiple_choice ? [...localVotes, optionIndex] : [optionIndex]);
      setLocalVoteCounts(
        localVoteCounts.map((count, idx) => (idx === optionIndex ? count + 1 : count))
      );
    }

    try {
      if (isAlreadyVoted) {
        await unvotePoll(poll.id, userId, optionIndex);
      } else {
        await votePoll(poll.id, userId, optionIndex);
      }
      onVoteChange?.();
    } catch (error) {
      console.error('Error voting:', error);
      // Rollback on error
      setLocalVotes(poll.user_votes);
      setLocalVoteCounts(poll.vote_counts);
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    const success = await closePoll(poll.id, userId);
    if (success) {
      onVoteChange?.();
    }
  };

  const handleDelete = async () => {
    const success = await deletePoll(poll.id, userId);
    if (success) {
      onVoteChange?.();
    }
  };

  const totalVotes = localVoteCounts.reduce((sum, count) => sum + count, 0);
  const maxVotes = Math.max(...localVoteCounts, 1);

  const getPollTypeIcon = () => {
    switch (poll.poll_type) {
      case 'day':
        return '📅';
      case 'time':
        return '⏰';
      case 'activity':
        return '☕';
      case 'place':
        return '📍';
      default:
        return '📊';
    }
  };

  return (
    <div className={cn(
      'rounded-2xl p-4 shadow-md border max-w-sm',
      isOwn
        ? 'bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20'
        : 'bg-card border-border/60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getPollTypeIcon()}</span>
          <h4 className="font-semibold text-sm text-foreground">{poll.question}</h4>
        </div>
        {poll.creator_id === userId && !poll.is_closed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={handleClose}
                className="gap-2 bg-[#FF8A00] text-white hover:bg-[#FF8A00]/90 focus:bg-[#FF8A00]/90 focus:text-white transition-colors"
              >
                <Lock className="h-4 w-4" />
                {t('chat.closePoll', 'Close Poll')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t('chat.deletePoll', 'Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Status badge */}
      {poll.is_closed && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-full bg-muted/50 w-fit">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {t('chat.pollClosed', 'Poll closed')}
          </span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const isSelected = localVotes.includes(idx);
          const voteCount = localVoteCounts[idx] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={poll.is_closed || isVoting}
              className={cn(
                'w-full relative rounded-xl p-3 text-left transition-all',
                'border hover:border-primary/50',
                isSelected
                  ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                  : 'bg-background/50 border-border/50 hover:bg-background/80',
                poll.is_closed && 'cursor-default hover:border-border/50'
              )}
            >
              {/* Progress bar background */}
              <div
                className={cn(
                  'absolute inset-0 rounded-xl transition-all duration-300',
                  isSelected ? 'bg-primary/15' : 'bg-muted/30'
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Checkbox/Radio indicator */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-muted-foreground/40 bg-background'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Option text with emoji */}
                  <span className="text-sm font-medium text-foreground">
                    {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
                    {option.text}
                  </span>
                </div>

                {/* Vote count */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold">{voteCount}</span>
                  {totalVotes > 0 && (
                    <span className="text-muted-foreground/70">({percentage}%)</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {poll.total_votes} {poll.total_votes === 1 ? t('chat.vote', 'vote') : t('chat.votes', 'votes')}
          </span>
        </div>
        {poll.is_multiple_choice && (
          <span className="text-xs text-muted-foreground">
            {t('chat.multipleChoice', 'Multiple choice')}
          </span>
        )}
      </div>
    </div>
  );
};

export default Poll;
