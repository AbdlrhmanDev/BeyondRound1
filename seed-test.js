import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  try {
    const envPath = join(__dirname, '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️  Could not read .env.local, using process.env');
    return {};
  }
}

const env = loadEnvFile();
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================
// إعدادات قابلة للتخصيص
// ============================================
const CONFIG = {
  // عدد المستخدمين المراد إنشاؤهم
  USER_COUNT: parseInt(process.argv[2]) || 30,
  
  // هل ننشئ matches؟
  CREATE_MATCHES: process.argv.includes('--no-matches') ? false : true,
  
  // هل ننشئ groups؟
  CREATE_GROUPS: process.argv.includes('--no-groups') ? false : true,
  
  // هل ننظف البيانات القديمة؟
  CLEAN_OLD_DATA: process.argv.includes('--clean') ? true : false,
  
  // الحد الأدنى لنقاط المطابقة
  MIN_MATCH_SCORE: 20,
  
  // عدد المستخدمين في كل مجموعة
  GROUP_SIZE: 5
};

console.log('⚙️  Configuration:');
console.log(`   - User count: ${CONFIG.USER_COUNT}`);
console.log(`   - Create matches: ${CONFIG.CREATE_MATCHES}`);
console.log(`   - Create groups: ${CONFIG.CREATE_GROUPS}`);
console.log(`   - Clean old data: ${CONFIG.CLEAN_OLD_DATA}`);
console.log('');

// ============================================
// البيانات
// ============================================
const specialties = [
  'Internal Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology',
  'Psychiatry', 'Emergency Medicine', 'Anesthesiology', 'Radiology',
  'Dermatology', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'General Practice',
  'Pulmonology', 'Gastroenterology', 'Nephrology', 'Endocrinology'
];

const careerStages = [
  'medical_student', 'resident_junior', 'resident_senior', 'fellow',
  'attending_early', 'attending_senior', 'private_practice', 'academic'
];

const sports = ['running', 'cycling', 'swimming', 'gym', 'tennis', 'football', 'basketball', 'hiking', 'yoga', 'golf', 'volleyball', 'badminton'];
const socialStyles = ['introverted', 'extroverted', 'ambivert', 'social_butterfly', 'selective'];
const cultureInterests = ['art', 'music', 'theater', 'museums', 'literature', 'cinema', 'photography', 'poetry', 'dance'];
const lifestyles = ['minimalist', 'active', 'balanced', 'work_focused', 'family_oriented', 'adventure_seeker'];
const cities = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Abha', 'Tabuk', 'Buraidah', 'Khamis Mushait'];
const neighborhoods = ['Al Olaya', 'Al Malaz', 'Al Naseem', 'Al Wurud', 'Al Faisaliyah', 'Al Hamra', 'Al Rawdah', 'Al Aziziyah'];
const genders = ['male', 'female'];
const availabilitySlots = [
  'weekend_morning', 'weekend_evening', 'weekday_evening', 
  'weekday_afternoon', 'friday_morning', 'saturday_evening'
];

