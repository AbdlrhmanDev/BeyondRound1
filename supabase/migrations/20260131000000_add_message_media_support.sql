-- Add media support to one-on-one messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS has_media boolean DEFAULT false;

-- Add comment to explain the media_urls structure
COMMENT ON COLUMN public.messages.media_urls IS 'Array of objects: [{"url": "path/to/image", "type": "image/jpeg", "size": 12345}]';

-- Add media support to group messages
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS has_media boolean DEFAULT false;

-- Add comment to explain the media_urls structure
COMMENT ON COLUMN public.group_messages.media_urls IS 'Array of objects: [{"url": "path/to/image", "type": "image/jpeg", "size": 12345}]';

-- Create indexes for faster queries on has_media
CREATE INDEX IF NOT EXISTS messages_has_media_idx ON public.messages(has_media) WHERE has_media = true;
CREATE INDEX IF NOT EXISTS group_messages_has_media_idx ON public.group_messages(has_media) WHERE has_media = true;

-- Optional: Create a new table for tracking media uploads (for better control)
CREATE TABLE IF NOT EXISTS public.message_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid,
  group_message_id uuid,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  original_filename text,
  mime_type text,
  storage_path text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_media_pkey PRIMARY KEY (id),
  CONSTRAINT message_media_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT message_media_group_message_id_fkey FOREIGN KEY (group_message_id) REFERENCES public.group_messages(id) ON DELETE CASCADE,
  CONSTRAINT message_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id),
  CONSTRAINT message_media_check CHECK (
    (message_id IS NOT NULL AND group_message_id IS NULL) OR 
    (message_id IS NULL AND group_message_id IS NOT NULL)
  )
);

-- Create index on file_type for filtering images
CREATE INDEX IF NOT EXISTS message_media_file_type_idx ON public.message_media(file_type);
CREATE INDEX IF NOT EXISTS message_media_message_id_idx ON public.message_media(message_id);
CREATE INDEX IF NOT EXISTS message_media_group_message_id_idx ON public.message_media(group_message_id);

-- Enable RLS on message_media table
ALTER TABLE public.message_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_media
CREATE POLICY "Users can view media from their conversations"
ON public.message_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    JOIN public.matches ma ON ma.id = c.match_id
    WHERE m.id = message_media.message_id
    AND (ma.user_id = auth.uid() OR ma.matched_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.group_messages gm
    JOIN public.group_conversations gc ON gc.id = gm.conversation_id
    JOIN public.group_members gmem ON gmem.group_id = gc.group_id
    WHERE gm.id = message_media.group_message_id
    AND gmem.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert media for their own messages"
ON public.message_media FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own media"
ON public.message_media FOR DELETE
USING (uploaded_by = auth.uid());
