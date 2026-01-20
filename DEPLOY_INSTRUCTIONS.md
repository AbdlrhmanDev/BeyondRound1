# تعليمات النشر الكاملة

## معلومات المشروع
- **Project URL**: `https://peqluzhrhgnwjhvxxtzs.supabase.co`
- **Project Reference**: `peqluzhrhgnwjhvxxtzs`
- **Function URL**: `https://peqluzhrhgnwjhvxxtzs.supabase.co/functions/v1/send-match-notifications`

## الخطوة 1: نشر Edge Function

```bash
# تأكد من أنك في مجلد المشروع
cd "C:\Users\abdlr\Downloads\connect-thrive-main\connect-thrive-main"

# سجل دخولك في Supabase CLI
supabase login

# ربط المشروع
supabase link --project-ref peqluzhrhgnwjhvxxtzs

# نشر الـ Function
supabase functions deploy send-match-notifications
```

## الخطوة 2: تشغيل Migration لإعداد Cron Job

### الطريقة الأولى: استخدام Supabase Dashboard (موصى به)

1. افتح Supabase Dashboard: https://supabase.com/dashboard/project/peqluzhrhgnwjhvxxtzs
2. اذهب إلى: **SQL Editor**
3. انسخ محتوى ملف `SETUP_CRON_COMPLETE.sql`
4. الصقه في SQL Editor
5. اضغط **Run**

### الطريقة الثانية: استخدام Supabase CLI

```bash
# تشغيل Migration
supabase db push
```

أو تشغيل الملف مباشرة:

```bash
# في Supabase SQL Editor، قم بتشغيل:
psql "postgresql://postgres:[YOUR-PASSWORD]@db.peqluzhrhgnwjhvxxtzs.supabase.co:5432/postgres" -f SETUP_CRON_COMPLETE.sql
```

## الخطوة 3: اختبار الـ Function

### اختبار يدوي:

```bash
curl -X POST \
  'https://peqluzhrhgnwjhvxxtzs.supabase.co/functions/v1/send-match-notifications' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc' \
  -H 'Content-Type: application/json'
```

### اختبار من SQL:

```sql
SELECT public.send_match_notifications();
```

## الخطوة 4: التحقق من الجدولة

```sql
-- عرض جميع Cron Jobs
SELECT * FROM cron.job;

-- عرض Cron Job المحدد
SELECT * FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm';
```

## ملاحظات مهمة

1. **Service Role Key**: حساس - لا تشاركه في الكود العام
2. **Timezone**: Cron Job يعمل حسب UTC
   - `0 16 * * 4` = 4:00 PM UTC (كل خميس)
   - إذا كان وقتك المحلي مختلف، اضبط الجدولة
3. **Testing**: يمكنك إزالة فحص الوقت في Edge Function للاختبار

## استكشاف الأخطاء

### إذا فشل Cron Job:

```sql
-- عرض سجل الأخطاء
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm')
ORDER BY start_time DESC;
```

### إذا فشل Edge Function:

- تحقق من Logs في Supabase Dashboard → Edge Functions → send-match-notifications → Logs
- تأكد من نشر الـ Function بنجاح

## إلغاء الجدولة

```sql
SELECT cron.unschedule('send-match-notifications-thursday-4pm');
```
