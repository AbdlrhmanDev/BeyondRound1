import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users, MapPin, Sparkles, Loader2, Image as ImageIcon, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressImages } from "@/utils/imageCompression";
import { ImageViewer } from "@/components/ImageViewer";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_ai?: boolean;
  is_deleted?: boolean;
  media_urls?: Array<{ url: string; type: string; size?: number }>;
  has_media?: boolean;
  media_type?: string;
}

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city?: string | null;
  specialty?: string | null;
}

const GroupChat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchChatData = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      
      // Fetch conversation, group info, members, and messages in parallel for faster loading
      const [convoRes, messagesRes] = await Promise.all([
        supabase
          .from("group_conversations")
          .select("group_id")
          .eq("id", conversationId)
          .single(),
        supabase
          .from("group_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .or("is_deleted.is.null,is_deleted.eq.false")
          .order("created_at", { ascending: true })
          .limit(100), // Limit to last 100 messages for faster loading
      ]);

      if (convoRes.error) {
        navigate("/matches");
        return;
      }

      if (messagesRes.data) {
        setMessages(messagesRes.data);
      }

      const convoData = convoRes.data;
      if (!convoData) {
        navigate("/matches");
        return;
      }

      setGroupId(convoData.group_id);

      // Fetch group info and members in parallel
      const [groupRes, membersRes] = await Promise.all([
        supabase
          .from("match_groups")
          .select("name, id, match_week")
          .eq("id", convoData.group_id)
          .single(),
        supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", convoData.group_id),
      ]);

      const groupData = groupRes.data;
      const membersData = membersRes.data;

      if (membersData && membersData.length > 0) {
        const memberUserIds = membersData.map(m => m.user_id);
        
        // Fetch all profiles and preferences in batch
        const [profilesRes, prefsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, city")
            .in("user_id", memberUserIds),
          supabase
            .from("onboarding_preferences")
            .select("user_id, specialty")
            .in("user_id", memberUserIds),
        ]);

        // Create lookup maps
        const profilesMap = new Map(
          (profilesRes.data || []).map(p => [p.user_id, p])
        );
        const prefsMap = new Map(
          (prefsRes.data || []).map(p => [p.user_id, p])
        );

        // Build member profiles array
        const memberProfiles = memberUserIds.map(userId => ({
          user_id: userId,
          full_name: profilesMap.get(userId)?.full_name || null,
          avatar_url: profilesMap.get(userId)?.avatar_url || null,
          city: profilesMap.get(userId)?.city || null,
          specialty: prefsMap.get(userId)?.specialty || null,
        }));
        
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

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || !user || !conversationId) return;

    const messageContent = input.trim();
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
          media_urls: tempMediaUrls,
          has_media: true,
          media_type: 'image',
        };
        
        // Show message immediately in UI
        setMessages((prev) => [...prev, optimisticMessage]);
        
        // Send to database in background
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: messageData, error: insertError } = await (supabase as any)
          .from("group_messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: messageContent || '',
            media_urls: tempMediaUrls,
            has_media: true,
            media_type: 'image',
          })
          .select()
          .single();

        if (insertError) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
          throw insertError;
        }
        
        tempMessageId = messageData.id;
        
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? messageData : msg
          )
        );
        
      } else {
        // No images, send normally
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: messageData, error: insertError } = await (supabase as any)
          .from("group_messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: messageContent || '',
          })
          .select()
          .single();

        if (insertError) throw insertError;
      }
      
      // Upload images in background and replace temporary previews (non-blocking)
      if (hasImages && tempMessageId) {
        setUploadProgress({});
        
        // Upload in background without blocking UI
        (async () => {
          try {
            // Compress images in parallel (very fast, skips small images)
            const compressedImages = await compressImages(imagesToUpload);
            
            // Upload compressed images in parallel
            const uploadPromises = compressedImages.map(async (file, index) => {
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              
              try {
                const { error: uploadError } = await supabase.storage
                  .from('message-media')
                  .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                  });
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                  .from('message-media')
                  .getPublicUrl(fileName);
                
                return {
                  url: publicUrl,
                  type: file.type,
                  size: file.size,
                };
              } catch (error) {
                console.error(`Upload error for image ${index}:`, error);
                // Return temp preview if upload fails
                return {
                  url: previewsToKeep[index],
                  type: file.type,
                  size: file.size,
                };
              }
            });

            const mediaUrls = await Promise.all(uploadPromises);
            
            // Replace temporary previews with real URLs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("group_messages")
              .update({
                media_urls: mediaUrls,
              })
              .eq("id", tempMessageId);
            
            // Update local state immediately
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessageId
                  ? { ...msg, media_urls: mediaUrls }
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

      // Post AI message to the chat
      const { error } = await supabase
        .from("group_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `🤖 AI Place Recommendations:\n\n${aiMessage}`,
        });

      if (error) throw error;

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
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

          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => {
              const initials = member.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";

              return (
                <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {members.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-2">Start the conversation</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              Say hello to your group! Plan a meetup or just get to know each other.
            </p>
            <Button
              variant="outline"
              onClick={handleAIPlaceSuggestion}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Get AI Place Suggestions
            </Button>
          </div>
        ) : (
          messages
            .filter((message) => !message.is_deleted)
            .map((message) => {
              const isOwn = message.sender_id === user?.id;
              const isAI = message.content.startsWith("🤖 AI");
              const sender = getMemberInfo(message.sender_id);
              const initials = sender.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";

              return (
                <div
                  key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground mb-1 block">
                      {sender.full_name || "Anonymous"}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isAI
                        ? "bg-accent/10 border border-accent/20 text-foreground rounded-bl-md"
                        : isOwn
                        ? "bg-gradient-gold text-white rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    {/* Display images */}
                    {(() => {
                      // Handle both array and JSONB formats, and ensure it's an array
                      let mediaUrls = message.media_urls;
                      if (typeof mediaUrls === 'string') {
                        try {
                          mediaUrls = JSON.parse(mediaUrls);
                        } catch (e) {
                          console.error('Failed to parse media_urls:', e);
                          mediaUrls = [];
                        }
                      }
                      const hasMedia = message.has_media && Array.isArray(mediaUrls) && mediaUrls.length > 0;
                      
                        return hasMedia ? (
                          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: mediaUrls.length === 1 ? '1fr' : mediaUrls.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)' }}>
                            {mediaUrls.map((media: { url?: string; type?: string; size?: number } | string, idx: number) => {
                              const imageUrl = typeof media === 'string' ? media : (media.url || '');
                              return (
                                <div 
                                  key={idx} 
                                  className="relative rounded-lg overflow-hidden group cursor-pointer"
                                  onClick={() => {
                                    setViewingImages(mediaUrls);
                                    setViewingImageIndex(idx);
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-full h-auto max-h-64 object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error('Failed to load image:', imageUrl);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                              );
                            })}
                        </div>
                      ) : null;
                    })()}
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        ref={dropZoneRef}
        className={`border-t border-border bg-card/80 backdrop-blur-sm p-4 transition-colors ${
          isDragging ? 'bg-primary/10 border-primary' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-primary">Drop images here</p>
            </div>
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
                    className="h-24 w-24 object-cover rounded-lg border-2 border-border shadow-sm"
                  />
                  {/* Upload progress */}
                  {uploadingImages && uploadProgress[index] !== undefined && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-md transition-all opacity-0 group-hover:opacity-100"
                    disabled={uploadingImages}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="container mx-auto flex gap-3 relative">
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
            className="rounded-full h-11 w-11 flex-shrink-0"
            disabled={selectedImages.length >= 5}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-border/50 focus-visible:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && selectedImages.length === 0) || uploadingImages}
            className="px-4"
          >
            {uploadingImages ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
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