// ============================================
// Helper Functions
// ============================================
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, min = 2, max = 4) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================
// تنظيف البيانات القديمة (اختياري)
// ============================================
async function cleanOldData() {
  if (!CONFIG.CLEAN_OLD_DATA) return;

  console.log('🧹 Cleaning old test data...');
  
  try {
    // حذف المستخدمين الاختبارين القديمين
    const { data: oldUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .like('email', 'test_user_%@connectthrive.com');

    if (oldUsers && oldUsers.length > 0) {
      const userIds = oldUsers.map(u => u.user_id);
      
      // حذف من جداول مرتبطة
      await supabase.from('group_members').delete().in('user_id', userIds);
      await supabase.from('matches').delete().or(`user_id.in.(${userIds.join(',')}),matched_user_id.in.(${userIds.join(',')})`);
      await supabase.from('onboarding_preferences').delete().in('user_id', userIds);
      await supabase.from('profiles').delete().in('user_id', userIds);
      
      // حذف من auth
      for (const userId of userIds) {
        await supabase.auth.admin.deleteUser(userId);
      }
      
      console.log(`   ✅ Deleted ${oldUsers.length} old test users`);
    }
  } catch (error) {
    console.warn('   ⚠️  Could not clean old data:', error.message);
  }
}

// ============================================
// إنشاء مستخدم
// ============================================
async function createUser(userNumber) {
  const email = `test_user_${userNumber}@connectthrive.com`;
  const password = 'password123';
  const fullName = `Dr. Test User ${userNumber}`;
  
  // إنشاء بيانات واقعية مع تجميع للمطابقة الأفضل
  const groupIndex = Math.floor((userNumber - 1) / CONFIG.GROUP_SIZE);
  
  const specialty = getRandomItem(specialties);
  const careerStage = getRandomItem(careerStages);
  const gender = getRandomItem(genders);
  
  // تجميع المستخدمين في نفس المدينة للمطابقة الأفضل
  const city = cities[groupIndex % cities.length];
  const neighborhood = Math.random() > 0.5 ? getRandomItem(neighborhoods) : null;
  const birthYear = 1975 + Math.floor(Math.random() * 25); // أعمار 30-55
  
  // إنشاء اهتمامات متداخلة داخل المجموعات
  const baseSports = sports.slice(0, 6); // رياضات أساسية مشتركة
  const userSports = [...getRandomItems(baseSports, 3, 5), ...getRandomItems(sports.slice(6), 0, 2)];
  
  const userSocial = getRandomItems(socialStyles, 1, 2);
  const userCulture = getRandomItems(cultureInterests, 2, 5);
  const userLifestyle = getRandomItems(lifestyles, 1, 3);
  const userAvailability = getRandomItems(availabilitySlots, 2, 4);

  try {
    // إنشاء مستخدم auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error(`❌ Error creating user ${userNumber}:`, authError.message);
      return null;
    }

    const userId = authData.user.id;

    // إنشاء profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: fullName,
        city,
        neighborhood,
        gender,
        birth_year: birthYear,
        languages: ['Arabic', 'English'],
        status: 'active'
      });

    if (profileError) {
      console.error(`❌ Error creating profile for user ${userNumber}:`, profileError.message);
      return null;
    }

    // إنشاء onboarding preferences
    const { error: prefsError } = await supabase
      .from('onboarding_preferences')
      .insert({
        user_id: userId,
        specialty,
        career_stage: careerStage,
        sports: userSports,
        social_style: userSocial,
        culture_interests: userCulture,
        lifestyle: userLifestyle,
        goals: ['networking', 'friendship', 'activity_partners'],
        availability_slots: userAvailability,
        open_to_business: Math.random() > 0.7, // 30% مهتمين بالأعمال
        completed_at: new Date().toISOString()
      });

    if (prefsError) {
      console.error(`❌ Error creating preferences for user ${userNumber}:`, prefsError.message);
      return null;
    }

    console.log(`✅ Created user ${userNumber}: ${fullName} (${specialty}, ${city})`);
    return { userId, gender, specialty, city };
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userNumber}:`, error.message);
    return null;
  }
}

// ============================================
// حساب المطابقات
// ============================================
async function calculateMatches() {
  if (!CONFIG.CREATE_MATCHES) {
    console.log('⏭️  Skipping matches calculation (--no-matches flag)');
    return;
  }

  console.log('\n📊 Calculating matches...');
  console.log('   This may take a few minutes...\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('status', 'active');

  if (error || !profiles) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }

  const userIds = profiles.map(p => p.user_id);
  const totalPairs = (userIds.length * (userIds.length - 1)) / 2;
  let matchesCreated = 0;
  let processedPairs = 0;
  const batchSize = 20;

  console.log(`   Processing ${totalPairs} potential matches...\n`);

  for (let i = 0; i < userIds.length; i++) {
    const batch = [];
    
    for (let j = i + 1; j < userIds.length; j++) {
      const userA = userIds[i];
      const userB = userIds[j];
      
      batch.push({ userA, userB });
      
      if (batch.length >= batchSize || j === userIds.length - 1) {
        const batchResults = await Promise.all(
          batch.map(async ({ userA, userB }) => {
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .or(`and(user_id.eq.${userA},matched_user_id.eq.${userB}),and(user_id.eq.${userB},matched_user_id.eq.${userA})`)
              .maybeSingle();

            if (existingMatch) return null;

            const { data: score, error: scoreError } = await supabase.rpc('calculate_match_score', {
              user_a_id: userA,
              user_b_id: userB
            });

            if (scoreError || !score || score < CONFIG.MIN_MATCH_SCORE) return null;

            return {
              user_id: userA,
              matched_user_id: userB,
              match_score: score,
              status: 'pending'
            };
          })
        );

        const validMatches = batchResults.filter(m => m !== null);
        
        if (validMatches.length > 0) {
          const { error: batchError } = await supabase
            .from('matches')
            .insert(validMatches);

          if (!batchError) {
            matchesCreated += validMatches.length;
          }
        }

        processedPairs += batch.length;
        
        if (processedPairs % 100 === 0 || processedPairs === totalPairs) {
          const progress = ((processedPairs / totalPairs) * 100).toFixed(1);
          console.log(`   Progress: ${progress}% (${processedPairs}/${totalPairs} pairs, ${matchesCreated} matches created)`);
        }

        batch.length = 0;
      }
    }
  }

  console.log(`\n✅ Created ${matchesCreated} matches`);

  // قبول أفضل المطابقات
  const { error: acceptError } = await supabase
    .from('matches')
    .update({ status: 'accepted' })
    .gte('match_score', 60)
    .limit(20);

  if (!acceptError) {
    console.log('✅ Accepted top 20 matches (score ≥ 60)');
  }
}

// ============================================
// إنشاء المجموعات
// ============================================
async function createGroups() {
  if (!CONFIG.CREATE_GROUPS) {
    console.log('⏭️  Skipping groups creation (--no-groups flag)');
    return;
  }

  console.log('\n👥 Creating groups...');

  // حساب تاريخ الخميس القادم
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  const nextThursday = new Date(today);
  nextThursday.setUTCDate(today.getUTCDate() + daysUntilThursday);
  nextThursday.setUTCHours(0, 0, 0, 0);
  const weekDate = nextThursday.toISOString().split('T')[0];

  console.log(`   Match week: ${weekDate} (Next Thursday)`);

  const { data: users, error } = await supabase
    .from('profiles')
    .select('user_id, gender')
    .eq('status', 'active');

  if (error || !users) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  const shuffledUsers = users.sort(() => Math.random() - 0.5);
  const usersInGroups = new Set();
  const totalUsers = shuffledUsers.length;
  let processedUsers = 0;
  let groupNumber = 1;

  console.log(`   Distributing ${totalUsers} users into groups...\n`);

  for (const user of shuffledUsers) {
    if (usersInGroups.has(user.user_id)) continue;
    processedUsers++;
    
    if (processedUsers % 10 === 0) {
      const progress = ((processedUsers / totalUsers) * 100).toFixed(1);
      console.log(`   Progress: ${progress}% (${processedUsers}/${totalUsers} users processed)`);
    }

    let targetGroup = null;

    // محاولة إيجاد مجموعة مناسبة
    if (user.gender === 'female') {
      const { data: sameGenderGroups } = await supabase
        .from('match_groups')
        .select('id')
        .eq('status', 'active')
        .eq('match_week', weekDate)
        .eq('group_type', 'same_gender')
        .eq('gender_composition', 'all_female');

      for (const group of sameGenderGroups || []) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);
        
        if (members && members.length < CONFIG.GROUP_SIZE) {
          targetGroup = group.id;
          break;
        }
      }

      if (!targetGroup) {
        const { data: mixedGroups } = await supabase
          .from('match_groups')
          .select('id')
          .eq('status', 'active')
          .eq('match_week', weekDate)
          .eq('group_type', 'mixed');

        for (const group of mixedGroups || []) {
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id);
          
          if (members && members.length < CONFIG.GROUP_SIZE) {
            targetGroup = group.id;
            break;
          }
        }
      }
    } else {
      const { data: sameGenderGroups } = await supabase
        .from('match_groups')
        .select('id')
        .eq('status', 'active')
        .eq('match_week', weekDate)
        .eq('group_type', 'same_gender')
        .eq('gender_composition', 'all_male');

      for (const group of sameGenderGroups || []) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);
        
        if (members && members.length < CONFIG.GROUP_SIZE) {
          targetGroup = group.id;
          break;
        }
      }

      if (!targetGroup) {
        const { data: mixedGroups } = await supabase
          .from('match_groups')
          .select('id')
          .eq('status', 'active')
          .eq('match_week', weekDate)
          .eq('group_type', 'mixed');

        for (const group of mixedGroups || []) {
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id);
          
          if (members && members.length < CONFIG.GROUP_SIZE) {
            targetGroup = group.id;
            break;
          }
        }
      }
    }

    // إنشاء مجموعة جديدة إذا لزم الأمر
    if (!targetGroup) {
      const { data: existingGroups } = await supabase
        .from('match_groups')
        .select('group_type')
        .eq('match_week', weekDate)
        .eq('status', 'active');

      const mixedCount = existingGroups?.filter(g => g.group_type === 'mixed').length || 0;
      const sameCount = existingGroups?.filter(g => g.group_type === 'same_gender').length || 0;

      const groupType = sameCount <= mixedCount ? 'same_gender' : 'mixed';
      const genderComp = groupType === 'same_gender'
        ? (user.gender === 'female' ? 'all_female' : 'all_male')
        : (Math.random() < 0.5 ? '2F3M' : '3F2M');

      const { data: newGroup, error: groupError } = await supabase
        .from('match_groups')
        .insert({
          name: `Group ${groupNumber}`,
          group_type: groupType,
          gender_composition: genderComp,
          status: 'active',
          match_week: weekDate
        })
        .select()
        .single();

      if (groupError || !newGroup) {
        console.error('❌ Error creating group:', groupError);
        continue;
      }

      targetGroup = newGroup.id;
      groupNumber++;
    }

    // إضافة المستخدم للمجموعة
    if (targetGroup) {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: targetGroup,
          user_id: user.user_id
        });

      if (!memberError) {
        usersInGroups.add(user.user_id);
      }
    }
  }

  console.log(`✅ Created groups for ${usersInGroups.size} users`);
  
  // إحصائيات المجموعات
  const { data: groups } = await supabase
    .from('match_groups')
    .select('id, group_type, gender_composition')
    .eq('match_week', weekDate)
    .eq('status', 'active');
  
  if (groups) {
    const mixedCount = groups.filter(g => g.group_type === 'mixed').length;
    const sameCount = groups.filter(g => g.group_type === 'same_gender').length;
    console.log(`   - ${mixedCount} mixed groups`);
    console.log(`   - ${sameCount} same-gender groups`);
    console.log(`   - Total: ${groups.length} groups`);
  }
}

// ============================================
// التنفيذ الرئيسي
// ============================================
async function main() {
  console.log('🚀 Starting test seed process...\n');

  // تنظيف البيانات القديمة
  await cleanOldData();

  // الخطوة 1: إنشاء المستخدمين
  console.log(`👤 Creating ${CONFIG.USER_COUNT} users...`);
  const createdUsers = [];
  for (let i = 1; i <= CONFIG.USER_COUNT; i++) {
    const user = await createUser(i);
    if (user) {
      createdUsers.push(user);
    }
    // تأخير صغير لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Created ${createdUsers.length} users`);

  // الخطوة 2: حساب المطابقات
  await calculateMatches();

  // الخطوة 3: إنشاء المجموعات
  await createGroups();

  console.log('\n🎉 Seed process completed!');
  console.log(`\n📝 Login credentials:`);
  console.log(`   Email: test_user_1@connectthrive.com through test_user_${CONFIG.USER_COUNT}@connectthrive.com`);
  console.log(`   Password: password123`);
  console.log(`\n💡 Tips:`);
  console.log(`   - Use --clean to clean old test data before seeding`);
  console.log(`   - Use --no-matches to skip match calculation`);
  console.log(`   - Use --no-groups to skip group creation`);
  console.log(`   - Specify user count: node seed-test.js 50`);
}

main().catch(console.error);
