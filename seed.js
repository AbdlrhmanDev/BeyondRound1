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

// Data arrays
const specialties = [
  'Internal Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology',
  'Psychiatry', 'Emergency Medicine', 'Anesthesiology', 'Radiology',
  'Dermatology', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'General Practice'
];

const careerStages = [
  'medical_student', 'resident_junior', 'resident_senior', 'fellow',
  'attending_early', 'attending_senior', 'private_practice', 'academic'
];

const sports = ['running', 'cycling', 'swimming', 'gym', 'tennis', 'football', 'basketball', 'hiking', 'yoga', 'golf'];
const socialStyles = ['introverted', 'extroverted', 'ambivert', 'social_butterfly', 'selective'];
const cultureInterests = ['art', 'music', 'theater', 'museums', 'literature', 'cinema', 'photography'];
const lifestyles = ['minimalist', 'active', 'balanced', 'work_focused', 'family_oriented'];
const cities = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Abha', 'Tabuk'];
const genders = ['male', 'female'];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, min = 2, max = 4) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function createUser(userNumber) {
  const email = `test_user_${userNumber}@connectthrive.com`;
  const password = 'password123';
  const fullName = `Dr. Test User ${userNumber}`;
  
  // Create more realistic data with some clustering for better matches
  // Use modulo to create groups with similar interests
  const groupIndex = Math.floor((userNumber - 1) / 5); // Groups of 5 users
  
  // Random data with some clustering
  const specialty = getRandomItem(specialties);
  const careerStage = getRandomItem(careerStages);
  const gender = getRandomItem(genders);
  // Cluster users in same cities for better location matches
  const city = cities[groupIndex % cities.length]; // Same city for groups
  const birthYear = 1975 + Math.floor(Math.random() * 20); // Ages 30-50 (more realistic)
  
  // Create overlapping interests within groups for better matches
  const baseSports = sports.slice(0, 5); // Base sports that many will share
  const randomSports = [...baseSports, ...getRandomItems(sports.slice(5), 0, 2)];
  
  const randomSocial = getRandomItems(socialStyles, 1, 2);
  const randomCulture = getRandomItems(cultureInterests, 2, 4); // More culture interests
  const randomLifestyle = getRandomItems(lifestyles, 1, 2);

  try {
    // Create auth user
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

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: fullName,
        city,
        gender,
        birth_year: birthYear,
        languages: ['Arabic', 'English'],
        status: 'active'
      });

    if (profileError) {
      console.error(`❌ Error creating profile for user ${userNumber}:`, profileError.message);
      return null;
    }

    // Create onboarding preferences
    const { error: prefsError } = await supabase
      .from('onboarding_preferences')
      .insert({
        user_id: userId,
        specialty,
        career_stage: careerStage,
        sports: randomSports,
        social_style: randomSocial,
        culture_interests: randomCulture,
        lifestyle: randomLifestyle,
        goals: ['networking', 'friendship', 'activity_partners'],
        availability_slots: ['weekend_morning', 'weekend_evening', 'weekday_evening'],
        open_to_business: Math.random() > 0.7, // 30% open to business
        completed_at: new Date().toISOString()
      });

    if (prefsError) {
      console.error(`❌ Error creating preferences for user ${userNumber}:`, prefsError.message);
      return null;
    }

    console.log(`✅ Created user ${userNumber}: ${fullName} (${specialty})`);
    return { userId, gender, specialty };
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userNumber}:`, error.message);
    return null;
  }
}

async function calculateMatches() {
  console.log('\n📊 Calculating matches...');
  console.log('   This may take a few minutes...\n');
  
  // Get all user IDs
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
  const batchSize = 20; // Process 20 matches in parallel
  const matchesToInsert = [];

  console.log(`   Processing ${totalPairs} potential matches...\n`);

  // Calculate matches between all pairs
  for (let i = 0; i < userIds.length; i++) {
    const batch = [];
    
    for (let j = i + 1; j < userIds.length; j++) {
      const userA = userIds[i];
      const userB = userIds[j];
      
      batch.push({ userA, userB });
      
      // Process batch when it reaches batchSize or at end
      if (batch.length >= batchSize || j === userIds.length - 1) {
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async ({ userA, userB }) => {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .or(`and(user_id.eq.${userA},matched_user_id.eq.${userB}),and(user_id.eq.${userB},matched_user_id.eq.${userA})`)
              .maybeSingle();

            if (existingMatch) return null;

            // Calculate match score using RPC
            const { data: score, error: scoreError } = await supabase.rpc('calculate_match_score', {
              user_a_id: userA,
              user_b_id: userB
            });

            // Lower threshold to get more matches
            if (scoreError || !score || score < 20) return null;

            return {
              user_id: userA,
              matched_user_id: userB,
              match_score: score,
              status: 'pending'
            };
          })
        );

        // Filter out nulls and insert valid matches
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
        
        // Progress update every 100 pairs
        if (processedPairs % 100 === 0 || processedPairs === totalPairs) {
          const progress = ((processedPairs / totalPairs) * 100).toFixed(1);
          console.log(`   Progress: ${progress}% (${processedPairs}/${totalPairs} pairs, ${matchesCreated} matches created)`);
        }

        batch.length = 0; // Clear batch
      }
    }
  }

  console.log(`\n✅ Created ${matchesCreated} matches`);

  // Accept top matches
  const { error: acceptError } = await supabase
    .from('matches')
    .update({ status: 'accepted' })
    .gte('match_score', 60)
    .limit(20);

  if (!acceptError) {
    console.log('✅ Accepted top 20 matches');
  }
}

async function createGroups() {
  console.log('\n👥 Creating groups...');

  // Get current Thursday (match week)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  const currentWeek = new Date(today);
  currentWeek.setDate(today.getDate() + daysUntilThursday);
  if (dayOfWeek > 4) {
    currentWeek.setDate(currentWeek.getDate() - 7);
  }
  currentWeek.setHours(0, 0, 0, 0);
  const weekDate = currentWeek.toISOString().split('T')[0];

  // Get all users with their genders
  const { data: users, error } = await supabase
    .from('profiles')
    .select('user_id, gender')
    .eq('status', 'active');

  if (error || !users) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  // Shuffle users
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

    // Try to find existing group with space
    let targetGroup = null;

    if (user.gender === 'female') {
      // Try same-gender female group
      const { data: allGroups } = await supabase
        .from('match_groups')
        .select('id, group_type, gender_composition')
        .eq('status', 'active')
        .eq('match_week', weekDate)
        .eq('group_type', 'same_gender')
        .eq('gender_composition', 'all_female');

      if (allGroups && allGroups.length > 0) {
        for (const group of allGroups) {
          const { data: members } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.id);
          
          if (members && members.length < 5) {
            targetGroup = group.id;
            break;
          }
        }
      }

      // Try mixed group if no same-gender group
      if (!targetGroup) {
        const { data: mixedGroups } = await supabase
          .from('match_groups')
          .select('id')
          .eq('status', 'active')
          .eq('match_week', weekDate)
          .eq('group_type', 'mixed');

        if (mixedGroups && mixedGroups.length > 0) {
          for (const group of mixedGroups) {
            const { data: members } = await supabase
              .from('group_members')
              .select('*')
              .eq('group_id', group.id);
            
            if (members && members.length < 5) {
              targetGroup = group.id;
              break;
            }
          }
        }
      }
    } else {
      // Try same-gender male group
      const { data: allGroups } = await supabase
        .from('match_groups')
        .select('id, group_type, gender_composition')
        .eq('status', 'active')
        .eq('match_week', weekDate)
        .eq('group_type', 'same_gender')
        .eq('gender_composition', 'all_male');

      if (allGroups && allGroups.length > 0) {
        for (const group of allGroups) {
          const { data: members } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.id);
          
          if (members && members.length < 5) {
            targetGroup = group.id;
            break;
          }
        }
      }

      // Try mixed group if no same-gender group
      if (!targetGroup) {
        const { data: mixedGroups } = await supabase
          .from('match_groups')
          .select('id')
          .eq('status', 'active')
          .eq('match_week', weekDate)
          .eq('group_type', 'mixed');

        if (mixedGroups && mixedGroups.length > 0) {
          for (const group of mixedGroups) {
            const { data: members } = await supabase
              .from('group_members')
              .select('*')
              .eq('group_id', group.id);
            
            if (members && members.length < 5) {
              targetGroup = group.id;
              break;
            }
          }
        }
      }
    }

    // Create new group if needed
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

    // Add user to group
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

  console.log(`✅ Created groups for ${usersInGroups.size} users`);
  
  // Show group statistics
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

// Main execution
async function main() {
  console.log('🚀 Starting seed process...\n');

  // Step 1: Create 50 users
  console.log('👤 Creating 50 users...');
  const createdUsers = [];
  for (let i = 1; i <= 50; i++) {
    const user = await createUser(i);
    if (user) {
      createdUsers.push(user);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Created ${createdUsers.length} users`);

  // Step 2: Calculate matches
  await calculateMatches();

  // Step 3: Create groups
  await createGroups();

  console.log('\n🎉 Seed process completed!');
  console.log(`\n📝 Login credentials:`);
  console.log(`   Email: test_user_1@connectthrive.com`);
  console.log(`   Password: password123`);
  console.log(`   (Same for test_user_2 through test_user_50)`);
}

main().catch(console.error);
