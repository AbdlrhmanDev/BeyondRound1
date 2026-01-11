-- Update admin_audit_logs table
ALTER TABLE public.admin_audit_logs
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'success'::text;

-- Update conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Create trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update group_messages table
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS edited_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- Update messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_method text,
ADD COLUMN IF NOT EXISTS soft_delete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add CHECK constraint for birth_year if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_birth_year_check' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_birth_year_check 
    CHECK (birth_year IS NULL OR birth_year >= 1950);
  END IF;
END $$;
