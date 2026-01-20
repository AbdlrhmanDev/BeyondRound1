-- ============================================
-- إعداد Cron Job لإنشاء المجموعات تلقائياً كل أسبوع
-- ============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage on schema cron to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- التأكد من وجود جدول app_config
-- ============================================

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

-- ============================================
-- إنشاء Function لاستدعاء Edge Function
-- ============================================

CREATE OR REPLACE FUNCTION public.create_match_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_status integer;
  response_content text;
  supabase_url text;
  service_role_key text;
  function_url text;
BEGIN
  -- الحصول على المتغيرات من جدول الإعدادات
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';
  
  -- التحقق من وجود المتغيرات
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE EXCEPTION 'Supabase URL not configured in app_config table';
  END IF;
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured in app_config table';
  END IF;
  
  -- بناء URL الخاص بـ Edge Function
  function_url := supabase_url || '/functions/v1/create-match-groups';
  
  -- استدعاء Edge Function عبر HTTP
  SELECT status, content INTO response_status, response_content
  FROM http((
    'POST',
    function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_role_key)
    ],
    'application/json',
    '{}'
  )::http_request);

  -- تسجيل النتيجة
  RAISE NOTICE '✅ Create groups function called. Status: %, Response: %', response_status, response_content;
  
  -- رفع خطأ إذا فشل الطلب
  IF response_status != 200 THEN
    RAISE EXCEPTION '❌ Failed to call Edge Function. Status: %, Response: %', response_status, response_content;
  END IF;
END;
$$;

-- ============================================
-- حذف الجدولة القديمة إن وجدت
-- ============================================

DO $$
BEGIN
  PERFORM cron.unschedule('create-match-groups-wednesday');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================
-- جدولة Cron Job
-- ============================================

-- كل أربعاء الساعة 12:00 ظهراً (UTC) - قبل يوم من إرسال الإشعارات
-- تنسيق Cron: دقيقة ساعة يوم شهر يوم_الأسبوع
-- 0 12 * * 3 = الساعة 12:00 ظهراً كل أربعاء (3 = الأربعاء)
-- هذا يعطي وقت كافٍ لإنشاء المجموعات قبل إرسال الإشعارات يوم الخميس
SELECT cron.schedule(
  'create-match-groups-wednesday',
  '0 12 * * 3', -- كل أربعاء الساعة 12:00 ظهراً UTC
  $$SELECT public.create_match_groups();$$
);

-- ============================================
-- التحقق من نجاح الجدولة
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'create-match-groups-wednesday') THEN
    RAISE NOTICE '✅ Cron job scheduled successfully: create-match-groups-wednesday';
    RAISE NOTICE '📅 Schedule: Every Wednesday at 12:00 PM UTC';
    RAISE NOTICE '📝 This will create groups for the upcoming Thursday match week';
  ELSE
    RAISE WARNING '❌ Failed to create cron job';
  END IF;
END $$;

-- ============================================
-- إدراج الإعدادات في جدول app_config (إذا لم تكن موجودة)
-- ============================================
-- ملاحظة: يجب استبدال القيم التالية بقيمك الخاصة
-- يمكنك إيجاد Service Role Key في: Supabase Dashboard → Settings → API → service_role key

-- إدراج أو تحديث الإعدادات (قم بتعديل القيم حسب مشروعك)
-- DELETE FROM public.app_config WHERE key IN ('supabase_url', 'service_role_key');
-- INSERT INTO public.app_config (key, value) VALUES
--   ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co'),
--   ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ============================================
-- ملاحظات:
-- ============================================
-- 1. هذا الـ Cron Job يعمل كل أربعاء الساعة 12:00 ظهراً (UTC)
-- 2. يقوم بإنشاء المجموعات للمستخدمين الجدد
-- 3. يحسب نقاط المطابقة بين المستخدمين
-- 4. المجموعات التي يتم إنشاؤها ستكون لـ match_week = الخميس القادم
-- 5. يوم الخميس الساعة 4:00 مساءً، سيتم إرسال الإشعارات للمجموعات الجديدة
-- 6. **مهم**: تأكد من إدراج supabase_url و service_role_key في جدول app_config
--
-- ============================================
-- اختبار الـ Function يدوياً (اختياري)
-- ============================================
-- SELECT public.create_match_groups();
--
-- ============================================
-- عرض الجدول الزمني الحالي
-- ============================================
-- SELECT * FROM cron.job WHERE jobname = 'create-match-groups-wednesday';
--
-- ============================================
-- التحقق من الإعدادات
-- ============================================
-- SELECT * FROM public.app_config WHERE key IN ('supabase_url', 'service_role_key');
--
-- ============================================
-- حذف الجدولة (إذا أردت إلغائها)
-- ============================================
-- SELECT cron.unschedule('create-match-groups-wednesday');
