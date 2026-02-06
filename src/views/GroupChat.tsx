'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, MapPin, Sparkles, Loader2, Image as ImageIcon, X, Upload, Circle, Stethoscope, MapPin as MapPinIcon, MoreVertical, Pencil, Trash2, Check, Vote, Coffee, Calendar, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { compressImages } from "@/utils/imageCompression";
import { ImageViewer } from "@/components/ImageViewer";
import { getGroupMessages, getGroupConversation, sendGroupMessage, updateGroupMessageMedia, deleteGroupMessage, editGroupMessage, Message } from "@/services/messageService";
import { getGroupInfo, getGroupMembers } from "@/services/matchService";
import { getPublicProfile } from "@/services/profileService";
import { getPublicPreferences } from "@/services/onboardingService";
import { uploadPhotos } from "@/services/storageService";
import { GroupChatEmptyState } from "@/components/GroupChatEmptyState";
import { Poll } from "@/components/Poll";
import { createPoll, getPolls, getPollTemplates, PollWithVotes } from "@/services/pollService";

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city?: string | null;
  specialty?: string | null;
  interests?: string[];
}

const GroupChat = () => {
  const params = useParams();
  const conversationId = params.conversationId as string | undefined;
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [viewingImages, setViewingImages] = useState<Array<{ url: string; type: string; size?: number }> | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [polls, setPolls] = useState<PollWithVotes[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchChatData = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);

      // Fetch conversation and messages in parallel
      const [conversation, messagesData] = await Promise.all([
        getGroupConversation(conversationId),
        getGroupMessages(conversationId, 100),
      ]);

      if (!conversation) {
        navigate("/matches");
        return;
      }

      if (messagesData) {
        setMessages(messagesData);
      }

      setGroupId(conversation.group_id);

      // Fetch group info and members in parallel
      const [groupData, membersData] = await Promise.all([
        getGroupInfo(conversation.group_id),
        getGroupMembers(conversation.group_id),
      ]);

      if (membersData && (membersData as any[]).length > 0) {
        const memberUserIds = (membersData as any[]).map(m => m.user_id);

        // Fetch all profiles and preferences in batch using services
        const [profilesPromises, prefsPromises] = await Promise.all([
          Promise.all(memberUserIds.map(id => getPublicProfile(id))),
          Promise.all(memberUserIds.map(id => getPublicPreferences(id))),
        ]);

        // Build member profiles array
        const memberProfiles = memberUserIds.map((userId, index) => {
          const profile = profilesPromises[index];
          const prefs = prefsPromises[index] as {
            specialty?: string | null;
            interests?: string[] | null;
            other_interests?: string[] | null;
            sports?: string[] | null;
            music_preferences?: string[] | null;
            movie_preferences?: string[] | null;
            social_style?: string[] | null;
            culture_interests?: string[] | null;
            lifestyle?: string[] | null;
          } | null;

          // Combine all available interests from public preferences
          const allInterests = [
            ...(prefs?.interests || []),
            ...(prefs?.other_interests || []),
            ...(prefs?.sports || []),
            ...(prefs?.music_preferences || []),
            ...(prefs?.movie_preferences || []),
            ...(prefs?.social_style || []),
            ...(prefs?.culture_interests || []),
            ...(prefs?.lifestyle || []),
          ].filter(Boolean).slice(0, 8) as string[];

          const memberData = {
            user_id: userId,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            city: profile?.city || null,
            specialty: prefs?.specialty || null,
            interests: allInterests.length > 0 ? allInterests : undefined,
          };

          // Debug logging
          if (!memberData.full_name || !memberData.specialty) {
            console.log(`Member ${userId} data:`, {
              profile,
              prefs,
              memberData
            });
          }

          return memberData;
        });

        setMembers(memberProfiles);

        // Format group name with date and city
        if (groupData) {
          const cities = Array.from(new Set(memberProfiles.map(m => m.city).filter(Boolean)));
          const city = cities[0] || "Unknown";

          let dateStr = "";
          if (groupData.match_week) {
            try {
              const matchDate = new Date(groupData.match_week);
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const month = monthNames[matchDate.getMonth()];
              const day = matchDate.getDate();
              dateStr = `${month} ${day}`;
            } catch (e) {
              dateStr = "Unknown";
            }
          } else {
            dateStr = "Unknown";
          }

          setGroupName(`${dateStr} - ${city}`);
        }
      } else if (groupData) {
        setGroupName(groupData.name || `Group ${groupData.id.slice(0, 6)}`);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, navigate]);

  useEffect(() => {
    fetchChatData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    // Clean up existing channel before creating a new one
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        // Silently handle cleanup errors
      }
      channelRef.current = null;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`group_messages:${conversationId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            try {
              setMessages((prev) => {
                // Avoid duplicates
                const exists = prev.some(m => m.id === (payload.new as Message).id);
                if (exists) return prev;
                return [...prev, payload.new as Message];
              });
            } catch (err) {
              // Silently handle errors in message handler
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "group_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            try {
              // Update the message in the list when media URLs are added
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === payload.new.id ? (payload.new as Message) : msg
                )
              );
            } catch (err) {
              // Silently handle errors in message handler
            }
          }
        );

      // Subscribe with error handling
      try {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            channelRef.current = channel;
          }
        });
      } catch (subscribeError) {
        // Silently catch subscription errors - they're often from browser extensions
      }
    } catch (err) {
      // Silently handle channel creation errors
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          // Silently handle cleanup errors
        }
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages]);

  const processImageFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return [];
    }

    // Limit to 5 images
    const filesToAdd = imageFiles.slice(0, 5 - selectedImages.length);

    if (filesToAdd.length < imageFiles.length) {
      toast({
        title: "Too many images",
        description: "You can only send up to 5 images at once",
        variant: "destructive",
      });
    }

    // Check file sizes (max 10MB each)
    const validFiles = filesToAdd.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    return validFiles;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = processImageFiles(files);

    if (validFiles.length === 0) return;

    setSelectedImages([...selectedImages, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = processImageFiles(files);

    if (validFiles.length === 0) return;

    setSelectedImages([...selectedImages, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (directMessage?: string) => {
    const messageToSend = directMessage ?? input;
    if ((!messageToSend.trim() && selectedImages.length === 0) || !user || !conversationId) return;

    const messageContent = messageToSend.trim();
    const hasImages = selectedImages.length > 0;

    // Clear form immediately for better UX
    setInput("");
    const imagesToUpload = [...selectedImages];
    const previewsToKeep = [...imagePreviews];
    setSelectedImages([]);
    setImagePreviews([]);

    setUploadingImages(true);

    try {
      // Create temporary message with local previews for INSTANT display
      let tempMessageId: string | null = null;

      if (hasImages) {
        // Create temporary media URLs from local previews (instant display!)
        const tempMediaUrls = previewsToKeep.map((preview, index) => ({
          url: preview, // Use base64 preview for instant display
          type: imagesToUpload[index]?.type || 'image/jpeg',
          size: imagesToUpload[index]?.size || 0,
        }));

        // Add optimistic message to UI IMMEDIATELY (before DB)
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}-${Math.random()}`,
          sender_id: user.id,
          content: messageContent || '',
          created_at: new Date().toISOString(),
          read_at: null,
          media_urls: tempMediaUrls,
          has_media: true,
          media_type: 'image',
          is_deleted: false,
        };

        // Show message immediately in UI
        setMessages((prev) => [...prev, optimisticMessage]);

        // Send to database in background using service
        const messageData = await sendGroupMessage({
          group_conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent || '',
          media_urls: tempMediaUrls,
          has_media: true,
          media_type: 'image',
        });

        if (!messageData) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
          throw new Error("Failed to send message");
        }

        tempMessageId = messageData.id;

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? messageData : msg
          )
        );

      } else {
        // Text-only message - add optimistic update for instant display
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}-${Math.random()}`,
          sender_id: user.id,
          content: messageContent,
          created_at: new Date().toISOString(),
          read_at: null,
          is_deleted: false,
        };

        // Show message immediately in UI
        setMessages((prev) => [...prev, optimisticMessage]);

        // Send to database
        const messageData = await sendGroupMessage({
          group_conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent,
        });

        if (!messageData) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
          throw new Error("Failed to send message");
        }

        // Replace optimistic message with real one from database
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? messageData : msg
          )
        );
      }

      // Upload images in background and replace temporary previews (non-blocking)
      if (hasImages && tempMessageId) {
        setUploadProgress({});

        // Upload in background without blocking UI
        (async () => {
          try {
            // Compress images in parallel (very fast, skips small images)
            const compressedImages = await compressImages(imagesToUpload);

            // Upload compressed images using storage service
            const basePath = `${user.id}`;
            const uploadedUrls = await uploadPhotos('message-media', compressedImages, basePath);

            // Map to media URL objects with fallback to temp previews
            const finalMediaUrls = compressedImages.map((file, index) => {
              const uploadedUrl = uploadedUrls[index];
              return {
                url: uploadedUrl || previewsToKeep[index] || '',
                type: file.type || 'image/jpeg',
                size: file.size || 0,
              };
            });

            // Replace temporary previews with real URLs using service
            await updateGroupMessageMedia(tempMessageId, finalMediaUrls);

            // Update local state immediately
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessageId
                  ? { ...msg, media_urls: finalMediaUrls }
                  : msg
              )
            );

            setUploadProgress({});
          } catch (error) {
            console.error("Background upload error:", error);
            // Don't show error to user, images already visible
          } finally {
            setUploadingImages(false);
          }
        })();
      }

    } catch (error) {
      console.error("Error sending message:", error);
      // Restore form on error
      setInput(messageContent);
      setSelectedImages(imagesToUpload);
      setImagePreviews(previewsToKeep);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive",
      });
    } finally {
      // Don't set uploadingImages to false here if images are uploading in background
      if (!hasImages) {
        setUploadingImages(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAIPlaceSuggestion = async () => {
    if (!conversationId || !user || aiLoading) return;

    setAiLoading(true);

    try {
      // Get recent messages for context
      const recentMessages = messages.slice(-5).map(m => m.content).join(" ");

      // Get member info
      const memberNames = members
        .filter(m => m.full_name)
        .map(m => m.full_name);

      const specialties = members
        .filter(m => m.specialty)
        .map(m => m.specialty);

      // Get a city from members
      const city = members.find(m => m.city)?.city || "your city";

      const response = await supabase.functions.invoke("generate-place-suggestions", {
        body: {
          city,
          memberNames,
          specialties,
          chatContext: recentMessages.slice(0, 500),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to get suggestions");
      }

      const aiMessage = response.data?.message;
      if (!aiMessage) throw new Error("No response from AI");

      // Post AI message to the chat using service
      const aiMessageData = await sendGroupMessage({
        group_conversation_id: conversationId,
        sender_id: user.id,
        content: `🤖 AI Place Recommendations:\n\n${aiMessage}`,
      });

      if (!aiMessageData) {
        throw new Error("Failed to send AI message");
      }

    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "Couldn't get suggestions",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const getMemberInfo = (userId: string): Member => {
    return members.find((m) => m.user_id === userId) || {
      user_id: userId,
      full_name: null,
      avatar_url: null
    };
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    // Focus input after state update
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !user || !editContent.trim()) return;

    const originalMessage = messages.find(m => m.id === editingMessageId);
    if (!originalMessage) return;

    // Optimistic update
    setMessages(prev =>
      prev.map(msg =>
        msg.id === editingMessageId
          ? { ...msg, content: editContent.trim(), edited_at: new Date().toISOString() }
          : msg
      )
    );
    setEditingMessageId(null);
    setEditContent("");

    try {
      const result = await editGroupMessage(editingMessageId, user.id, editContent.trim());
      if (!result) {
        // Rollback on error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === editingMessageId ? originalMessage : msg
          )
        );
        toast({
          title: t("common.error"),
          description: t("chat.couldNotEdit"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error editing message:", error);
      // Rollback on error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === editingMessageId ? originalMessage : msg
        )
      );
      toast({
        title: t("common.error"),
        description: t("chat.couldNotEdit"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage) return;

    // Optimistic update - mark as deleted
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, is_deleted: true } : msg
      )
    );

    try {
      const success = await deleteGroupMessage(messageId, user.id);
      if (!success) {
        // Rollback on error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? originalMessage : msg
          )
        );
        toast({
          title: t("common.error"),
          description: t("chat.couldNotDelete"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("chat.messageDeleted"),
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      // Rollback on error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? originalMessage : msg
        )
      );
      toast({
        title: t("common.error"),
        description: t("chat.couldNotDelete"),
        variant: "destructive",
      });
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Fetch polls for the conversation
  const fetchPolls = useCallback(async () => {
    if (!conversationId || !user) return;
    try {
      const pollsData = await getPolls(conversationId, user.id);
      setPolls(pollsData);
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  }, [conversationId, user]);

  // Fetch polls on mount and when conversation changes
  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Quick action handlers for voting and suggesting places
  const handleCreatePoll = async (pollType: 'day' | 'time' | 'activity') => {
    if (!conversationId || !user) return;

    const templates = getPollTemplates(t);
    const template = templates[pollType];

    try {
      const poll = await createPoll({
        conversation_id: conversationId,
        creator_id: user.id,
        poll_type: pollType,
        question: template.question,
        options: template.options,
        is_multiple_choice: false,
      });

      if (poll) {
        // Refresh polls
        fetchPolls();
        setShowQuickActions(false);
        toast({
          title: t("chat.pollCreated", "Poll created!"),
          description: t("chat.pollCreatedDesc", "Your group can now vote."),
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("chat.couldNotCreatePoll", "Could not create poll"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: t("common.error"),
        description: t("chat.couldNotCreatePoll", "Could not create poll"),
        variant: "destructive",
      });
    }
  };

  const handleSuggestPlace = () => {
    const city = members.find(m => m.city)?.city || t("chat.yourCity", "your city");
    const message = `📍 ${t("chat.suggestPlace", "I'd like to suggest a place!")}\n\n${t("chat.placePrompt", "What about meeting at")} [${t("chat.placeName", "place name")}] ${t("chat.in", "in")} ${city}?\n\n${t("chat.thoughts", "What do you think?")} 👍👎`;
    setInput(message);
    setShowQuickActions(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-1/2 ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col relative">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(255,152,0)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold">{groupName}</h1>
              <p className="text-xs text-muted-foreground">
                {members.length} members
              </p>
            </div>
          </div>

          {/* AI Suggest Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIPlaceSuggestion}
            disabled={aiLoading}
            className="gap-2 rounded-full"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Suggest Places</span>
          </Button>

          {/* Member Avatars - Premium Display with Profile Cards */}
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5">
                {members.slice(0, 5).map((member) => {
                  const initials = member.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U";

                  return (
                    <HoverCard key={member.user_id} openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="relative group cursor-pointer">
                          <Avatar
                            className="h-10 w-10 border-2 border-background shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-2 ring-background hover:ring-primary/40 transition-all hover:scale-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)]"
                            onClick={() => navigate(`/u/${member.user_id}`)}
                          >
                            <AvatarImage src={member.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online status indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm ring-1 ring-green-500/30" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="bottom" align="center" className="w-80 p-0 shadow-xl border-border/50">
                        <div className="p-5 space-y-4">
                          {/* Header with Avatar */}
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-border shadow-lg ring-2 ring-background">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white text-lg font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 pt-1">
                              <h3 className="font-semibold text-base text-foreground mb-1 truncate">
                                {member.full_name || "Anonymous"}
                              </h3>
                              {member.specialty ? (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground font-medium">{member.specialty}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Stethoscope className="h-3.5 w-3.5 text-muted-foreground/50" />
                                  <span className="text-sm text-muted-foreground/70 italic">Specialty not set</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 w-fit">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Online</span>
                              </div>
                            </div>
                          </div>

                          {/* Location */}
                          {member.city ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3 border-b border-border">
                              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{member.city}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/50 pb-3 border-b border-border">
                              <MapPinIcon className="h-4 w-4 flex-shrink-0 opacity-50" />
                              <span className="truncate italic">Location not set</span>
                            </div>
                          )}

                          {/* Interests */}
                          {member.interests && member.interests.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interests</p>
                              <div className="flex flex-wrap gap-1.5">
                                {member.interests.map((interest, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interests</p>
                              <p className="text-xs text-muted-foreground/70 italic">No interests listed</p>
                            </div>
                          )}

                          {/* View Profile Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/u/${member.user_id}`)}
                            className="w-full rounded-lg border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                          >
                            View Full Profile
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
                {members.length > 5 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary cursor-pointer hover:from-primary/30 hover:via-primary/20 hover:to-primary/15 transition-all shadow-[0_2px_8px_rgba(255,152,0,0.15)] hover:scale-110 hover:shadow-[0_4px_12px_rgba(255,152,0,0.2)] ring-2 ring-background">
                        +{members.length - 5}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" className="w-80 p-0 shadow-xl border-border/50">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-3 border-b border-border">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-foreground">Group Members</h4>
                            <p className="text-xs text-muted-foreground">{members.length} physicians</p>
                          </div>
                        </div>
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                          {members.map((member) => {
                            const initials = member.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U";

                            return (
                              <div
                                key={member.user_id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/u/${member.user_id}`)}
                              >
                                <div className="relative">
                                  <Avatar className="h-11 w-11 border border-border/50 shadow-sm ring-1 ring-background group-hover:ring-primary/30 transition-all">
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-semibold">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{member.full_name || "Anonymous"}</p>
                                  {member.specialty ? (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{member.specialty}</p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/50 italic truncate mt-0.5">Specialty not set</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10">
                                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {/* Messages Container - Professional Chat Layout */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Soft background container */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

        {/* Centered chat container */}
        <div className="relative max-w-3xl mx-auto h-full flex flex-col">
          <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-4">
            {messages.length === 0 ? (
              <GroupChatEmptyState
                members={members}
                currentUserId={user?.id}
                groupName={groupName}
                onSendMessage={(message) => {
                  // Send message directly without relying on input state
                  handleSend(message);
                }}
                onAISuggestion={handleAIPlaceSuggestion}
                aiLoading={aiLoading}
              />
            ) : (
              messages
                .filter((message) => !message.is_deleted)
                .map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const isAI = message.content.startsWith("🤖 AI");
                  const sender = getMemberInfo(message.sender_id);
                  const initials = sender.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U";

                  // Group consecutive messages from same sender
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const isConsecutive = prevMessage &&
                    prevMessage.sender_id === message.sender_id &&
                    !prevMessage.is_deleted &&
                    new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000; // 5 minutes
                  const showAvatar = !isOwn && !isConsecutive;
                  const showName = !isOwn && !isConsecutive;
                  const isFirstInGroup = !isConsecutive;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""} ${isConsecutive ? "mt-1" : "mt-6"}`}
                    >
                      {showAvatar ? (
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background shadow-md border-2 border-background">
                          <AvatarImage src={sender.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 flex-shrink-0" />
                      )}
                      <div className={`flex-1 ${isOwn ? "items-end flex flex-col" : "items-start flex flex-col"} max-w-[70%]`}>
                        {showName && (
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-sm font-semibold text-foreground">
                              {sender.full_name || "Anonymous"}
                            </span>
                            {sender.specialty && (
                              <span className="text-xs text-muted-foreground font-medium">
                                • {sender.specialty}
                              </span>
                            )}
                          </div>
                        )}
                        <div className={`relative group ${isOwn ? 'flex flex-row-reverse items-start gap-1' : 'flex items-start gap-1'}`}>
                          {/* Edit/Delete dropdown for own messages */}
                          {isOwn && !isAI && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-36">
                                <DropdownMenuItem onClick={() => handleStartEdit(message)} className="gap-2">
                                  <Pencil className="h-4 w-4" />
                                  {t("chat.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("chat.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${isAI
                              ? "bg-accent/10 border border-accent/20 text-foreground"
                              : isOwn
                                ? "bg-gradient-to-r from-primary to-orange-500 text-white rounded-br-md shadow-[0_2px_12px_rgba(255,152,0,0.3)]"
                                : "bg-card text-foreground border border-border/60 rounded-bl-md shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                              } ${isConsecutive && !isOwn ? "rounded-tl-md" : ""} ${isConsecutive && isOwn ? "rounded-tr-md" : ""}`}
                          >
                            {/* Display images */}
                            {(() => {
                              // Handle both array and JSONB formats, and ensure it's an array
                              type MediaItem = { url: string; type: string; size?: number };
                              let parsedMedia: MediaItem[] = [];

                              if (message.media_urls) {
                                if (typeof message.media_urls === 'string') {
                                  try {
                                    parsedMedia = JSON.parse(message.media_urls);
                                  } catch (e) {
                                    console.error('Failed to parse media_urls:', e);
                                  }
                                } else if (Array.isArray(message.media_urls)) {
                                  parsedMedia = message.media_urls.map(m =>
                                    typeof m === 'string' ? { url: m, type: 'image' } : { url: m.url || '', type: m.type || 'image', size: m.size }
                                  );
                                }
                              }

                              const hasMedia = message.has_media && parsedMedia.length > 0;

                              return hasMedia ? (
                                <div className={`grid gap-2.5 mb-2 ${message.content ? 'mb-3' : ''}`} style={{ gridTemplateColumns: parsedMedia.length === 1 ? '1fr' : parsedMedia.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)' }}>
                                  {parsedMedia.map((media, idx) => (
                                    <div
                                      key={idx}
                                      className="relative rounded-2xl overflow-hidden group/image cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card border border-border/30"
                                      onClick={() => {
                                        setViewingImages(parsedMedia);
                                        setViewingImageIndex(idx);
                                      }}
                                    >
                                      <img
                                        src={media.url}
                                        alt={`Attachment ${idx + 1}`}
                                        className="w-full h-auto max-h-72 object-cover"
                                        width={288}
                                        height={288}
                                        loading="lazy"
                                        onError={(e) => {
                                          console.error('Failed to load image:', media.url);
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
                                    </div>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            {/* Edit mode or display mode */}
                            {editingMessageId === message.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  ref={editInputRef}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={handleEditKeyPress}
                                  className="flex-1 h-8 text-sm bg-background/90 border-white/30 text-foreground"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleSaveEdit}
                                  className="h-7 w-7 hover:bg-white/20"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-7 w-7 hover:bg-white/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : message.content ? (
                              <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isOwn ? 'text-white' : 'text-foreground'}`}>
                                {message.content}
                              </p>
                            ) : null}
                            {/* Edited indicator */}
                            {message.edited_at && !editingMessageId && (
                              <span className={`text-[10px] mt-1 block ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
                                ({t("chat.edited")})
                              </span>
                            )}
                          </div>
                        </div>
                        {isFirstInGroup && (
                          <span className={`text-xs text-muted-foreground mt-1.5 px-1.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input - Floating Premium Container */}
      <div className="sticky bottom-0 z-10 px-4 pb-6 pt-4">
        <div
          ref={dropZoneRef}
          className={`max-w-3xl mx-auto rounded-2xl border border-border/60 bg-card/98 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] p-4 transition-all relative ${isDragging ? 'bg-primary/10 border-primary shadow-[0_-8px_32px_rgba(255,152,0,0.25)]' : ''
            }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center z-10 pointer-events-none backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm font-semibold text-primary">Drop images here</p>
              </div>
            </div>
          )}

          {/* Quick Actions Panel */}
          {showQuickActions && (
            <div className="mb-3 p-3 rounded-xl bg-secondary/50 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Vote className="h-3.5 w-3.5" />
                  {t("chat.planMeetup", "Plan your meetup")}
                </p>
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Poll Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => handleCreatePoll('day')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-sm group"
                >
                  <Calendar className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground">{t("chat.voteDay", "Vote Day")}</span>
                </button>
                <button
                  onClick={() => handleCreatePoll('time')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-sm group"
                >
                  <Clock className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground">{t("chat.voteTime", "Vote Time")}</span>
                </button>
                <button
                  onClick={() => handleCreatePoll('activity')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-sm group"
                >
                  <Coffee className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground">{t("chat.voteActivity", "Vote Activity")}</span>
                </button>
                <button
                  onClick={handleSuggestPlace}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-sm group"
                >
                  <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground">{t("chat.suggestPlaceBtn", "Suggest Place")}</span>
                </button>
              </div>

              {/* AI Suggestion */}
              <button
                onClick={() => {
                  handleAIPlaceSuggestion();
                  setShowQuickActions(false);
                }}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-orange-500/10 hover:from-primary/20 hover:to-orange-500/20 border border-primary/20 transition-all group"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                )}
                <span className="text-sm font-medium text-primary">{t("chat.aiSuggest", "AI Place Suggestions")}</span>
              </button>
            </div>
          )}

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative flex-shrink-0 group">
                  <div className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-24 object-cover rounded-xl border-2 border-border/50 shadow-md"
                      width={96}
                      height={96}
                    />
                    {/* Upload progress */}
                    {uploadingImages && uploadProgress[index] !== undefined && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-lg transition-all opacity-0 group-hover:opacity-100 ring-2 ring-background"
                      disabled={uploadingImages}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full h-12 w-12 flex-shrink-0 hover:bg-primary/10 transition-all hover:scale-105 shadow-sm border border-border/30"
              disabled={selectedImages.length >= 5}
              title="Attach images"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`rounded-full h-12 w-12 flex-shrink-0 hover:bg-primary/10 transition-all hover:scale-105 shadow-sm border border-border/30 ${showQuickActions ? 'bg-primary/10 border-primary/30' : ''}`}
              title={t("chat.planMeetup", "Plan meetup")}
            >
              <Vote className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-full border-border/60 focus-visible:ring-primary/50 h-12 px-5 shadow-sm bg-background/80 text-sm font-medium placeholder:text-muted-foreground/60"
            />
            <Button
              onClick={() => handleSend()}
              disabled={(!input.trim() && selectedImages.length === 0) || uploadingImages}
              className="rounded-full h-12 px-7 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:scale-105"
              title="Send message"
            >
              {uploadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
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
