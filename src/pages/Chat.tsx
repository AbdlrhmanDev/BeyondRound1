import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Sparkles, Image as ImageIcon, X, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressImages } from "@/utils/imageCompression";
import { ImageViewer } from "@/components/ImageViewer";
import { getMessages, getConversation, getMatchForConversation, sendMessage, updateMessageMedia, Message } from "@/services/messageService";
import { getPublicProfile } from "@/services/profileService";
import { uploadPhotos } from "@/services/storageService";

interface OtherUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
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

  const fetchConversation = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      
      // Fetch conversation and messages in parallel for faster loading
      const [conversation, messagesData] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId, 100),
      ]);

      if (messagesData) setMessages(messagesData);

      // Get match to find other user (can be done after messages load)
      if (conversation?.match_id) {
        const match = await getMatchForConversation(conversation.match_id);

        if (match) {
          const otherUserId = match.user_id === user.id ? match.matched_user_id : match.user_id;
          const profile = await getPublicProfile(otherUserId);

          if (profile) {
            setOtherUser({
              user_id: profile.user_id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast({
        title: "Error",
        description: "Could not load conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, toast]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Subscribe to realtime messages
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
        .channel(`messages-${conversationId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
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
            table: "messages",
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

  // Scroll to bottom on new messages - use requestAnimationFrame to avoid forced reflow
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages]);

  // Memoize helper functions to prevent recreation
  const formatMessageDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  }, []);

  const shouldGroupMessages = useCallback((currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return false;
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return currentMsg.sender_id === prevMsg.sender_id && timeDiff < 5 * 60 * 1000; // 5 minutes
  }, []);

  // Memoize filtered messages to prevent recalculation
  const filteredMessages = useMemo(() => 
    messages.filter((message) => !message.is_deleted),
    [messages]
  );

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
    if ((!newMessage.trim() && selectedImages.length === 0) || !user || !conversationId) return;

    const messageContent = newMessage.trim();
    const hasImages = selectedImages.length > 0;
    
    // Clear form immediately for better UX
    setNewMessage("");
    const imagesToUpload = [...selectedImages];
    const previewsToKeep = [...imagePreviews];
    setSelectedImages([]);
    setImagePreviews([]);
    
    setSending(true);
    
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
        };
        
        // Show message immediately in UI
        setMessages((prev) => [...prev, optimisticMessage]);
        
        // Send to database in background using service
        const messageData = await sendMessage({
          conversation_id: conversationId,
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
        // No images, send normally using service
        const messageData = await sendMessage({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent || '',
        });

        if (!messageData) {
          throw new Error("Failed to send message");
        }
      }
      
      // Upload images in background and replace temporary previews (non-blocking)
      if (hasImages && tempMessageId) {
        setUploadingImages(true);
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
            await updateMessageMedia(tempMessageId, finalMediaUrls);
            
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
      setNewMessage(messageContent);
      setSelectedImages(imagesToUpload);
      setImagePreviews(previewsToKeep);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-12 w-48 ml-auto" />
          <Skeleton className="h-12 w-56" />
        </div>
      </div>
    );
  }

  const otherInitials = otherUser?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/matches")}
            className="rounded-full hover:bg-secondary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {otherUser && (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
              onClick={() => navigate(`/u/${otherUser.user_id}`)}
            >
              <Avatar className="h-10 w-10 flex-shrink-0 shadow-sm">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-display font-bold">
                  {otherInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-foreground truncate">
                  {otherUser.full_name || "Anonymous"}
                </h2>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-gold/10 flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Start the conversation!
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Say hello to {otherUser?.full_name || "your new connection"}
            </p>
          </div>
        ) : (
          filteredMessages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
              const shouldGroup = shouldGroupMessages(message, prevMessage);
              const showDateSeparator = !prevMessage || formatMessageDate(message.created_at) !== formatMessageDate(prevMessage.created_at);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground font-medium">
                        {formatMessageDate(message.created_at)}
                      </div>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${shouldGroup ? "mt-0.5" : "mt-[80px]"}`}>
                    <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                      isOwn
                        ? "bg-gradient-gold text-white rounded-br-md shadow-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}>
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
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                      )}
                      {!shouldGroup && (
                        <p className={`text-xs mt-1.5 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                          {message.edited_at && " (edited)"}
                        </p>
                      )}
                    </div>
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
        className={`border-t border-border/50 bg-card/95 backdrop-blur-md p-4 shadow-lg transition-colors ${
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
        
        <div className="container mx-auto flex gap-3 items-end relative">
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
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 bg-background/50 min-h-[44px]"
          />
          <Button 
            onClick={handleSend} 
            disabled={sending || (!newMessage.trim() && selectedImages.length === 0)}
            size="icon"
            className="rounded-full bg-gradient-gold hover:opacity-90 h-11 w-11 shadow-md disabled:opacity-50"
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

export default Chat;
