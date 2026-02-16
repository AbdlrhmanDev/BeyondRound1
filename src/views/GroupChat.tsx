'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useParams } from "next/navigation";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { getSupabaseClient } from "@/integrations/supabase/client";
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Send, Users, MapPin, Sparkles, Loader2,
  Image as ImageIcon, X, Upload, MoreVertical, Pencil,
  Trash2, Check, Calendar, Clock, Coffee, BarChart3,
  Plus, PenLine, Lock, Vote, ChevronDown, ChevronUp,
  MessageCircle, AlertCircle, Flag, Shield, Copy, Reply,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { compressImages } from "@/utils/imageCompression";

const ImageViewer = dynamic(() => import("@/components/ImageViewer").then(mod => mod.ImageViewer), {
  ssr: false,
  loading: () => null
});
import {
  getGroupMessages, getGroupConversation, sendGroupMessage,
  updateGroupMessageMedia, deleteGroupMessage, editGroupMessage,
  Message,
} from "@/services/messageService";
import { getGroupInfo, getGroupMembers } from "@/services/matchService";
import { getPublicProfile } from "@/services/profileService";
import { getPublicPreferences } from "@/services/onboardingService";
import { uploadPhotos } from "@/services/storageService";
import {
  createPoll, getPolls, getPollTemplates, PollWithVotes,
  votePoll, unvotePoll, closePoll, deletePoll,
} from "@/services/pollService";

// ─── Types ────────────────────────────────────────────────
interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city?: string | null;
  specialty?: string | null;
  interests?: string[];
}

