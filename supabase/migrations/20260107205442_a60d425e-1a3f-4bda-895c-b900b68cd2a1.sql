-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('licenses', 'licenses', false);

-- Add license_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_url text;

-- Storage policies for avatars bucket (public access for viewing)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for licenses bucket (private, only owner can access)
CREATE POLICY "Users can view their own license"
ON storage.objects FOR SELECT
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own license"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own license"
ON storage.objects FOR UPDATE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own license"
ON storage.objects FOR DELETE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);