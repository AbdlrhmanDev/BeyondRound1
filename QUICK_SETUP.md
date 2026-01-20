# إعداد سريع - 3 خطوات فقط! ⚡

## الخطوة 1️⃣: نشر Function

```bash
supabase functions deploy send-match-notifications
```

## الخطوة 2️⃣: فتح Dashboard

https://supabase.com/dashboard/project/peqluzhrhgnwjhvxxtzs

## الخطوة 3️⃣: إنشاء Cron Job

### في Dashboard:
1. **Database** → **Cron Jobs** (أو ابحث عن "Cron" أو "Schedule")
2. **New Cron Job**
3. املأ:

| الحقل | القيمة |
|------|--------|
| **Name** | `send-match-notifications` |
| **Schedule** | `0 16 * * 4` |
| **Function** | `send-match-notifications` |
| **Method** | `POST` |
| **Headers** | `{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc"}` |

4. **Save** ✅

---

## 🎉 انتهى!

الآن سيعمل تلقائياً كل خميس الساعة 4 مساءً.

---

## 📝 ملاحظة

إذا لم تجد "Cron Jobs" في Dashboard، يمكنك:
- استخدام **Database** → **Extensions** → تفعيل **pg_cron**
- أو استخدام ملف `SETUP_CRON_COMPLETE.sql` في SQL Editor
