# إعداد Cron Job لإرسال إشعارات المطابقة

## الخيارات المتاحة

### الخيار 1: استخدام Supabase Dashboard (موصى به)

1. اذهب إلى Supabase Dashboard → Database → Cron Jobs
2. أنشئ Cron Job جديد:
   - **Name**: `send-match-notifications`
   - **Schedule**: `0 16 * * 4` (كل خميس الساعة 4 مساءً)
   - **Function**: `send-match-notifications`
   - **Method**: `POST`

### الخيار 2: استخدام pg_cron (يتطلب إعداد إضافي)

1. تأكد من تفعيل extension `pg_cron` في Supabase
2. قم بتشغيل migration: `20260108000009_setup_match_notifications_cron.sql`
3. **مهم**: استبدل `YOUR_PROJECT_REF` بـ project reference الخاص بك
4. **مهم**: قم بإعداد `service_role_key` في app settings

### الخيار 3: استخدام خدمة خارجية (مثل Vercel Cron أو GitHub Actions)

يمكنك استخدام خدمة خارجية لاستدعاء Edge Function كل خميس الساعة 4 مساءً.

## خطوات الإعداد

### 1. إعداد ملف .env (اختياري - للـ Edge Function فقط)

Edge Functions في Supabase تحصل على المتغيرات تلقائياً من Supabase Dashboard.
**لا تحتاج** لإضافة أي شيء في `.env` للـ Edge Functions.

لكن إذا كنت تستخدم `pg_cron` migration، ستحتاج:

```sql
-- في Supabase SQL Editor، قم بتشغيل:
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**ملاحظة**: استبدل `YOUR_PROJECT_REF` بـ project reference الخاص بك (يمكنك إيجاده في Supabase Dashboard → Settings → API)

### 2. نشر Edge Function

```bash
supabase functions deploy send-match-notifications
```

### 3. إعداد Cron Job في Supabase Dashboard (الطريقة الموصى بها)

1. اذهب إلى: **Database** → **Cron Jobs** (أو **Edge Functions** → **Cron Jobs**)
2. انقر على **New Cron Job**
3. املأ البيانات:
   - **Name**: `send-match-notifications`
   - **Schedule**: `0 16 * * 4` (كل خميس الساعة 4:00 مساءً)
   - **Function**: `send-match-notifications`
   - **Method**: `POST`
   - **Headers**: 
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
     }
     ```
   
   **ملاحظة**: Service Role Key موجود في: Settings → API → service_role key

### 3. اختبار الـ Function يدوياً

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-match-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## ملاحظات مهمة

1. **Service Role Key**: احتفظ به سراً ولا تشاركه في الكود
2. **Timezone**: تأكد من أن Cron Job يعمل في timezone الصحيح
3. **Error Handling**: الـ function يتعامل مع الأخطاء ويسجلها
4. **Duplicate Prevention**: الـ function يتحقق من عدم إرسال إشعارات مكررة

## جدولة Cron

- `0 16 * * 4` = كل خميس الساعة 4:00 مساءً
- `0 20 * * 4` = كل خميس الساعة 8:00 مساءً (للاستبيان)

## بديل: استخدام Supabase Database Webhooks

يمكنك أيضاً استخدام Database Webhooks مع Supabase:
1. اذهب إلى Database → Webhooks
2. أنشئ webhook يتم تشغيله عند إنشاء group_members
3. استخدم Edge Function لإرسال الإشعارات
