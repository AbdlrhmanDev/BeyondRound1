# إعداد Cron Job بسيط - خطوة بخطوة

## الطريقة الأسهل: استخدام Supabase Dashboard

### الخطوة 1: نشر Edge Function

```bash
supabase functions deploy send-match-notifications
```

### الخطوة 2: إعداد Cron Job في Dashboard

1. **افتح Supabase Dashboard**: https://supabase.com/dashboard
2. **اختر مشروعك**
3. اذهب إلى: **Database** → **Cron Jobs** (أو **Edge Functions** → **Cron Jobs**)
4. انقر على **New Cron Job** أو **Create Schedule**

5. **املأ البيانات**:
   - **Name**: `send-match-notifications`
   - **Schedule**: `0 16 * * 4` 
     - يعني: كل خميس الساعة 4:00 مساءً (16:00)
   - **Function**: `send-match-notifications`
   - **Method**: `POST`
   - **Headers**: 
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
     }
     ```

6. **احصل على Service Role Key**:
   - اذهب إلى: **Settings** → **API**
   - انسخ **service_role** key (ليس anon key)
   - الصقه في Headers

### الخطوة 3: اختبار

يمكنك اختبار الـ function يدوياً:

```bash
curl -X POST \
  'https://xszfvwwlrygxkspmqmgw.supabase.co/functions/v1/send-match-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## ملاحظات مهمة

- **Project Reference**: `xszfvwwlrygxkspmqmgw` (من config.toml)
- **URL الكامل**: `https://xszfvwwlrygxkspmqmgw.supabase.co/functions/v1/send-match-notifications`
- **Service Role Key**: موجود في Settings → API
- **Timezone**: Cron Job يعمل حسب UTC، تأكد من التحويل للوقت المحلي

## جدولة Cron

- `0 16 * * 4` = كل خميس الساعة 4:00 مساءً (UTC)
- `0 20 * * 4` = كل خميس الساعة 8:00 مساءً (UTC)

## بديل: استخدام pg_cron (متقدم)

إذا كنت تريد استخدام pg_cron migration:

1. قم بتشغيل migration: `20260108000009_setup_match_notifications_cron.sql`
2. قم بإعداد المتغيرات:
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xszfvwwlrygxkspmqmgw.supabase.co';
   ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```

**لكن الطريقة الموصى بها هي استخدام Supabase Dashboard** ✅
