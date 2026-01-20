# إعداد نظام إنشاء المجموعات التلقائي

## نظرة عامة

تم إنشاء نظام تلقائي لإنشاء المجموعات كل أسبوع للمستخدمين الجدد. النظام يعمل على مرحلتين:

1. **إنشاء المجموعات** (كل أربعاء الساعة 12:00 ظهراً UTC)
2. **إرسال الإشعارات** (كل خميس الساعة 4:00 مساءً UTC)

## الملفات الجديدة

### 1. Edge Function: `create-match-groups`
- **المسار**: `supabase/functions/create-match-groups/index.ts`
- **الوظيفة**: 
  - يحسب نقاط المطابقة بين المستخدمين الجدد
  - ينشئ المجموعات تلقائياً للمستخدمين الذين ليسوا في مجموعات
  - يوزع المستخدمين على مجموعات من 5 أشخاص

### 2. Migration: `20260108000010_setup_create_groups_cron.sql`
- **الوظيفة**: إعداد Cron Job لاستدعاء Edge Function تلقائياً

## خطوات الإعداد

### الخطوة 1: نشر Edge Function

```bash
supabase functions deploy create-match-groups
```

### الخطوة 2: تشغيل Migration

قم بتشغيل migration في Supabase SQL Editor:

```sql
-- تشغيل الملف:
-- supabase/migrations/20260108000010_setup_create_groups_cron.sql
```

أو عبر CLI:

```bash
supabase db push
```

### الخطوة 3: التحقق من الإعدادات

تأكد من أن الإعدادات التالية موجودة في قاعدة البيانات:

```sql
-- التحقق من وجود الإعدادات
SELECT current_setting('app.settings.supabase_url', true) as supabase_url;
SELECT current_setting('app.settings.service_role_key', true) as service_role_key;
```

إذا لم تكن موجودة، قم بإعدادها:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**ملاحظة**: يمكنك إيجاد Service Role Key في: Supabase Dashboard → Settings → API → service_role key

### الخطوة 4: التحقق من Cron Jobs

```sql
-- عرض جميع Cron Jobs
SELECT * FROM cron.job;

-- عرض Cron Job الخاص بإنشاء المجموعات
SELECT * FROM cron.job WHERE jobname = 'create-match-groups-wednesday';

-- عرض Cron Job الخاص بإرسال الإشعارات
SELECT * FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm';
```

## الجدول الزمني

| اليوم | الوقت (UTC) | العملية |
|------|------------|---------|
| الأربعاء | 12:00 PM | إنشاء المجموعات للمستخدمين الجدد |
| الخميس | 4:00 PM | إرسال الإشعارات للمجموعات الجديدة |

## كيف يعمل النظام

### 1. إنشاء المجموعات (كل أربعاء)

1. **حساب نقاط المطابقة**:
   - يحسب نقاط المطابقة بين جميع المستخدمين النشطين
   - يستخدم دالة `calculate_match_score` الموجودة في قاعدة البيانات
   - يحفظ النتائج في جدول `matches`

2. **إنشاء المجموعات**:
   - يبحث عن المستخدمين الذين ليسوا في مجموعات لهذا الأسبوع
   - يحاول إضافة المستخدمين لمجموعات موجودة (إذا كان هناك مكان)
   - ينشئ مجموعات جديدة إذا لزم الأمر
   - كل مجموعة تحتوي على 5 أشخاص

3. **أنواع المجموعات**:
   - **same_gender**: مجموعات من نفس الجنس (all_female أو all_male)
   - **mixed**: مجموعات مختلطة (2F3M أو 3F2M)

### 2. إرسال الإشعارات (كل خميس)

- يبحث عن المجموعات النشطة لهذا الأسبوع
- يرسل إشعارات لجميع أعضاء المجموعات
- ينشئ محادثات جماعية للمجموعات الجديدة

## اختبار النظام

### اختبار Edge Function يدوياً

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-match-groups' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### اختبار Function من قاعدة البيانات

```sql
-- استدعاء Function يدوياً
SELECT public.create_match_groups();
```

### التحقق من النتائج

```sql
-- عرض المجموعات الجديدة
SELECT 
  mg.id,
  mg.name,
  mg.group_type,
  mg.gender_composition,
  mg.match_week,
  COUNT(gm.user_id) as member_count
FROM match_groups mg
LEFT JOIN group_members gm ON gm.group_id = mg.id
WHERE mg.match_week >= CURRENT_DATE
GROUP BY mg.id, mg.name, mg.group_type, mg.gender_composition, mg.match_week
ORDER BY mg.match_week DESC, mg.created_at DESC;

-- عرض المستخدمين في المجموعات
SELECT 
  p.full_name,
  mg.name as group_name,
  mg.match_week
FROM profiles p
JOIN group_members gm ON gm.user_id = p.user_id
JOIN match_groups mg ON mg.id = gm.group_id
WHERE mg.match_week >= CURRENT_DATE
ORDER BY mg.match_week DESC, mg.name;
```

## استكشاف الأخطاء

### المشكلة: Cron Job لا يعمل

**الحل**:
1. تأكد من تفعيل `pg_cron` extension
2. تحقق من وجود الإعدادات (supabase_url و service_role_key)
3. راجع logs في Supabase Dashboard → Edge Functions → Logs

### المشكلة: لا يتم إنشاء مجموعات

**الحل**:
1. تأكد من وجود مستخدمين نشطين (`status = 'active'`)
2. تحقق من أن المستخدمين أكملوا عملية Onboarding
3. راجع logs في Edge Function

### المشكلة: خطأ في حساب نقاط المطابقة

**الحل**:
1. تأكد من وجود بيانات في `onboarding_preferences` لجميع المستخدمين
2. تحقق من وجود دالة `calculate_match_score` في قاعدة البيانات

## ملاحظات مهمة

1. **الأداء**: عملية حساب نقاط المطابقة قد تستغرق وقتاً طويلاً إذا كان هناك عدد كبير من المستخدمين. النظام يعالج المطابقات على دفعات (batches) لتحسين الأداء.

2. **المستخدمون الجدد**: المستخدمون الذين يسجلون بعد الأربعاء لن يتم إضافتهم لمجموعات حتى الأربعاء القادم.

3. **التكرار**: يمكن تشغيل الـ function عدة مرات بأمان - لن ينشئ مجموعات مكررة للمستخدمين الموجودين بالفعل في مجموعات.

4. **الحد الأدنى**: يجب أن يكون هناك على الأقل 5 مستخدمين نشطين لإنشاء مجموعة واحدة.

## التطوير المستقبلي

يمكن تحسين النظام في المستقبل:

1. **مطابقة ذكية**: استخدام نقاط المطابقة لتجميع المستخدمين المتشابهين في نفس المجموعة
2. **إشعارات فورية**: إضافة المستخدمين الجدد للمجموعات فور تسجيلهم (إذا كان هناك مجموعات غير مكتملة)
3. **إعادة التوزيع**: إعادة توزيع المستخدمين من المجموعات القديمة على مجموعات جديدة
