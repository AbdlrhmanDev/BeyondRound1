'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Star, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { searchUsers, addGroupMember } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  groupId: string;
  groupName: string;
  currentCount: number;
  maxMembers?: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AdminAddMemberModal({
  open, groupId, groupName, currentCount, maxMembers = 5, onClose, onAdded,
}: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setReason('');
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(query);
      setResults(data);
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    const result = await addGroupMember(groupId, selected.user_id, reason || undefined);
    setAdding(false);

    if (result.success) {
      toast({ title: 'Member added', description: `${selected.full_name} added as pending. Approve in the members list.` });
      onAdded();
      onClose();
    } else {
      const msg: Record<string, string> = {
        group_at_capacity: 'Group is already at capacity (5 members).',
        already_member: 'This user is already in this group.',
        forbidden: 'You do not have permission to do this.',
        group_not_found: 'Group not found.',
      };
      toast({ title: 'Could not add member', description: msg[result.error!] ?? result.error, variant: 'destructive' });
    }
  };

  const spotsLeft = maxMembers - currentCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Member to {groupName || 'Group'}
          </DialogTitle>
        </DialogHeader>

        {/* Capacity warning */}
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
          spotsLeft <= 1 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-muted text-muted-foreground'
        }`}>
          {spotsLeft <= 1 && <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{currentCount}/{maxMembers} members · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results list */}
        {results.length > 0 && !selected && (
          <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
            {results.map((user) => (
              <button
                key={user.user_id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                onClick={() => setSelected(user)}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.full_name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.city || '—'}</p>
                </div>
                {user.score !== null ? (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {user.score}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">No score</span>
                )}
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && !selected && (
          <p className="text-sm text-muted-foreground text-center py-2">No users found</p>
        )}

        {/* Selected user confirmation */}
        {selected && (
          <div className="border rounded-lg p-3 bg-muted/40 flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={selected.avatar_url || undefined} />
              <AvatarFallback>{selected.full_name?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{selected.full_name}</p>
              <p className="text-xs text-muted-foreground">{selected.city || '—'}</p>
            </div>
            {selected.score !== null ? (
              <span className="flex items-center gap-0.5 text-sm font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {selected.score}
                <span className="text-xs text-muted-foreground ml-1">({selected.score_count} ratings)</span>
              </span>
            ) : (
              <Badge variant="secondary" className="text-xs">No score yet</Badge>
            )}
            <button
              className="text-xs text-muted-foreground underline ml-2"
              onClick={() => { setSelected(null); setQuery(''); }}
            >
              Change
            </button>
          </div>
        )}

        {/* Optional reason */}
        {selected && (
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="resize-none"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Membership will be <strong>pending</strong> until you approve it in the group detail.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adding}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selected || adding}>
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Add & Pending Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
