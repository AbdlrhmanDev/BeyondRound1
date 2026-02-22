'use client';

import { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, Users, Calendar, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type:
    | 'match'
    | 'match_accepted'
    | 'match_rejected'
    | 'group_invite'
    | 'group_message'
    | 'message'
    | 'event'
    | 'welcome'
    | 'system';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "group_message.title" → "Group message" */
function humanizeKey(key: string): string {
  const part = (key.split('.')[0] ?? key).replace(/_/g, ' ');
  return part.charAt(0).toUpperCase() + part.slice(1);
}

// ─── Icon chip ────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: Notification['type'] }) {
  const plum = { color: '#3A0B22' };
  const coral = { color: '#F27C5C' };
  const chip = 'w-10 h-10 rounded-full flex items-center justify-center shrink-0';

  switch (type) {
    case 'match':
    case 'match_accepted':
      return (
        <div className={chip} style={{ background: 'rgba(58,11,34,0.07)' }}>
          <Users className="h-[18px] w-[18px]" style={plum} />
        </div>
      );
    case 'group_invite':
    case 'group_message':
    case 'message':
      return (
        <div className={chip} style={{ background: 'rgba(242,124,92,0.10)' }}>
          <MessageCircle className="h-[18px] w-[18px]" style={coral} />
        </div>
      );
    case 'event':
      return (
        <div className={chip} style={{ background: 'rgba(58,11,34,0.07)' }}>
          <Calendar className="h-[18px] w-[18px]" style={plum} />
        </div>
      );
    case 'welcome':
      return (
        <div className={chip} style={{ background: 'rgba(242,124,92,0.10)' }}>
          <Sparkles className="h-[18px] w-[18px]" style={coral} />
        </div>
      );
    default:
      return (
        <div className={chip} style={{ background: 'rgba(58,11,34,0.07)' }}>
          <Heart className="h-[18px] w-[18px]" style={plum} />
        </div>
      );
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-4 py-3.5 animate-pulse">
      <div
        className="w-10 h-10 rounded-full shrink-0"
        style={{ background: 'rgba(58,11,34,0.07)' }}
      />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 rounded-full w-2/3" style={{ background: 'rgba(58,11,34,0.07)' }} />
        <div className="h-2.5 rounded-full w-full" style={{ background: 'rgba(58,11,34,0.05)' }} />
        <div className="h-2 rounded-full w-1/4" style={{ background: 'rgba(58,11,34,0.04)' }} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const NotificationPopover = () => {
  const { t, i18n } = useTranslation('notifications');
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── tSafe: never shows raw i18n keys to users ──────────────────────────────
  const tSafe = useCallback(
    (key: string, fallback: string, vars?: Record<string, string>): string => {
      const result = String(t(key, (vars ?? {}) as Record<string, string>));
      if (result === key) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Notifications] Missing i18n key: "${key}" (ns: notifications)`);
        }
        return fallback;
      }
      return result;
    },
    [t],
  );

  // ── Data ───────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setNotifications((data || []) as Notification[]);

      if ((!data || data.length === 0) && user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: existingWelcome } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'welcome')
            .maybeSingle();

          if (!existingWelcome) {
            const { data: newNotif } = await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'welcome',
                title: 'welcome.title',
                message: 'welcome.message',
                link: '/profile',
                metadata: {},
              })
              .select()
              .single();

            if (newNotif) setNotifications([newNotif as Notification]);
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    try {
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel(`notifications-${user.id}`, {
          config: { broadcast: { self: false }, presence: { key: user.id } },
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            try {
              setNotifications((prev) => {
                const exists = prev.some((n) => n.id === (payload.new as Notification).id);
                return exists ? prev : [payload.new as Notification, ...prev];
              });
            } catch { /* silent */ }
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            try {
              setNotifications((prev) =>
                prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n)),
              );
            } catch { /* silent */ }
          },
        );

      try {
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') channelRef.current = channel;
        });
      } catch { /* silent */ }
    } catch { /* silent */ }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        getSupabaseClient().removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayNotifications = useMemo(
    () => notifications.filter((n, i, self) => i === self.findIndex((x) => x.id === n.id)),
    [notifications],
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    try {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await getSupabaseClient()
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  // ── Display helpers ────────────────────────────────────────────────────────
  const formatTime = (dateString: string): string => {
    try {
      const locale = i18n.language === 'de' ? de : undefined;
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
    } catch {
      return tSafe('recently', 'Recently');
    }
  };

  const getDisplayTitle = (notif: Notification): string => {
    const raw = notif.title ?? '';
    const meta = (notif.metadata || {}) as Record<string, string>;

    // Looks like an i18n key (no spaces, has a dot)
    if (raw && !raw.includes(' ') && raw.includes('.')) {
      const key = raw.startsWith('notifications.') ? raw.slice('notifications.'.length) : raw;
      return tSafe(key, humanizeKey(key), meta);
    }

    // Legacy English text stored directly in DB
    const legacyMap: Record<string, string> = {
      'New Group Message': 'group_message.title',
      'New Message': 'message.title',
      'New Connection Request': 'match.title',
      'Connection Accepted!': 'match_accepted.title',
      'New Member Joined': 'group_invite.title',
      'Welcome to BeyondRounds!': 'welcome.title',
    };
    const key = legacyMap[raw];
    if (key) return tSafe(key, raw, meta);

    return raw || tSafe('heading', 'Notification');
  };

  const getDisplayMessage = (notif: Notification): string => {
    const raw = notif.message ?? '';
    const meta = { ...(notif.metadata || {}) } as Record<string, string>;
    const type = notif.type;

    // Looks like an i18n key
    if (raw && !raw.includes(' ') && raw.includes('.')) {
      const key = raw.startsWith('notifications.') ? raw.slice('notifications.'.length) : raw;
      return tSafe(key, '', meta);
    }

    // Extract from_user_name from legacy English message patterns
    if (!meta.from_user_name && raw) {
      const patterns: Array<[RegExp, (m: RegExpMatchArray) => void]> = [
        [/^(.+?)\s+sent a message in the group\.?$/i, (m) => { meta.from_user_name = m[1].trim(); }],
        [/^(.+?)\s+sent you a message\.?$/i, (m) => { meta.from_user_name = m[1].trim(); }],
        [/You have a new connection request from\s+(.+?)\.?$/i, (m) => { meta.from_user_name = m[1].trim(); }],
        [/^(.+?)\s+accepted your connection request\.?$/i, (m) => { meta.from_user_name = m[1].trim(); }],
        [/^(.+?)\s+joined\s+(.+?)\.?$/i, (m) => {
          meta.from_user_name = m[1].trim();
          if (!meta.group_name) meta.group_name = m[2].trim();
        }],
      ];
      for (const [re, apply] of patterns) {
        const m = raw.match(re);
        if (m) { apply(m); break; }
      }
    }

    const keyByType: Partial<Record<Notification['type'], string>> = {
      group_message: 'group_message.message',
      message: 'message.message',
      match: 'match.message',
      match_accepted: 'match_accepted.message',
      group_invite: 'group_invite.message',
      welcome: 'welcome.message',
    };
    const key = keyByType[type];
    if (key) return tSafe(key, raw, { ...meta, from_user_name: meta.from_user_name || 'Someone' });

    return raw;
  };

  // ── Keyboard nav within list ───────────────────────────────────────────────
  const handleListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items =
      listRef.current?.querySelectorAll<HTMLElement>('[data-notif-item]') ?? ([] as unknown as NodeListOf<HTMLElement>);
    const arr = Array.from(items);
    const idx = arr.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      arr[Math.min(idx + 1, arr.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      arr[Math.max(idx - 1, 0)]?.focus();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Custom scrollbar — injected once, scoped to .notif-scroll */}
      <style>{`
        .notif-scroll::-webkit-scrollbar { width: 3px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb {
          background: rgba(58,11,34,0.14);
          border-radius: 4px;
        }
        .notif-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(58,11,34,0.24);
        }
        .notif-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(58,11,34,0.14) transparent;
        }
      `}</style>

      <Popover open={open} onOpenChange={setOpen}>
        {/* ── Bell trigger ── */}
        <PopoverTrigger asChild>
          <button
            aria-label={tSafe('heading', 'Notifications')}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
            style={{ color: '#3A0B22' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58,11,34,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  background: '#F27C5C',
                  fontSize: '9px',
                  lineHeight: 1,
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 3px',
                }}
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        {/* ── Panel ── */}
        <PopoverContent
          role="dialog"
          aria-label={tSafe('heading', 'Notifications')}
          align="end"
          sideOffset={10}
          className="p-0 border-0 shadow-none focus:outline-none"
          style={{
            width: '340px',
            borderRadius: '20px',
            background: '#FFFFFF',
            border: '1px solid rgba(58,11,34,0.09)',
            boxShadow:
              '0 24px 64px rgba(26,10,18,0.13), 0 4px 16px rgba(26,10,18,0.06)',
            overflow: 'hidden',
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        >

          {/* ── A) Header ── */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(58,11,34,0.07)' }}
          >
            <h2
              className="font-heading font-semibold text-[15px] tracking-tight"
              style={{ color: '#1A0A12' }}
            >
              {tSafe('heading', 'Notifications')}
            </h2>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8]"
                style={{ color: '#F27C5C', background: 'rgba(242,124,92,0.09)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(242,124,92,0.16)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(242,124,92,0.09)'; }}
              >
                <Check className="h-3 w-3" />
                {tSafe('markAllRead', 'Mark all read')}
              </button>
            )}
          </div>

          {/* ── B) Scrollable list ── */}
          <div
            ref={listRef}
            className="notif-scroll overflow-y-auto"
            style={{ maxHeight: '368px', background: '#FDFAF8' }}
            onKeyDown={handleListKeyDown}
          >
            {loading ? (
              /* Skeleton */
              <div style={{ background: '#FFFFFF' }}>
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
              </div>
            ) : displayNotifications.length > 0 ? (
              /* Notification list */
              <div style={{ background: '#FFFFFF' }}>
                {displayNotifications.map((notif, idx) => {
                  const title = getDisplayTitle(notif);
                  const message = getDisplayMessage(notif);
                  const isUnread = !notif.read;

                  return (
                    <div
                      key={notif.id}
                      data-notif-item
                      role="button"
                      tabIndex={0}
                      onClick={() => handleClick(notif)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClick(notif);
                        }
                      }}
                      className={cn(
                        'flex gap-3 px-4 py-3.5 cursor-pointer transition-colors outline-none',
                        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F6B4A8]',
                        idx !== 0 && 'border-t',
                      )}
                      style={{
                        borderColor: 'rgba(58,11,34,0.06)',
                        background: isUnread ? 'rgba(242,124,92,0.045)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = isUnread
                          ? 'rgba(242,124,92,0.08)'
                          : 'rgba(58,11,34,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = isUnread
                          ? 'rgba(242,124,92,0.045)'
                          : 'transparent';
                      }}
                    >
                      {/* Icon with unread dot */}
                      <div className="relative shrink-0 mt-0.5">
                        <NotifIcon type={notif.type} />
                        {isUnread && (
                          <span
                            className="absolute -top-[2px] -right-[2px] rounded-full border-2 border-white"
                            style={{ width: '10px', height: '10px', background: '#F27C5C' }}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] leading-snug truncate"
                          style={{
                            color: '#1A0A12',
                            fontWeight: isUnread ? 600 : 400,
                          }}
                        >
                          {title}
                        </p>

                        {message && (
                          <p
                            className="text-[12px] leading-snug line-clamp-2 mt-[3px]"
                            style={{ color: '#5E555B' }}
                          >
                            {message}
                          </p>
                        )}

                        <p
                          className="text-[10px] mt-1.5 font-medium tracking-wide"
                          style={{ color: '#9B8F8B' }}
                        >
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div
                className="flex flex-col items-center justify-center px-6 py-12 text-center"
                style={{ background: '#FFFFFF' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(58,11,34,0.05)' }}
                >
                  <Bell className="h-6 w-6" style={{ color: 'rgba(58,11,34,0.22)' }} />
                </div>
                <p
                  className="text-[13px] font-semibold mb-1.5"
                  style={{ color: '#1A0A12' }}
                >
                  {tSafe('emptyTitle', 'No new updates')}
                </p>
                <p
                  className="text-[12px] leading-relaxed max-w-[200px]"
                  style={{ color: '#9B8F8B' }}
                >
                  {tSafe('emptySub', "We'll let you know when something needs your attention.")}
                </p>
              </div>
            )}
          </div>

          {/* ── C) Footer ── */}
          <div
            className="px-5 py-3 flex items-center justify-center"
            style={{ borderTop: '1px solid rgba(58,11,34,0.07)' }}
          >
            <button
              onClick={() => { navigate('/matches'); setOpen(false); }}
              className="text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] rounded"
              style={{ color: '#F27C5C' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e06b4f'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F27C5C'; }}
            >
              {tSafe('viewAll', 'View all notifications')}
            </button>
          </div>

        </PopoverContent>
      </Popover>
    </>
  );
};

export default NotificationPopover;