// ─── Helpers ──────────────────────────────────────────────
/** "Dr. L." style display name */
function drName(fullName: string | null): string {
  if (!fullName) return "Dr.";
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "Dr.";
  return `Dr. ${parts[parts.length - 1].charAt(0)}.`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function shouldShowDateSeparator(current: string, previous: string | null): boolean {
  if (!previous) return true;
  return new Date(current).toDateString() !== new Date(previous).toDateString();
}

// ─── Inline Poll Card ─────────────────────────────────────
const PollCard = memo(({
  poll, userId, onVoteChange, isOwn,
}: {
  poll: PollWithVotes;
  userId: string;
  onVoteChange: () => void;
  isOwn: boolean;
}) => {
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
      setLocalVotes(localVotes.filter(v => v !== optionIndex));
      setLocalVoteCounts(localVoteCounts.map((c, i) => i === optionIndex ? Math.max(0, c - 1) : c));
    } else {
      if (!poll.is_multiple_choice && localVotes.length > 0) {
        const prev = localVotes[0];
        setLocalVoteCounts(localVoteCounts.map((c, i) => i === prev ? Math.max(0, c - 1) : c));
        await unvotePoll(poll.id, userId, prev);
      }
      setLocalVotes(poll.is_multiple_choice ? [...localVotes, optionIndex] : [optionIndex]);
      setLocalVoteCounts(localVoteCounts.map((c, i) => i === optionIndex ? c + 1 : c));
    }

    try {
      if (isAlreadyVoted) await unvotePoll(poll.id, userId, optionIndex);
      else await votePoll(poll.id, userId, optionIndex);
      onVoteChange();
    } catch {
      setLocalVotes(poll.user_votes);
      setLocalVoteCounts(poll.vote_counts);
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    if (await closePoll(poll.id, userId)) onVoteChange();
  };

  const handleDelete = async () => {
    if (await deletePoll(poll.id, userId)) onVoteChange();
  };

  const totalVotes = localVoteCounts.reduce((s, c) => s + c, 0);

  const typeIcon: Record<string, string> = {
    day: "📅", time: "⏰", activity: "☕", place: "📍", custom: "📊",
  };

  return (
    <div className="max-w-[320px] mx-auto my-4 rounded-[22px] border border-[#E8DDD4] bg-[#FDFAF7] shadow-[0_2px_16px_rgba(58,11,34,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg flex-shrink-0">{typeIcon[poll.poll_type] || "📊"}</span>
          <h4 className="font-heading text-[15px] font-semibold text-[#3A0B22] leading-snug">
            {poll.question}
          </h4>
        </div>
        {poll.creator_id === userId && !poll.is_closed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-[#F6F1EC] transition-colors flex-shrink-0">
                <MoreVertical className="h-4 w-4 text-[#3A0B22]/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl">
              <DropdownMenuItem onClick={handleClose} className="gap-2 text-[#3A0B22]">
                <Lock className="h-3.5 w-3.5" /> Close poll
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {poll.is_closed && (
        <div className="mx-5 mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6F1EC] w-fit">
          <Lock className="h-3 w-3 text-[#3A0B22]/50" />
          <span className="text-[11px] font-medium text-[#3A0B22]/60">Poll closed</span>
        </div>
      )}

      {/* Options */}
      <div className="px-4 pb-2 space-y-2">
        {poll.options.map((option, idx) => {
          const isSelected = localVotes.includes(idx);
          const count = localVoteCounts[idx] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={poll.is_closed || isVoting}
              className={`w-full relative rounded-2xl p-3.5 text-left transition-all border ${
                isSelected
                  ? "bg-[#F27C5C]/8 border-[#F27C5C]/30 ring-1 ring-[#F27C5C]/15"
                  : "bg-white border-[#E8DDD4]/60 hover:border-[#F27C5C]/25"
              } ${poll.is_closed ? "cursor-default" : "active:scale-[0.98]"}`}
            >
              {/* Progress fill */}
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  isSelected ? "bg-[#F27C5C]/8" : "bg-[#F6F1EC]/40"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-[#F27C5C] border-[#F27C5C] text-white"
                      : "border-[#C9BBB0] bg-white"
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className="text-[13px] font-medium text-[#3A0B22]">
                    {option.emoji && <span className="mr-1">{option.emoji}</span>}
                    {option.text}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#3A0B22]/50 flex-shrink-0">
                  <span className="font-semibold">{count}</span>
                  {totalVotes > 0 && <span>({pct}%)</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E8DDD4]/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-[#3A0B22]/45">
          <Users className="h-3 w-3" />
          <span>{poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}</span>
        </div>
        {poll.is_multiple_choice && (
          <span className="text-[11px] text-[#3A0B22]/40">Multiple choice</span>
        )}
      </div>
    </div>
  );
});
PollCard.displayName = "PollCard";

// ─── Message Bubble ───────────────────────────────────────
const MessageItem = memo(({
  message, isOwn, sender, isConsecutive,
  editingMessageId, editContent, setEditContent,
  handleStartEdit, handleSaveEdit, handleCancelEdit,
  handleDeleteMessage, handleEditKeyPress, editInputRef,
  setViewingImages, setViewingImageIndex,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  sender: Member;
  isConsecutive: boolean;
  editingMessageId: string | null;
  editContent: string;
  setEditContent: (v: string) => void;
  handleStartEdit: (m: Message) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleDeleteMessage: (id: string) => void;
  handleEditKeyPress: (e: React.KeyboardEvent) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
  setViewingImages: (imgs: any[] | null) => void;
  setViewingImageIndex: (idx: number) => void;
  onLongPress?: (msg: Message) => void;
}) => {
  const isSystem = message.is_ai || message.content.startsWith("🤖");
  const isDeleted = message.is_deleted;
  const initials = getInitials(sender.full_name);
  const showAvatar = !isOwn && !isConsecutive && !isSystem;
  const showName = !isOwn && !isConsecutive && !isSystem;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsedMedia = useMemo(() => {
    if (!message.media_urls) return [];
    if (typeof message.media_urls === 'string') {
      try { return JSON.parse(message.media_urls); } catch { return []; }
    }
    if (Array.isArray(message.media_urls)) {
      return message.media_urls.map(m =>
        typeof m === 'string' ? { url: m, type: 'image' } : { url: m.url || '', type: m.type || 'image', size: m.size }
      );
    }
    return [];
  }, [message.media_urls]);

  const hasMedia = message.has_media && parsedMedia.length > 0;

  const handleTouchStart = () => {
    if (isOwn && onLongPress) {
      longPressTimer.current = setTimeout(() => onLongPress(message), 500);
    }
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // ── System message (bot/AI) ──
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-[#F6F1EC] border border-[#E8DDD4]/60 text-center">
          <p className="text-[12px] text-[#3A0B22]/60 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // ── Deleted message ──
  if (isDeleted) {
    return (
      <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${isConsecutive ? "mt-0.5" : "mt-5"}`}>
        {!isOwn && (showAvatar ? (
          <Avatar className="h-8 w-8 flex-shrink-0 border border-[#E8DDD4]">
            <AvatarImage src={sender.avatar_url || undefined} />
            <AvatarFallback className="bg-[#4B0F2D] text-white text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
        ) : <div className="w-8 flex-shrink-0" />)}
        <div className="px-4 py-2.5 rounded-[18px] bg-[#F6F1EC]/60 border border-[#E8DDD4]/40">
          <p className="text-[12px] text-[#3A0B22]/35 italic">Message removed</p>
          <span className="text-[10px] text-[#3A0B22]/25 mt-0.5 block">{formatTime(message.created_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${isConsecutive ? "mt-0.5" : "mt-5"} w-full`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Avatar (others only) */}
      {!isOwn && (
        showAvatar ? (
          <Avatar className="h-8 w-8 flex-shrink-0 border border-[#E8DDD4] shadow-sm">
            <AvatarImage src={sender.avatar_url || undefined} />
            <AvatarFallback className="bg-[#4B0F2D] text-white text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
        ) : <div className="w-8 flex-shrink-0" />
      )}

      <div className={`flex-1 flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[80%]`}>
        {/* Sender name */}
        {showName && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-[12px] font-semibold text-[#3A0B22]/70">
              {drName(sender.full_name)}
            </span>
            {sender.specialty && (
              <span className="text-[11px] text-[#3A0B22]/40">{sender.specialty}</span>
            )}
          </div>
        )}

        <div className="relative group flex items-start gap-1">
          {/* Message bubble */}
          <div className={`rounded-[18px] px-4 py-2.5 transition-all ${
            isOwn
              ? "bg-gradient-to-br from-[#F27C5C] to-[#E8654A] text-white shadow-[0_2px_12px_rgba(242,124,92,0.25)]"
              : "bg-white border border-[#E8DDD4]/80 text-[#3A0B22] shadow-[0_1px_4px_rgba(58,11,34,0.04)]"
          } ${isConsecutive && !isOwn ? "rounded-tl-md" : ""} ${isConsecutive && isOwn ? "rounded-tr-md" : ""}`}>

            {/* Media */}
            {hasMedia && (
              <div className={`grid gap-2 ${message.content ? 'mb-2' : ''}`} style={{ gridTemplateColumns: parsedMedia.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
                {parsedMedia.map((media: any, idx: number) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden cursor-pointer aspect-square bg-[#F6F1EC]"
                    onClick={() => { setViewingImages(parsedMedia); setViewingImageIndex(idx); }}
                  >
                    <Image src={media.url} alt={`Photo ${idx + 1}`} fill sizes="200px" className="object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {/* Edit mode */}
            {editingMessageId === message.id ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={editInputRef}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyPress}
                  className="flex-1 h-8 text-[13px] bg-white/90 border-white/30 text-[#3A0B22] rounded-xl"
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/20"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={handleCancelEdit} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/20"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : message.content ? (
              <p className={`text-[14px] whitespace-pre-wrap leading-[1.5] ${isOwn ? 'text-white' : 'text-[#3A0B22]'}`}>
                {message.content}
              </p>
            ) : null}

            {/* Timestamp + edited */}
            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'opacity-80' : 'opacity-50'}`}>
              {message.edited_at && !editingMessageId && (
                <span className={`text-[9px] ${isOwn ? 'text-white/70' : 'text-[#3A0B22]/40'}`}>Edited</span>
              )}
              <span className={`text-[10px] font-medium ${isOwn ? 'text-white/80' : 'text-[#3A0B22]/40'}`}>
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>

          {/* Actions (own messages, hover) */}
          {isOwn && (
            <div className="order-first">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#F6F1EC]">
                    <MoreVertical className="h-3.5 w-3.5 text-[#3A0B22]/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl border-[#E8DDD4]">
                  <DropdownMenuItem onClick={() => handleStartEdit(message)} className="gap-2 text-[13px]">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)} className="gap-2 text-[13px]">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)} className="gap-2 text-[13px] text-red-600 focus:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MessageItem.displayName = "MessageItem";

// ─── Date Separator ───────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E8DDD4]/60" />
      <span className="text-[11px] font-medium text-[#3A0B22]/35 tracking-wide">{formatDateLabel(date)}</span>
      <div className="flex-1 h-px bg-[#E8DDD4]/60" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
interface GroupChatProps {
  conversationIdProp?: string;
}

const GroupChat = ({ conversationIdProp }: GroupChatProps = {}) => {
  const params = useParams();
  const conversationId = conversationIdProp || (params.conversationId as string | undefined);
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupCity, setGroupCity] = useState("");
  const [matchWeek, setMatchWeek] = useState("");
  const [groupId, setGroupId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [viewingImages, setViewingImages] = useState<Array<{ url: string; type: string; size?: number }> | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [showCustomPoll, setShowCustomPoll] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptions, setCustomOptions] = useState(["", ""]);
  const [customMultipleChoice, setCustomMultipleChoice] = useState(false);
  const [pollsExpanded, setPollsExpanded] = useState(true);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [actionSheetMsg, setActionSheetMsg] = useState<Message | null>(null);

  // ── Refs ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const pollChannelRef = useRef<RealtimeChannel | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // ── Fetch chat data ──
  const fetchChatData = useCallback(async () => {
    if (!conversationId || !user) return;
    try {
      setLoading(true);
      let conversation = await getGroupConversation(conversationId);
      if (!conversation) {
        await new Promise(r => setTimeout(r, 1000));
        conversation = await getGroupConversation(conversationId);
      }
      if (!conversation) { navigate("/matches"); return; }

      const messagesData = await getGroupMessages(conversationId, 100);
      if (messagesData) setMessages(messagesData);
      setGroupId(conversation.group_id);

      const [groupData, membersData] = await Promise.all([
        getGroupInfo(conversation.group_id),
        getGroupMembers(conversation.group_id),
      ]);

      if (membersData && (membersData as any[]).length > 0) {
        const memberUserIds = (membersData as any[]).map((m: any) => m.user_id);
        const [profiles, prefs] = await Promise.all([
          Promise.all(memberUserIds.map((id: string) => getPublicProfile(id))),
          Promise.all(memberUserIds.map((id: string) => getPublicPreferences(id))),
        ]);

        const memberProfiles = memberUserIds.map((uid: string, i: number) => {
          const p = profiles[i];
          const pr = prefs[i] as any;
          const interests = [
            ...(pr?.interests || []), ...(pr?.other_interests || []),
            ...(pr?.sports || []), ...(pr?.social_style || []),
            ...(pr?.culture_interests || []), ...(pr?.lifestyle || []),
          ].filter(Boolean).slice(0, 6) as string[];
          return {
            user_id: uid,
            full_name: p?.full_name || null,
            avatar_url: p?.avatar_url || null,
            city: p?.city || null,
            specialty: pr?.specialty || null,
            interests: interests.length > 0 ? interests : undefined,
          };
        });
        setMembers(memberProfiles);

        if (groupData) {
          const cities = [...new Set(memberProfiles.map((m: any) => m.city).filter(Boolean))];
          setGroupCity(cities[0] || "Berlin");
          if (groupData.match_week) {
            try {
              const d = new Date(groupData.match_week);
              const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              setMatchWeek(days[d.getDay()]);
              setGroupName(groupData.name || `${days[d.getDay()]} Group`);
            } catch { setGroupName("Your Group"); }
          } else {
            setGroupName(groupData.name || "Your Group");
          }
        }
      } else if (groupData) {
        setGroupName(groupData.name || "Your Group");
      }
    } catch (err) {
      console.error("Error fetching chat data:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, navigate]);

  useEffect(() => { fetchChatData(); }, [conversationId, user]); // eslint-disable-line

  // ── Realtime: messages ──
  useEffect(() => {
    if (!conversationId) return;
    if (channelRef.current) {
      try { channelRef.current.unsubscribe(); getSupabaseClient().removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    try {
      const ch = getSupabaseClient()
        .channel(`group_messages:${conversationId}`, { config: { broadcast: { self: false } } })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "group_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as Message) : m));
        });
      ch.subscribe(s => { if (s === "SUBSCRIBED") channelRef.current = ch; });
    } catch {}
    return () => {
      if (channelRef.current) { try { channelRef.current.unsubscribe(); getSupabaseClient().removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    };
  }, [conversationId]);

  // ── Scroll to bottom ──
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: messages.length < 15 ? "auto" : "smooth" }));
    }
  }, [messages.length]);

  // ── Polls ──
  const fetchPolls = useCallback(async () => {
    if (!conversationId || !user) return;
    try { setPolls(await getPolls(conversationId, user.id)); } catch {}
  }, [conversationId, user]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  useEffect(() => {
    if (!conversationId || !user) return;
    if (pollChannelRef.current) { try { pollChannelRef.current.unsubscribe(); getSupabaseClient().removeChannel(pollChannelRef.current); } catch {} pollChannelRef.current = null; }
    try {
      const ch = getSupabaseClient()
        .channel(`polls:${conversationId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `conversation_id=eq.${conversationId}` }, () => fetchPolls())
        .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => fetchPolls());
      ch.subscribe(s => { if (s === "SUBSCRIBED") pollChannelRef.current = ch; });
    } catch {}
    return () => {
      if (pollChannelRef.current) { try { pollChannelRef.current.unsubscribe(); getSupabaseClient().removeChannel(pollChannelRef.current); } catch {} pollChannelRef.current = null; }
    };
  }, [conversationId, user, fetchPolls]);

  // ── Image handling ──
  const processImageFiles = (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith('image/')).slice(0, 5 - selectedImages.length);
    return imgs.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: `${f.name} exceeds 10 MB`, variant: "destructive" }); return false; }
      return true;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valid = processImageFiles(Array.from(e.target.files || []));
    if (!valid.length) return;
    setSelectedImages(prev => [...prev, ...valid]);
    valid.forEach(f => { const r = new FileReader(); r.onloadend = () => setImagePreviews(p => [...p, r.result as string]); r.readAsDataURL(f); });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const valid = processImageFiles(Array.from(e.dataTransfer.files));
    if (!valid.length) return;
    setSelectedImages(prev => [...prev, ...valid]);
    valid.forEach(f => { const r = new FileReader(); r.onloadend = () => setImagePreviews(p => [...p, r.result as string]); r.readAsDataURL(f); });
  };

  const removeImage = (i: number) => { setSelectedImages(p => p.filter((_, x) => x !== i)); setImagePreviews(p => p.filter((_, x) => x !== i)); };

  // ── Send message ──
  const handleSend = async (directMessage?: string) => {
    const text = (directMessage ?? input).trim();
    if (!text && selectedImages.length === 0) return;
    if (!user || !conversationId) return;

    setInput("");
    const imgs = [...selectedImages]; const previews = [...imagePreviews];
    setSelectedImages([]); setImagePreviews([]);
    setUploadingImages(true);

    try {
      const hasImages = imgs.length > 0;
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempMediaUrls = hasImages ? previews.map((p, i) => ({ url: p, type: imgs[i]?.type || 'image/jpeg', size: imgs[i]?.size || 0 })) : undefined;

      const optimistic: Message = {
        id: tempId, sender_id: user.id, content: text || '', created_at: new Date().toISOString(),
        read_at: null, is_deleted: false,
        ...(hasImages ? { media_urls: tempMediaUrls, has_media: true, media_type: 'image' } : {}),
      };
      setMessages(prev => [...prev, optimistic]);

      const real = await sendGroupMessage({
        group_conversation_id: conversationId, sender_id: user.id, content: text || '',
        ...(hasImages ? { media_urls: tempMediaUrls, has_media: true, media_type: 'image' } : {}),
      });

      if (!real) { setMessages(prev => prev.filter(m => m.id !== tempId)); throw new Error("Send failed"); }
      setMessages(prev => prev.map(m => m.id === tempId ? real : m));

      // Background image upload
      if (hasImages && real.id) {
        (async () => {
          try {
            const compressed = await compressImages(imgs);
            const urls = await uploadPhotos('message-media', compressed, user.id);
            const final = compressed.map((f, i) => ({ url: urls[i] || previews[i] || '', type: f.type || 'image/jpeg', size: f.size || 0 }));
            await updateGroupMessageMedia(real.id, final);
            setMessages(prev => prev.map(m => m.id === real.id ? { ...m, media_urls: final } : m));
          } catch {} finally { setUploadingImages(false); }
        })();
      }
    } catch (err) {
      setInput(text); setSelectedImages(imgs); setImagePreviews(previews);
      toast({ title: "Couldn't send", description: "Please try again.", variant: "destructive" });
    } finally {
      if (imgs.length === 0) setUploadingImages(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── Edit / Delete ──
  const handleStartEdit = (msg: Message) => { setEditingMessageId(msg.id); setEditContent(msg.content); setTimeout(() => editInputRef.current?.focus(), 0); };
  const handleCancelEdit = () => { setEditingMessageId(null); setEditContent(""); };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !user || !editContent.trim()) return;
    const orig = messages.find(m => m.id === editingMessageId);
    if (!orig) return;
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editContent.trim(), edited_at: new Date().toISOString() } : m));
    setEditingMessageId(null); setEditContent("");
    try {
      if (!await editGroupMessage(editingMessageId, user.id, editContent.trim())) {
        setMessages(prev => prev.map(m => m.id === editingMessageId ? orig : m));
        toast({ title: "Error", description: "Could not edit message", variant: "destructive" });
      }
    } catch { setMessages(prev => prev.map(m => m.id === editingMessageId ? orig : m)); }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    const orig = messages.find(m => m.id === messageId);
    if (!orig) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
    try {
      if (!await deleteGroupMessage(messageId, user.id)) {
        setMessages(prev => prev.map(m => m.id === messageId ? orig : m));
        toast({ title: "Error", description: "Could not delete message", variant: "destructive" });
      }
    } catch { setMessages(prev => prev.map(m => m.id === messageId ? orig : m)); }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
    else if (e.key === "Escape") handleCancelEdit();
  };

  // ── Poll creation ──
  const handleCreatePoll = async (pollType: 'day' | 'time' | 'activity') => {
    if (!conversationId || !user) return;
    const templates = getPollTemplates(t as any);
    const tpl = templates[pollType];
    try {
      const poll = await createPoll({ conversation_id: conversationId, creator_id: user.id, poll_type: pollType, question: tpl.question, options: tpl.options, is_multiple_choice: false });
      if (poll) {
        const emoji = pollType === 'day' ? '📅' : pollType === 'time' ? '⏰' : '☕';
        await sendGroupMessage({ group_conversation_id: conversationId, sender_id: user.id, content: `${emoji} Poll created: "${tpl.question}"` });
        fetchPolls(); setShowPlanPanel(false);
        toast({ title: "Poll created", description: "Your group can now vote." });
      }
    } catch { toast({ title: "Error", description: "Could not create poll", variant: "destructive" }); }
  };

  const handleCreateCustomPoll = async () => {
    if (!conversationId || !user) return;
    const q = customQuestion.trim();
    const opts = customOptions.map(o => o.trim()).filter(Boolean);
    if (!q) { toast({ title: "Enter a question", variant: "destructive" }); return; }
    if (opts.length < 2) { toast({ title: "Add at least 2 options", variant: "destructive" }); return; }
    try {
      const poll = await createPoll({ conversation_id: conversationId, creator_id: user.id, poll_type: 'custom', question: q, options: opts.map(t => ({ text: t })), is_multiple_choice: customMultipleChoice });
      if (poll) {
        await sendGroupMessage({ group_conversation_id: conversationId, sender_id: user.id, content: `📊 Poll created: "${q}"` });
        fetchPolls(); setShowCustomPoll(false); setShowPlanPanel(false);
        setCustomQuestion(""); setCustomOptions(["", ""]); setCustomMultipleChoice(false);
      }
    } catch { toast({ title: "Error", description: "Could not create poll", variant: "destructive" }); }
  };

  // ── AI suggestion ──
  const handleAIPlace = async () => {
    if (!conversationId || !user || aiLoading) return;
    setAiLoading(true);
    try {
      const city = members.find(m => m.city)?.city || "Berlin";
      const res = await getSupabaseClient().functions.invoke("generate-place-suggestions", {
        body: { city, memberNames: members.filter(m => m.full_name).map(m => m.full_name), specialties: members.filter(m => m.specialty).map(m => m.specialty), chatContext: messages.slice(-5).map(m => m.content).join(" ").slice(0, 500) },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.message) {
        await sendGroupMessage({ group_conversation_id: conversationId, sender_id: user.id, content: `🤖 AI Place Recommendations:\n\n${res.data.message}` });
      }
    } catch (err) {
      toast({ title: "Couldn't get suggestions", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally { setAiLoading(false); }
  };

  const getMemberInfo = (uid: string): Member => members.find(m => m.user_id === uid) || { user_id: uid, full_name: null, avatar_url: null };

  // ── Computed ──
  const activePolls = polls.filter(p => !p.is_closed);
  const closedPolls = polls.filter(p => p.is_closed);
  const visibleMessages = messages.filter(m => !m.is_deleted || m.sender_id === user?.id);

  // ── Meetup status text ──
  const statusText = useMemo(() => {
    if (!matchWeek) return "Group chat";
    const now = new Date();
    const weekStart = new Date(matchWeek);
    const diff = Math.ceil((weekStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff <= 7) return `Meetup in ${diff} day${diff > 1 ? 's' : ''}`;
    if (diff === 0) return "Meetup today";
    return "Match revealed";
  }, [matchWeek]);

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F2EE] flex flex-col">
        <div className="border-b border-[#E8DDD4] p-4 bg-white/80">
          <Skeleton className="h-10 w-48 bg-[#E8DDD4]" />
        </div>
        <div className="flex-1 p-5 space-y-5">
          <Skeleton className="h-14 w-2/3 rounded-[18px] bg-[#E8DDD4]/60" />
          <Skeleton className="h-14 w-1/2 ml-auto rounded-[18px] bg-[#E8DDD4]/60" />
          <Skeleton className="h-14 w-3/4 rounded-[18px] bg-[#E8DDD4]/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EE] flex flex-col relative">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8DDD4]/60 shadow-[0_1px_8px_rgba(58,11,34,0.04)] pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => navigate("/matches")}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-[#F6F1EC] hover:bg-[#EDE5DD] transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-[#3A0B22]" />
          </button>

          {/* Title block */}
          <div className="flex-1 min-w-0" onClick={() => setGroupDetailsOpen(true)}>
            <h1 className="font-heading text-[16px] font-semibold text-[#3A0B22] truncate">
              {groupCity} · {groupName}
            </h1>
            <p className="text-[11px] text-[#3A0B22]/45 font-medium">{statusText}</p>
          </div>

          {/* Member avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map(m => (
              <Avatar key={m.user_id} className="h-8 w-8 border-2 border-white shadow-sm" onClick={() => navigate(`/u/${m.user_id}`)}>
                <AvatarImage src={m.avatar_url || undefined} />
                <AvatarFallback className="bg-[#4B0F2D] text-white text-[9px] font-semibold">{getInitials(m.full_name)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-[#F6F1EC] border-2 border-white flex items-center justify-center text-[10px] font-semibold text-[#3A0B22]/60">
                +{members.length - 4}
              </div>
            )}
          </div>

          {/* Overflow */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-[#F6F1EC] transition-colors">
                <MoreVertical className="h-4.5 w-4.5 text-[#3A0B22]/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E8DDD4]">
              <DropdownMenuItem onClick={() => setGroupDetailsOpen(true)} className="gap-2 text-[13px]">
                <Users className="h-3.5 w-3.5" /> Group details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAIPlace} disabled={aiLoading} className="gap-2 text-[13px]">
                <Sparkles className="h-3.5 w-3.5" /> AI place suggestions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-[13px] text-[#3A0B22]/50">
                <Shield className="h-3.5 w-3.5" /> Community standards
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-[13px] text-[#3A0B22]/50">
                <Flag className="h-3.5 w-3.5" /> Report an issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Active Polls Section (above messages) ─── */}
      {activePolls.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-[#E8DDD4]/40 px-4 py-3">
          <button
            onClick={() => setPollsExpanded(!pollsExpanded)}
            className="flex items-center gap-2 w-full"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#F27C5C]" />
            <span className="text-[12px] font-semibold text-[#3A0B22]/60 uppercase tracking-wider">
              Active polls ({activePolls.length})
            </span>
            {pollsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-[#3A0B22]/30 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 text-[#3A0B22]/30 ml-auto" />}
          </button>
          {pollsExpanded && (
            <div className="mt-2 space-y-3 overflow-x-auto pb-1">
              {activePolls.map(poll => (
                <PollCard key={poll.id} poll={poll} userId={user?.id || ''} onVoteChange={fetchPolls} isOwn={poll.creator_id === user?.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Messages ─── */}
      <div
        className="flex-1 overflow-y-auto"
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-[#F27C5C]/10 border-2 border-dashed border-[#F27C5C] rounded-xl flex items-center justify-center z-30 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[#F27C5C]" />
              <p className="text-sm font-semibold text-[#F27C5C]">Drop images here</p>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 py-5">
          {visibleMessages.length === 0 && polls.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-[#F6F1EC] flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-[#3A0B22]/25" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-[#3A0B22] mb-1.5">
                Start the conversation
              </h3>
              <p className="text-[13px] text-[#3A0B22]/50 max-w-[260px] leading-relaxed mb-6">
                Say hello to your group. Everyone here is a verified physician — no small talk required.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Hi everyone! Looking forward to meeting.", "When works best for everyone this weekend?", "Any neighborhood preferences?"].map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(msg)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium bg-white border border-[#E8DDD4] text-[#3A0B22] hover:border-[#F27C5C]/40 hover:bg-[#FFF8F5] transition-all active:scale-[0.97]"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages list ── */
            <>
              {visibleMessages.map((msg, idx) => {
                const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                const isConsecutive = !!(prevMsg && prevMsg.sender_id === msg.sender_id && !prevMsg.is_deleted &&
                  new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);
                const showDate = shouldShowDateSeparator(msg.created_at, prevMsg?.created_at || null);

                return (
                  <div key={msg.id}>
                    {showDate && <DateSeparator date={msg.created_at} />}
                    <MessageItem
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                      sender={getMemberInfo(msg.sender_id)}
                      isConsecutive={isConsecutive}
                      editingMessageId={editingMessageId}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      handleStartEdit={handleStartEdit}
                      handleSaveEdit={handleSaveEdit}
                      handleCancelEdit={handleCancelEdit}
                      handleDeleteMessage={handleDeleteMessage}
                      handleEditKeyPress={handleEditKeyPress}
                      editInputRef={editInputRef}
                      setViewingImages={setViewingImages}
                      setViewingImageIndex={setViewingImageIndex}
                      onLongPress={setActionSheetMsg}
                    />
                  </div>
                );
              })}

              {/* Closed polls at bottom */}
              {closedPolls.length > 0 && (
                <div className="mt-6 mb-2">
                  <p className="text-[11px] font-medium text-[#3A0B22]/30 uppercase tracking-wider text-center mb-3">Closed polls</p>
                  {closedPolls.map(p => (
                    <PollCard key={p.id} poll={p} userId={user?.id || ''} onVoteChange={fetchPolls} isOwn={p.creator_id === user?.id} />
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Editing bar ─── */}
      {editingMessageId && (
        <div className="bg-[#FFF8F5] border-t border-[#F27C5C]/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-[#F27C5C]" />
            <span className="text-[12px] font-medium text-[#F27C5C]">Editing message</span>
          </div>
          <button onClick={handleCancelEdit} className="text-[12px] font-medium text-[#3A0B22]/50 hover:text-[#3A0B22]">Cancel</button>
        </div>
      )}

      {/* ─── Composer ─── */}
      <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md border-t border-[#E8DDD4]/60 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {/* Plan panel */}
        {showPlanPanel && (
          <div className="mb-3 p-4 rounded-[18px] bg-[#FDFAF7] border border-[#E8DDD4] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#3A0B22]/50 uppercase tracking-wider flex items-center gap-1.5">
                <Vote className="h-3.5 w-3.5" /> Plan your meetup
              </span>
              <button onClick={() => { setShowPlanPanel(false); setShowCustomPoll(false); }}>
                <X className="h-4 w-4 text-[#3A0B22]/30" />
              </button>
            </div>

            {!showCustomPoll ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {([
                    { type: 'day' as const, icon: Calendar, label: "Pick Day", desc: "Which day works best?" },
                    { type: 'time' as const, icon: Clock, label: "Pick Time", desc: "What time feels easiest?" },
                    { type: 'activity' as const, icon: Coffee, label: "Activity", desc: "What kind of meetup?" },
                  ]).map(item => (
                    <button
                      key={item.type}
                      onClick={() => handleCreatePoll(item.type)}
                      className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-white border border-[#E8DDD4]/60 hover:border-[#F27C5C]/30 transition-all active:scale-[0.97] text-left"
                    >
                      <item.icon className="h-4.5 w-4.5 text-[#F27C5C]" />
                      <span className="text-[12px] font-semibold text-[#3A0B22]">{item.label}</span>
                      <span className="text-[10px] text-[#3A0B22]/40 leading-tight">{item.desc}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomPoll(true)}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-white border border-[#E8DDD4]/60 hover:border-[#F27C5C]/30 transition-all active:scale-[0.97] text-left"
                  >
                    <BarChart3 className="h-4.5 w-4.5 text-[#F27C5C]" />
                    <span className="text-[12px] font-semibold text-[#3A0B22]">Custom Poll</span>
                    <span className="text-[10px] text-[#3A0B22]/40 leading-tight">Ask anything</span>
                  </button>
                </div>
                {/* AI suggestion */}
                <button
                  onClick={() => { handleAIPlace(); setShowPlanPanel(false); }}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#F27C5C]/8 border border-[#F27C5C]/15 hover:bg-[#F27C5C]/12 transition-all active:scale-[0.98]"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#F27C5C]" /> : <Sparkles className="h-4 w-4 text-[#F27C5C]" />}
                  <span className="text-[13px] font-medium text-[#F27C5C]">AI Place Suggestions</span>
                </button>
              </>
            ) : (
              /* Custom poll builder */
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#3A0B22] flex items-center gap-1.5">
                    <PenLine className="h-3.5 w-3.5 text-[#F27C5C]" /> Create Poll
                  </span>
                  <button onClick={() => { setShowCustomPoll(false); setCustomQuestion(""); setCustomOptions(["", ""]); }} className="text-[11px] text-[#3A0B22]/40">Back</button>
                </div>
                <Input
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="Your question..."
                  className="h-10 rounded-xl text-[13px] bg-white border-[#E8DDD4] focus-visible:ring-[#F27C5C]/30"
                />
                <div className="space-y-2">
                  {customOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-[#3A0B22]/30 w-4 text-center">{i + 1}</span>
                      <Input
                        value={opt}
                        onChange={e => { const u = [...customOptions]; u[i] = e.target.value; setCustomOptions(u); }}
                        placeholder={`Option ${i + 1}`}
                        className="h-9 rounded-xl text-[13px] bg-white border-[#E8DDD4] flex-1"
                      />
                      {customOptions.length > 2 && (
                        <button onClick={() => setCustomOptions(customOptions.filter((_, x) => x !== i))}>
                          <X className="h-3.5 w-3.5 text-[#3A0B22]/25" />
                        </button>
                      )}
                    </div>
                  ))}
                  {customOptions.length < 6 && (
                    <button onClick={() => setCustomOptions([...customOptions, ""])} className="flex items-center gap-1 text-[11px] text-[#F27C5C] ml-6">
                      <Plus className="h-3 w-3" /> Add option
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={customMultipleChoice} onCheckedChange={c => setCustomMultipleChoice(c === true)} />
                    <span className="text-[11px] text-[#3A0B22]/50">Multiple choice</span>
                  </label>
                  <Button onClick={handleCreateCustomPoll} size="sm" className="rounded-full px-5 bg-[#F27C5C] hover:bg-[#E8654A] text-white text-[12px] h-9">
                    <Check className="h-3.5 w-3.5 mr-1" /> Create
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {imagePreviews.map((p, i) => (
              <div key={i} className="relative flex-shrink-0 group">
                <img src={p} alt="" className="h-20 w-20 object-cover rounded-xl border border-[#E8DDD4]" />
                <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2.5 max-w-lg mx-auto">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-[#F6F1EC] hover:bg-[#EDE5DD] transition-colors flex-shrink-0 active:scale-95"
            disabled={selectedImages.length >= 5}
          >
            <ImageIcon className="h-[18px] w-[18px] text-[#3A0B22]/40" />
          </button>

          <button
            onClick={() => setShowPlanPanel(!showPlanPanel)}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors flex-shrink-0 active:scale-95 ${
              showPlanPanel ? "bg-[#F27C5C]/10 border border-[#F27C5C]/20" : "bg-[#F6F1EC] hover:bg-[#EDE5DD]"
            }`}
          >
            <Vote className="h-[18px] w-[18px] text-[#3A0B22]/40" />
          </button>

          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full h-11 px-5 bg-[#F6F1EC] border-[#E8DDD4]/60 text-[14px] text-[#3A0B22] placeholder:text-[#3A0B22]/30 focus-visible:ring-[#F27C5C]/30 focus-visible:border-[#F27C5C]/30"
          />

          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && selectedImages.length === 0) || uploadingImages}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-[#F27C5C] hover:bg-[#E8654A] text-white shadow-[0_2px_12px_rgba(242,124,92,0.3)] transition-all disabled:opacity-40 disabled:shadow-none flex-shrink-0 active:scale-95"
          >
            {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ─── Group Details Sheet ─── */}
      <Sheet open={groupDetailsOpen} onOpenChange={setGroupDetailsOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-t-0 bg-[#FDFAF7] max-h-[80vh]">
          <SheetHeader className="pb-4 border-b border-[#E8DDD4]/60">
            <SheetTitle className="font-heading text-[18px] text-[#3A0B22]">{groupCity} · {groupName}</SheetTitle>
            <SheetDescription className="text-[13px] text-[#3A0B22]/50">{members.length} physicians · {statusText}</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-3 overflow-y-auto max-h-[50vh]">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/80 transition-colors cursor-pointer" onClick={() => { setGroupDetailsOpen(false); navigate(`/u/${m.user_id}`); }}>
                <Avatar className="h-11 w-11 border border-[#E8DDD4]">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#4B0F2D] text-white text-[11px] font-semibold">{getInitials(m.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#3A0B22] truncate">{m.full_name || "Anonymous"}</p>
                  <p className="text-[12px] text-[#3A0B22]/45 truncate">{m.specialty || "Physician"}{m.city ? ` · ${m.city}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[#E8DDD4]/60 space-y-2">
            <button className="w-full flex items-center gap-2.5 p-3 rounded-xl text-[13px] text-[#3A0B22]/50 hover:bg-white/80 transition-colors">
              <AlertCircle className="h-4 w-4" /> No-show support
            </button>
            <button className="w-full flex items-center gap-2.5 p-3 rounded-xl text-[13px] text-[#3A0B22]/50 hover:bg-white/80 transition-colors">
              <Flag className="h-4 w-4" /> Report an issue
            </button>
            <button className="w-full flex items-center gap-2.5 p-3 rounded-xl text-[13px] text-[#3A0B22]/50 hover:bg-white/80 transition-colors">
              <Shield className="h-4 w-4" /> Community standards
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Long-press Action Sheet (mobile) ─── */}
      <Sheet open={!!actionSheetMsg} onOpenChange={v => !v && setActionSheetMsg(null)}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-t-0 bg-[#FDFAF7]">
          <SheetHeader className="sr-only"><SheetTitle>Message actions</SheetTitle><SheetDescription>Choose an action</SheetDescription></SheetHeader>
          {actionSheetMsg && (
            <div className="py-2 space-y-1">
              <button
                onClick={() => { handleStartEdit(actionSheetMsg); setActionSheetMsg(null); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/80 transition-colors text-left"
              >
                <Pencil className="h-4 w-4 text-[#3A0B22]/50" />
                <span className="text-[14px] text-[#3A0B22]">Edit message</span>
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(actionSheetMsg.content); setActionSheetMsg(null); toast({ title: "Copied" }); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/80 transition-colors text-left"
              >
                <Copy className="h-4 w-4 text-[#3A0B22]/50" />
                <span className="text-[14px] text-[#3A0B22]">Copy text</span>
              </button>
              <div className="h-px bg-[#E8DDD4]/60 my-1" />
              <button
                onClick={() => { handleDeleteMessage(actionSheetMsg.id); setActionSheetMsg(null); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="text-[14px] text-red-600">Delete message</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Image Viewer ─── */}
      {viewingImages && (
        <ImageViewer
          images={viewingImages}
          currentIndex={viewingImageIndex}
          isOpen={!!viewingImages}
          onClose={() => setViewingImages(null)}
        />
      )}
    </div>
  );
};

export default GroupChat;
