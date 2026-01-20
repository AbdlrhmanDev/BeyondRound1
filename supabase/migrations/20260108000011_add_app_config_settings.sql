-- ============================================
-- إضافة الإعدادات المطلوبة في جدول app_config
-- ============================================
-- ملاحظة: يجب استبدال القيم التالية بقيمك الخاصة
-- يمكنك إيجاد Service Role Key في: Supabase Dashboard → Settings → API → service_role key

-- التأكد من وجود جدول app_config
CREATE TABLE IF NOT EXISTS public.app_config (
  id bigserial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- إضافة Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- السماح للـ Service Role بقراءة الإعدادات
DROP POLICY IF EXISTS "Allow service role to read config" ON public.app_config;
CREATE POLICY "Allow service role to read config" ON public.app_config
  FOR SELECT
  USING (auth.role() = 'service_role');

-- إدراج أو تحديث الإعدادات
-- قم بتعديل القيم التالية حسب مشروعك:
-- 1. استبدل YOUR_PROJECT_REF بـ project reference الخاص بك
-- 2. استبدل YOUR_SERVICE_ROLE_KEY بـ service role key الخاص بك

DELETE FROM public.app_config WHERE key IN ('supabase_url', 'service_role_key');

INSERT INTO public.app_config (key, value) VALUES
  ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ============================================
-- للتحقق من الإعدادات:
-- ============================================
-- SELECT * FROM public.app_config WHERE key IN ('supabase_url', 'service_role_key');
