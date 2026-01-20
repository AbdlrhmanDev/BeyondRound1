# إعداد Cron Job - طريقة سهلة جداً 🚀

## الخطوة 1: نشر Edge Function

```bash
supabase functions deploy send-match-notifications
```

## الخطوة 2: إعداد Cron Job في Dashboard (3 خطوات فقط!)

### 1. افتح Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard/project/peqluzhrhgnwjhvxxtzs
- أو: Database → Cron Jobs

### 2. أنشئ Cron Job جديد
- اضغط **New Cron Job** أو **Create Schedule**

### 3. املأ البيانات:

**Name:**
```
send-match-notifications
```

**Schedule:**
```
0 16 * * 4
```
(يعني: كل خميس الساعة 4 مساءً)

**Function/URL:**
```
send-match-notifications
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc"
}
```

**Body (اختياري):**
```json
{}
```

### 4. اضغط Save

## ✅ انتهى! 

الآن Cron Job سيعمل تلقائياً كل خميس الساعة 4 مساءً.

---

## اختبار يدوي (اختياري)

يمكنك اختبار الـ Function الآن:

```bash
curl -X POST \
  'https://peqluzhrhgnwjhvxxtzs.supabase.co/functions/v1/send-match-notifications' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc' \
  -H 'Content-Type: application/json'
```

## ملاحظات

- ✅ لا تحتاج SQL أو migrations معقدة
- ✅ كل شيء من Dashboard
- ✅ أسهل وأسرع
- ✅ يمكنك تعديل أو حذف Cron Job بسهولة من Dashboard
