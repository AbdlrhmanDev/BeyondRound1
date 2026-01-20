-- ============================================
-- إعداد Cron Job كامل لإرسال إشعارات المطابقة
-- (نسخة معدلة للعمل مع Supabase)
-- ============================================

-- الخطوة 1: تفعيل Extensions المطلوبة
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- الخطوة 2: إعطاء الصلاحيات
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- الحل: استخدام جدول Configuration بدلاً من متغيرات النظام
-- ============================================

-- الخطوة 3: إنشاء جدول للإعدادات
CREATE TABLE IF NOT EXISTS public.app_config (
  id bigserial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- الخطوة 4: إضافة Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- السماح للـ Service Role بقراءة الإعدادات
DROP POLICY IF EXISTS "Allow service role to read config" ON public.app_config;
CREATE POLICY "Allow service role to read config" ON public.app_config
  FOR SELECT
  USING (auth.role() = 'service_role');

-- الخطوة 5: إدراج البيانات الأساسية
DELETE FROM public.app_config WHERE key IN ('supabase_url', 'service_role_key');

INSERT INTO public.app_config (key, value) VALUES
  ('supabase_url', 'https://peqluzhrhgnwjhvxxtzs.supabase.co'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ============================================
-- الخطوة 6: إنشاء Function لاستدعاء Edge Function
-- ============================================

CREATE OR REPLACE FUNCTION public.send_match_notifications()
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
  function_url := supabase_url || '/functions/v1/send-match-notifications';
  
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
  RAISE NOTICE '✅ Notification function called successfully. Status: %, Response: %', response_status, response_content;
  
  -- رفع خطأ إذا فشل الطلب
  IF response_status != 200 THEN
    RAISE EXCEPTION '❌ Failed to call Edge Function. Status: %, Response: %', response_status, response_content;
  END IF;
END;
$$;

-- ============================================
-- الخطوة 7: حذف الجدولة القديمة إن وجدت
-- ============================================

DO $$
BEGIN
  PERFORM cron.unschedule('send-match-notifications-thursday-4pm');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================
-- الخطوة 8: جدولة Cron Job
-- ============================================

-- كل خميس الساعة 4:00 مساءً (UTC)
-- تنسيق Cron: دقيقة ساعة يوم شهر يوم_الأسبوع
-- 0 16 * * 4 = الساعة 16:00 (4 مساءً) كل خميس
SELECT cron.schedule(
  'send-match-notifications-thursday-4pm',
  '0 16 * * 4', -- كل خميس الساعة 4:00 مساءً UTC
  $$SELECT public.send_match_notifications();$$
);

-- ============================================
-- الخطوة 9: التحقق من نجاح الجدولة
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm') THEN
    RAISE NOTICE '✅ Cron job scheduled successfully: send-match-notifications-thursday-4pm';
    RAISE NOTICE '📅 Schedule: Every Thursday at 4:00 PM UTC';
  ELSE
    RAISE WARNING '❌ Failed to create cron job';
  END IF;
END $$;

-- ============================================
-- اختبار الـ Function يدوياً (اختياري)
-- ============================================
-- SELECT public.send_match_notifications();

-- ============================================
-- عرض الجدول الزمني الحالي
-- ============================================
-- SELECT * FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm';

-- ============================================
-- عرض الإعدادات المحفوظة
-- ============================================
-- SELECT * FROM public.app_config;

-- ============================================
-- حذف الجدولة (إذا أردت إلغائها)
-- ============================================
-- SELECT cron.unschedule('send-match-notifications-thursday-4pm');
