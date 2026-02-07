'use client';

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Sparkles, Check, Mail, Lock, Eye, EyeOff, Camera, Upload, FileCheck, Zap, Star, Trophy, Languages, Globe } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getProfile, updateProfile } from "@/services/profileService";
import { getOnboardingPreferences, saveOnboardingPreferences, markOnboardingComplete } from "@/services/onboardingService";
import { uploadAvatar, uploadLicense } from "@/services/storageService";
import { createNotification } from "@/services/notificationService";
import { LocationSelect } from "@/components/LocationSelect";
import { LanguageLinks } from "@/components/marketing/LanguageLinks";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { CalculateScoreBadge } from "@/components/CalculateScoreBadge";

interface ExtendedError extends Error {
  status?: number;
  code?: string;
  userCreated?: boolean;
}

interface QuestionOption {
  id: string;
  label: string;
  icon?: string;
}

interface OnboardingQuestion {
  id: string;
  title: string;
  subtitle: string;
  options?: QuestionOption[];
  multiSelect?: boolean;
  inputType?: "personal-info" | "signup";
  skipable?: boolean;
  isEssential?: boolean; // Mark essential questions for minimal onboarding flow
}

const questions: OnboardingQuestion[] = [
  // MEDICAL BACKGROUND
  {
    id: "specialty",
    title: "What's your specialty?",
    subtitle: "Match with similar or complementary fields",
    isEssential: true, // 30% of match score
    options: [
      { id: "General Practice", label: "General Practice", icon: "🏥" },
      { id: "Internal Medicine", label: "Internal Medicine", icon: "🩺" },
      { id: "Surgery", label: "Surgery", icon: "⚕️" },
      { id: "Pediatrics", label: "Pediatrics", icon: "👶" },
      { id: "Cardiology", label: "Cardiology", icon: "❤️" },
      { id: "Neurology", label: "Neurology", icon: "🧠" },
      { id: "Psychiatry", label: "Psychiatry", icon: "💭" },
      { id: "Emergency Medicine", label: "Emergency Medicine", icon: "🚑" },
      { id: "Anesthesiology", label: "Anesthesiology", icon: "💉" },
      { id: "Radiology", label: "Radiology", icon: "📷" },
      { id: "Dermatology", label: "Dermatology", icon: "✨" },
      { id: "Orthopedics", label: "Orthopedics", icon: "🦴" },
      { id: "Ophthalmology", label: "Ophthalmology", icon: "👁️" },
      { id: "Gynecology", label: "OB/GYN", icon: "👩‍⚕️" },
      { id: "Oncology", label: "Oncology", icon: "🎗️" },
      { id: "Other", label: "Other", icon: "➕" },
    ],
  },
  {
    id: "stage",
    title: "Where are you in your career?",
    subtitle: "Match with physicians at similar stages",
    isEssential: true, // Important for filtering
    options: [
      { id: "medical_student", label: "Medical Student", icon: "📚" },
      { id: "resident_junior", label: "Resident (1st-2nd yr)", icon: "🩺" },
      { id: "resident_senior", label: "Resident (3rd+ yr)", icon: "📋" },
      { id: "fellow", label: "Fellow", icon: "🎓" },
      { id: "attending_early", label: "Attending (0-5 yrs)", icon: "👨‍⚕️" },
      { id: "attending_senior", label: "Attending (5+ yrs)", icon: "⭐" },
      { id: "private_practice", label: "Private Practice", icon: "🏢" },
      { id: "academic", label: "Academic Medicine", icon: "🔬" },
    ],
  },
  {
    id: "specialty_preference",
    title: "Specialty preference for groups?",
    subtitle: "Who would you like to meet?",
    options: [
      { id: "same", label: "Same specialty", icon: "🎯" },
      { id: "different", label: "Different specialties", icon: "🌈" },
      { id: "no_preference", label: "No preference", icon: "🤷" },
    ],
  },
  {
    id: "group_language_preference",
    title: "Preferred group language?",
    subtitle: "What language would you like the group to communicate in?",
    isEssential: true,
    options: [
      { id: "english", label: "English", icon: "🇬🇧" },
      { id: "german", label: "German", icon: "🇩🇪" },
      { id: "both", label: "Both English & German", icon: "🌍" },
    ],
  },
  // SPORTS & FITNESS
  {
    id: "sports",
    title: "Sports & fitness interests?",
    subtitle: "Find activity partners",
    multiSelect: true,
    skipable: true,
    options: [
      { id: "running", label: "Running", icon: "🏃" },
      { id: "cycling", label: "Cycling", icon: "🚴" },
      { id: "swimming", label: "Swimming", icon: "🏊" },
      { id: "gym", label: "Gym/Weights", icon: "🏋️" },
      { id: "tennis", label: "Tennis/Padel", icon: "🎾" },
      { id: "football", label: "Football", icon: "⚽" },
      { id: "basketball", label: "Basketball", icon: "🏀" },
      { id: "climbing", label: "Climbing", icon: "🧗" },
      { id: "hiking", label: "Hiking", icon: "🥾" },
      { id: "yoga", label: "Yoga/Pilates", icon: "🧘" },
      { id: "martial_arts", label: "Martial Arts", icon: "🥋" },
      { id: "golf", label: "Golf", icon: "⛳" },
      { id: "skiing", label: "Skiing/Snowboard", icon: "⛷️" },
      { id: "dancing", label: "Dancing", icon: "💃" },
      { id: "water_sports", label: "Water Sports", icon: "🏄" },
    ],
  },
  {
    id: "activity_level",
    title: "How active are you?",
    subtitle: "Match your energy level",
    options: [
      { id: "very_active", label: "Very Active (5+/week)", icon: "🔥" },
      { id: "active", label: "Active (3-4/week)", icon: "💪" },
      { id: "moderate", label: "Moderate (1-2/week)", icon: "🚶" },
      { id: "occasional", label: "Occasionally", icon: "🌿" },
      { id: "non_physical", label: "Non-physical preferred", icon: "☕" },
    ],
  },
  // ENTERTAINMENT & CULTURE
  {
    id: "music_preferences",
    title: "Music preferences?",
    subtitle: "Connect over shared tastes",
    multiSelect: true,
    skipable: true,
    options: [
      { id: "pop", label: "Pop", icon: "🎤" },
      { id: "rock", label: "Rock", icon: "🎸" },
      { id: "hiphop", label: "Hip-Hop/Rap", icon: "🎧" },
      { id: "electronic", label: "Electronic/EDM", icon: "🎹" },
      { id: "classical", label: "Classical", icon: "🎻" },
      { id: "jazz", label: "Jazz", icon: "🎷" },
      { id: "rnb", label: "R&B/Soul", icon: "🎵" },
      { id: "indie", label: "Indie/Alt", icon: "🎶" },
      { id: "latin", label: "Latin", icon: "💃" },
      { id: "world", label: "World Music", icon: "🌍" },
    ],
  },
  {
    id: "movie_preferences",
    title: "Movies & TV preferences?",
    subtitle: "Find binge-watching buddies",
    multiSelect: true,
    skipable: true,
    options: [
      { id: "action", label: "Action", icon: "💥" },
      { id: "comedy", label: "Comedy", icon: "😂" },
      { id: "drama", label: "Drama", icon: "🎭" },
      { id: "thriller", label: "Thriller/Horror", icon: "😱" },
      { id: "scifi", label: "Sci-Fi/Fantasy", icon: "🚀" },
      { id: "documentary", label: "Documentaries", icon: "📹" },
      { id: "romance", label: "Romance", icon: "💕" },
      { id: "crime", label: "Crime/Mystery", icon: "🔍" },
      { id: "animated", label: "Animated", icon: "🎨" },
    ],
  },
  // OTHER INTERESTS
  {
    id: "other_interests",
    title: "Other interests?",
    subtitle: "What else are you into?",
    multiSelect: true,
    skipable: true,
    options: [
      { id: "reading", label: "Reading", icon: "📚" },
      { id: "cooking", label: "Cooking", icon: "👨‍🍳" },
      { id: "photography", label: "Photography", icon: "📸" },
      { id: "travel", label: "Travel", icon: "✈️" },
      { id: "art", label: "Art/Museums", icon: "🎨" },
      { id: "board_games", label: "Board Games", icon: "🎲" },
      { id: "video_games", label: "Video Games", icon: "🎮" },
      { id: "podcasts", label: "Podcasts", icon: "🎙️" },
      { id: "wine", label: "Wine/Beer", icon: "🍷" },
      { id: "coffee", label: "Coffee Culture", icon: "☕" },
      { id: "gardening", label: "Gardening", icon: "🌱" },
      { id: "tech", label: "Technology", icon: "💻" },
      { id: "volunteering", label: "Volunteering", icon: "🤝" },
    ],
  },
  // SOCIAL PREFERENCES
  {
    id: "meeting_activities",
    title: "Preferred meeting activities?",
    subtitle: "How do you like to hang out?",
    multiSelect: true,
    options: [
      { id: "coffee", label: "Coffee/Café", icon: "☕" },
      { id: "dinner", label: "Dinner", icon: "🍽️" },
      { id: "drinks", label: "Drinks/Bar", icon: "🍸" },
      { id: "outdoor", label: "Outdoor Walks", icon: "🌳" },
      { id: "sports", label: "Sports Together", icon: "⚽" },
      { id: "movies", label: "Movies/Theater", icon: "🎬" },
      { id: "museums", label: "Museums/Culture", icon: "🏛️" },
      { id: "home", label: "Home Gatherings", icon: "🏠" },
      { id: "concerts", label: "Concerts/Music", icon: "🎵" },
      { id: "trips", label: "Day Trips", icon: "🚗" },
      { id: "games", label: "Game Nights", icon: "🎲" },
    ],
  },
  {
    id: "social_energy",
    title: "What's your social energy?",
    subtitle: "Find compatible group sizes",
    options: [
      { id: "high", label: "High - Love big groups", icon: "🎉" },
      { id: "moderate", label: "Moderate - Small groups", icon: "👥" },
      { id: "low", label: "Low key - Intimate", icon: "🤫" },
      { id: "varies", label: "Varies by mood", icon: "🌙" },
    ],
  },
  {
    id: "conversation_style",
    title: "Conversation style?",
    subtitle: "Find your vibe",
    options: [
      { id: "deep", label: "Deep & meaningful", icon: "💭" },
      { id: "light", label: "Light & fun", icon: "😄" },
      { id: "hobby", label: "Hobby-focused", icon: "🎯" },
      { id: "professional", label: "Professional topics", icon: "💼" },
      { id: "mix", label: "Mix of everything", icon: "🌈" },
    ],
  },
  // AVAILABILITY
  {
    id: "availability",
    title: "When are you free?",
    subtitle: "Match with compatible schedules",
    isEssential: true, // 10% of match score
    multiSelect: true,
    options: [
      { id: "fri_evening", label: "Fri Evening", icon: "🌆" },
      { id: "sat_morning", label: "Sat Morning", icon: "🌅" },
      { id: "sat_afternoon", label: "Sat Afternoon", icon: "☀️" },
      { id: "sat_evening", label: "Sat Evening", icon: "🌙" },
      { id: "sun_morning", label: "Sun Morning", icon: "🌄" },
      { id: "sun_afternoon", label: "Sun Afternoon", icon: "🌤️" },
      { id: "sun_evening", label: "Sun Evening", icon: "🌆" },
      { id: "weekday_eve", label: "Weekday Evenings", icon: "🌃" },
    ],
  },
  {
    id: "meeting_frequency",
    title: "How often to meet?",
    subtitle: "Set expectations",
    options: [
      { id: "weekly", label: "Weekly", icon: "📅" },
      { id: "biweekly", label: "Bi-weekly", icon: "📆" },
      { id: "monthly", label: "Monthly", icon: "🗓️" },
      { id: "flexible", label: "As schedules allow", icon: "🤷" },
    ],
  },
  // GOALS
  {
    id: "goals",
    title: "What are you looking for?",
    subtitle: "Define your friendship goals",
    isEssential: true, // Part of Interests (40% of match score)
    multiSelect: true,
    options: [
      { id: "casual_friends", label: "Casual Friends", icon: "👋" },
      { id: "close_friends", label: "Close Friends", icon: "🤝" },
      { id: "activity_partners", label: "Activity Partners", icon: "🎯" },
      { id: "social_group", label: "A Social Circle", icon: "👥" },
      { id: "mentorship", label: "Mentorship", icon: "🎓" },
      { id: "business", label: "Business Connections", icon: "💼" },
      { id: "study_partners", label: "Study Partners", icon: "📖" },
      { id: "travel_buddies", label: "Travel Buddies", icon: "✈️" },
    ],
  },
  // LIFESTYLE
  {
    id: "dietary_preferences",
    title: "Dietary preferences?",
    subtitle: "For planning meetups",
    multiSelect: true,
    skipable: true,
    options: [
      { id: "none", label: "No restrictions", icon: "🍽️" },
      { id: "vegetarian", label: "Vegetarian", icon: "🥗" },
      { id: "vegan", label: "Vegan", icon: "🌱" },
      { id: "halal", label: "Halal", icon: "🌙" },
      { id: "kosher", label: "Kosher", icon: "✡️" },
      { id: "gluten_free", label: "Gluten-free", icon: "🌾" },
    ],
  },
  {
    id: "life_stage",
    title: "Life stage?",
    subtitle: "Connect with similar lifestyles",
    options: [
      { id: "single", label: "Single, no kids", icon: "🙋" },
      { id: "relationship", label: "In a relationship", icon: "💑" },
      { id: "married_no_kids", label: "Married, no kids", icon: "💍" },
      { id: "young_children", label: "Have young children", icon: "👶" },
      { id: "older_children", label: "Have older children", icon: "👨‍👩‍👧" },
      { id: "empty_nester", label: "Empty nester", icon: "🏠" },
      { id: "prefer_not_say", label: "Prefer not to say", icon: "🤐" },
    ],
  },
  {
    id: "ideal_weekend",
    title: "Your ideal weekend?",
    subtitle: "Find like-minded people",
    multiSelect: true,
    options: [
      { id: "adventure", label: "Adventure", icon: "🏔️" },
      { id: "relaxation", label: "Relaxation", icon: "🛋️" },
      { id: "social", label: "Social activities", icon: "🎉" },
      { id: "cultural", label: "Cultural outings", icon: "🎭" },
      { id: "fitness", label: "Sports & fitness", icon: "💪" },
      { id: "home", label: "Home projects", icon: "🏡" },
      { id: "mix", label: "Mix of everything", icon: "🌈" },
    ],
  },
  // PERSONAL INFO
  {
    id: "personal_info",
    title: "Tell us about yourself",
    subtitle: "Personal information for your profile",
    isEssential: true, // Location (20% of match score) + License verification
    inputType: "personal-info",
  },
  // SIGNUP - FINAL STEP
  {
    id: "signup",
    title: "Create your account",
    subtitle: "Join BeyondRounds today",
    isEssential: true, // Account creation required
    inputType: "signup",
  },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => currentYear - 25 - i);

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const Onboarding = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // Filter to show only essential questions (6 questions)
  const essentialQuestions = questions.filter(q => q.isEssential === true);
  const [filteredQuestions, setFilteredQuestions] = useState<OnboardingQuestion[]>(essentialQuestions);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    country: "",
    state: "",
    city: "",
    neighborhood: "",
    gender: "",
    birthYear: "",
    genderPreference: "",
    nationality: "",
  });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [showScoreCalculation, setShowScoreCalculation] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useLocalizedNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  // Load existing data and filter out completed questions
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) {
        setLoadingExisting(false);
        return;
      }

      try {
        const [profile, prefs] = await Promise.all([
          getProfile(user.id),
          getOnboardingPreferences(user.id),
        ]);

        // Map existing data to answers
        const existingAnswers: Record<string, string[]> = {};
        const completedQuestionIds = new Set<string>();

        // Check profile data (personal-info step)
        if (profile?.full_name && profile?.city && profile?.license_url) {
          completedQuestionIds.add("personal_info");
          setPersonalInfo({
            name: profile.full_name || "",
            country: profile.country || "",
            state: profile.state || "",
            city: profile.city || "",
            neighborhood: profile.neighborhood || "",
            gender: profile.gender || "",
            birthYear: profile.birth_year?.toString() || "",
            genderPreference: profile.gender_preference || "",
            nationality: profile.nationality || "",
          });
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
          if (profile.license_url) {
            setLicensePreview(profile.license_url);
          }
        }

        // Check preferences data
        if (prefs) {
          if (prefs.specialty) {
            existingAnswers.specialty = [prefs.specialty];
            completedQuestionIds.add("specialty");
          }
          if (prefs.career_stage) {
            existingAnswers.stage = [prefs.career_stage];
            completedQuestionIds.add("stage");
          }
          if (prefs.specialty_preference) {
            existingAnswers.specialty_preference = [prefs.specialty_preference];
            completedQuestionIds.add("specialty_preference");
          }
          if (prefs.group_language_preference) {
            existingAnswers.group_language_preference = [prefs.group_language_preference];
            completedQuestionIds.add("group_language_preference");
          }
          if (prefs.sports && prefs.sports.length > 0) {
            existingAnswers.sports = prefs.sports;
            completedQuestionIds.add("sports");
          }
          if (prefs.activity_level) {
            existingAnswers.activity_level = [prefs.activity_level];
            completedQuestionIds.add("activity_level");
          }
          if (prefs.music_preferences && prefs.music_preferences.length > 0) {
            existingAnswers.music_preferences = prefs.music_preferences;
            completedQuestionIds.add("music_preferences");
          }
          if (prefs.movie_preferences && prefs.movie_preferences.length > 0) {
            existingAnswers.movie_preferences = prefs.movie_preferences;
            completedQuestionIds.add("movie_preferences");
          }
          if (prefs.other_interests && prefs.other_interests.length > 0) {
            existingAnswers.other_interests = prefs.other_interests;
            completedQuestionIds.add("other_interests");
          }
          if (prefs.meeting_activities && prefs.meeting_activities.length > 0) {
            existingAnswers.meeting_activities = prefs.meeting_activities;
            completedQuestionIds.add("meeting_activities");
          }
          if (prefs.social_energy) {
            existingAnswers.social_energy = [prefs.social_energy];
            completedQuestionIds.add("social_energy");
          }
          if (prefs.conversation_style) {
            existingAnswers.conversation_style = [prefs.conversation_style];
            completedQuestionIds.add("conversation_style");
          }
          if (prefs.availability_slots && prefs.availability_slots.length > 0) {
            existingAnswers.availability = prefs.availability_slots;
            completedQuestionIds.add("availability");
          }
          if (prefs.meeting_frequency) {
            existingAnswers.meeting_frequency = [prefs.meeting_frequency];
            completedQuestionIds.add("meeting_frequency");
          }
          if (prefs.goals && prefs.goals.length > 0) {
            existingAnswers.goals = prefs.goals;
            completedQuestionIds.add("goals");
          }
          if (prefs.dietary_preferences && prefs.dietary_preferences.length > 0) {
            existingAnswers.dietary_preferences = prefs.dietary_preferences;
            completedQuestionIds.add("dietary_preferences");
          }
          if (prefs.life_stage) {
            existingAnswers.life_stage = [prefs.life_stage];
            completedQuestionIds.add("life_stage");
          }
          if (prefs.ideal_weekend && prefs.ideal_weekend.length > 0) {
            existingAnswers.ideal_weekend = prefs.ideal_weekend;
            completedQuestionIds.add("ideal_weekend");
          }
        }

        setAnswers(existingAnswers);

        // Filter to show only essential questions, then filter out completed ones
        const essentialQuestionsList = questions.filter(q => q.isEssential === true);
        
        // Filter out completed questions and signup (if user is logged in)
        const remainingQuestions = essentialQuestionsList.filter((q) => {
          // Skip signup step if user is already logged in
          if (q.inputType === "signup" && user) {
            return false;
          }
          // Skip completed questions
          // For personal-info, check by inputType since it's a special case
          if (q.inputType === "personal-info") {
            return !completedQuestionIds.has("personal_info");
          }
          return !completedQuestionIds.has(q.id);
        });

        setFilteredQuestions(remainingQuestions);
        setCurrentStep(0);
      } catch (error) {
        const { handleError } = await import('@/utils/errorHandler');
        handleError(error, 'Onboarding - Load Existing Data');
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExistingData();
  }, [user]);

  const question = filteredQuestions[currentStep];
  const currentAnswers = answers[question?.id] || [];

  // Calculate progress and milestones
  const totalSteps = filteredQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const remainingSteps = totalSteps - (currentStep + 1);
  const estimatedMinutes = Math.ceil(remainingSteps * 0.5); // ~30 seconds per question
  
  // Milestone checkpoints
  const milestones = [25, 50, 75, 100];
  const currentMilestone = milestones.find(m => progress >= m) || 0;
  const nextMilestone = milestones.find(m => progress < m);
  
  // Encouragement messages based on progress
  const getEncouragementMessage = () => {
    if (progress >= 100) return { text: t("onboarding.encouragementAlmostThere"), icon: Trophy };
    if (progress >= 75) return { text: t("onboarding.encouragementDoingGreat"), icon: Star };
    if (progress >= 50) return { text: t("onboarding.encouragementHalfway"), icon: Zap };
    if (progress >= 25) return { text: t("onboarding.encouragementGreatStart"), icon: Sparkles };
    return { text: t("onboarding.encouragementStart"), icon: Sparkles };
  };

  const encouragement = getEncouragementMessage();

  // Early return if no question available
  if (loadingExisting) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-foreground dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-foreground/50">{t("onboarding.loading")}</p>
        </div>
      </div>
    );
  }

  if (!question || filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-foreground dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">{t("onboarding.allDone")}</h2>
          <p className="text-primary-foreground/50 mb-4">{t("onboarding.allDoneDesc")}</p>
          <Button onClick={() => navigate("/dashboard")}>{t("onboarding.goToDashboard")}</Button>
        </div>
      </div>
    );
  }

  const getOptionLabel = (qId: string, optId: string) => t(`onboarding.${qId}.${optId}`, optId);

  const handleSelect = (optionId: string) => {
    if (!question) return;
    
    if (question.multiSelect) {
      setAnswers(prev => ({
        ...prev,
        [question.id]: currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [question.id]: [optionId]
      }));
    }
  };

  const handlePersonalInfoChange = (key: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t("onboarding.personal_info.fileTooLarge"), description: t("onboarding.personal_info.imageUnder5MB"), variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t("onboarding.personal_info.fileTooLarge"), description: t("onboarding.personal_info.fileUnder10MB"), variant: "destructive" });
        return;
      }
      setLicenseFile(file);
      if (file.type.startsWith('image/')) {
        setLicensePreview(URL.createObjectURL(file));
      } else {
        setLicensePreview(null);
      }
    }
  };

  const validateSignup = () => {
    try {
      signupSchema.parse(signupData);
      const fieldErrors: { email?: string; password?: string } = {};
      
      // Check password confirmation
      if (signupData.password !== confirmPassword) {
        fieldErrors.password = t("onboarding.signup.passwordsDontMatch");
        setErrors(fieldErrors);
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleCreateAccount = async () => {
    if (!validateSignup()) return;
    
    setIsLoading(true);
    
    try {
      const { error, data } = await signUp(signupData.email, signupData.password, personalInfo.name);
      
      if (error) {
        const { logError } = await import('@/utils/logger');
        logError('Signup error', 'Onboarding', error);
        
        // Handle specific error cases
        const extendedError = error as ExtendedError;
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          toast({
            title: t("onboarding.toasts.accountExists"),
            description: t("onboarding.toasts.accountExistsDesc"),
            variant: "destructive",
          });
        } else if (error.message.includes("confirmation email") || extendedError.code === 'email_send_failed') {
          // User was created but email failed
          if (data?.user || extendedError.userCreated) {
            toast({
              title: t("onboarding.toasts.accountCreated"),
              description: t("onboarding.toasts.accountCreatedDesc"),
              variant: "default",
            });
            // Try to sign in automatically if user was created
            setTimeout(() => {
              navigate("/auth");
            }, 2000);
          } else {
            toast({
              title: t("onboarding.toasts.emailError"),
              description: t("onboarding.toasts.emailErrorDesc"),
              variant: "destructive",
            });
          }
        } else if (error.message.includes("500") || extendedError.status === 500) {
          // Check console for detailed diagnostics
          const isTriggerIssue = !data?.user && error.message.includes('confirmation email');
          toast({
            title: t("onboarding.toasts.serverError"),
            description: isTriggerIssue 
              ? t("onboarding.toasts.triggerErrorDesc")
              : t("onboarding.toasts.serverErrorDesc"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("onboarding.toasts.signUpFailed"),
            description: error.message || t("onboarding.toasts.signUpFailedDesc"),
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Save onboarding data
      const { data: { user: newUser }, error: getUserError } = await getSupabaseClient().auth.getUser();
      
      if (!newUser) {
        // User not authenticated yet - store data in localStorage to save after email confirmation
        const { logWarn } = await import('@/utils/logger');
        logWarn('User not authenticated yet. Storing onboarding data in localStorage.', 'Onboarding');
        const onboardingData = {
          personalInfo,
          answers,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('pending_onboarding_data', JSON.stringify(onboardingData));
        
        toast({
          title: t("onboarding.toasts.checkEmail"),
          description: t("onboarding.toasts.checkEmailDesc"),
          variant: "default",
        });
        
        navigate('/auth');
        return;
      }

      // User is authenticated - save data immediately
      let avatarUrl = null;
      let licenseUrl = null;
      const saveErrors: string[] = [];

      // Upload avatar if provided using service
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(newUser.id, avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          saveErrors.push('Failed to upload avatar');
        }
      }

      // Upload license if provided using service
      if (licenseFile) {
        const uploadedPath = await uploadLicense(newUser.id, licenseFile);
        if (uploadedPath) {
          licenseUrl = uploadedPath;
        } else {
          saveErrors.push('Failed to upload license');
        }
      }

      // Update profile using service
      const profileUpdate = await updateProfile(newUser.id, {
        full_name: personalInfo.name || null,
        country: personalInfo.country || null,
        state: personalInfo.state || null,
        city: personalInfo.city || null,
        neighborhood: personalInfo.neighborhood || null,
        gender: personalInfo.gender || null,
        birth_year: personalInfo.birthYear ? parseInt(personalInfo.birthYear) : null,
        gender_preference: personalInfo.genderPreference || null,
        nationality: personalInfo.nationality || null,
        avatar_url: avatarUrl,
        license_url: licenseUrl,
      });

      if (!profileUpdate) {
        const { logError } = await import('@/utils/logger');
        logError('Profile update error', 'Onboarding');
        saveErrors.push('Profile update failed');
      }

      // Save preferences using service
      // Set default values for non-essential questions to ensure data integrity
      // Map goals to social_style for match score calculation (goals are part of Interests 40%)
      const socialStyleFromGoals = answers.goals || [];
      
      const prefsSuccess = await saveOnboardingPreferences(newUser.id, {
        specialty: answers.specialty?.[0] || null,
        specialty_preference: answers.specialty_preference?.[0] || "no_preference", // Default
        group_language_preference: answers.group_language_preference?.[0] || "both", // Default both
        career_stage: answers.stage?.[0] || null,
        sports: answers.sports || [], // Default empty array
        activity_level: answers.activity_level?.[0] || null, // Default null
        music_preferences: answers.music_preferences || [], // Default empty array
        movie_preferences: answers.movie_preferences || [], // Default empty array
        other_interests: answers.other_interests || [], // Default empty array
        meeting_activities: answers.meeting_activities || ["coffee", "dinner"], // Default common activities
        social_energy: answers.social_energy?.[0] || "moderate", // Default moderate
        conversation_style: answers.conversation_style?.[0] || "mix", // Default mix
        availability_slots: answers.availability || [],
        meeting_frequency: answers.meeting_frequency?.[0] || "flexible", // Default flexible
        goals: answers.goals || [],
        social_style: socialStyleFromGoals, // Map goals to social_style for match calculation
        dietary_preferences: answers.dietary_preferences || [], // Default empty array
        life_stage: answers.life_stage?.[0] || null, // Default null
        ideal_weekend: answers.ideal_weekend || [], // Default empty array
        // open_to_business: answers.goals?.includes("business") || false,
        completed_at: new Date().toISOString(),
      });

      if (!prefsSuccess) {
        const { logError } = await import('@/utils/logger');
        logError('Preferences save error', 'Onboarding');
        saveErrors.push('Preferences save failed');
      }

      // Create welcome notification using service
      await createNotification(newUser.id, {
        type: "welcome",
        title: "Welcome to BeyondRounds!",
        message: "Complete your profile to start connecting with physicians who share your interests.",
        link: "/profile",
      });

      // Show errors if any
      if (saveErrors.length > 0) {
        toast({
          title: t("onboarding.toasts.someDataNotSaved"),
          description: saveErrors.join(', '),
          variant: "destructive",
        });
      }

      setShowScoreCalculation(true);
    } catch (error) {
      toast({
        title: t("onboarding.toasts.error"),
        description: t("onboarding.toasts.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update preferences with current answers using service
      // Set default values for non-essential questions to ensure data integrity
      // Map goals to social_style for match score calculation (goals are part of Interests 40%)
      const socialStyleFromGoals = answers.goals || [];
      
      const success = await saveOnboardingPreferences(user.id, {
        specialty: answers.specialty?.[0] || null,
        specialty_preference: answers.specialty_preference?.[0] || "no_preference", // Default
        group_language_preference: answers.group_language_preference?.[0] || "both", // Default both
        career_stage: answers.stage?.[0] || null,
        sports: answers.sports || [], // Default empty array
        activity_level: answers.activity_level?.[0] || null, // Default null
        music_preferences: answers.music_preferences || [], // Default empty array
        movie_preferences: answers.movie_preferences || [], // Default empty array
        other_interests: answers.other_interests || [], // Default empty array
        meeting_activities: answers.meeting_activities || ["coffee", "dinner"], // Default common activities
        social_energy: answers.social_energy?.[0] || "moderate", // Default moderate
        conversation_style: answers.conversation_style?.[0] || "mix", // Default mix
        availability_slots: answers.availability || [],
        meeting_frequency: answers.meeting_frequency?.[0] || "flexible", // Default flexible
        goals: answers.goals || [],
        social_style: socialStyleFromGoals, // Map goals to social_style for match calculation
        dietary_preferences: answers.dietary_preferences || [], // Default empty array
        life_stage: answers.life_stage?.[0] || null, // Default null
        ideal_weekend: answers.ideal_weekend || [], // Default empty array
        completed_at: new Date().toISOString(),
      });

      if (!success) {
        throw new Error("Failed to save preferences");
      }

      toast({
        title: t("onboarding.toasts.profileUpdated"),
        description: t("onboarding.toasts.profileUpdatedDesc"),
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t("onboarding.toasts.saveFailed"),
        description: t("onboarding.toasts.saveFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalInfoMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!personalInfo.name.trim()) missing.push(t("onboarding.personal_info.fullNameMissing"));
    if (!personalInfo.country.trim()) missing.push(t("onboarding.personal_info.countryMissing"));
    if (!personalInfo.state.trim()) missing.push(t("onboarding.personal_info.stateMissing"));
    if (!personalInfo.city.trim()) missing.push(t("onboarding.personal_info.cityMissing"));
    if (!personalInfo.gender.trim()) missing.push(t("onboarding.personal_info.genderMissing"));
    if (!personalInfo.birthYear.trim()) missing.push(t("onboarding.personal_info.birthYearMissing"));
    if (!personalInfo.genderPreference.trim()) missing.push(t("onboarding.personal_info.genderPrefMissing"));
    if (!personalInfo.nationality.trim()) missing.push(t("onboarding.personal_info.nationalityMissing"));
    if (!licenseFile) missing.push(t("onboarding.personal_info.licenseMissing"));
    return missing;
  };

  const handleNext = () => {
    if (!question) return;
    
    // For personal-info: show helpful message when validation fails
    if (question.inputType === "personal-info" && !canProceed()) {
      const missing = getPersonalInfoMissingFields();
      toast({
        title: t("onboarding.personal_info.missingFields"),
        description: t("onboarding.personal_info.missing", { fields: missing.join(", ") }),
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Check for milestone celebration
    const nextProgress = ((currentStep + 2) / filteredQuestions.length) * 100;
    const milestoneReached = milestones.find(m => nextProgress >= m && progress < m);
    
    if (milestoneReached && milestoneReached !== 100) {
      toast({
        title: "Great progress! 🎉",
        description: `You've completed ${milestoneReached}% of your profile. Keep going!`,
        duration: 3000,
      });
    }
    
    if (question.inputType === "signup") {
      handleCreateAccount();
    } else if (currentStep < filteredQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All questions completed, save and navigate
      handleSaveAndComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < filteredQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const canProceed = () => {
    if (!question) return false;
    
    if (question.inputType === "personal-info") {
      return personalInfo.name.trim().length > 0 && 
             personalInfo.country.trim().length > 0 &&
             personalInfo.state.trim().length > 0 &&
             personalInfo.city.trim().length > 0 &&
             personalInfo.gender.trim().length > 0 &&
             personalInfo.birthYear.trim().length > 0 &&
             personalInfo.genderPreference.trim().length > 0 &&
             personalInfo.nationality.trim().length > 0 &&
             licenseFile !== null;
    }
    if (question.inputType === "signup") {
      const hasLowercase = /[a-z]/.test(signupData.password);
      const hasUppercase = /[A-Z]/.test(signupData.password);
      const hasNumber = /[0-9]/.test(signupData.password);
      const minLength = signupData.password.length >= 8;
      const passwordsMatch = signupData.password === confirmPassword && confirmPassword.length > 0;
      
      return signupData.email.trim().length > 0 && 
             minLength && 
             hasLowercase && 
             hasUppercase && 
             hasNumber && 
             passwordsMatch;
    }
    if (question.skipable) return true;
    return currentAnswers.length > 0;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-foreground dark:bg-background">
      {showScoreCalculation && (
        <CalculateScoreBadge
          label={t("onboarding.scoreBadge.calculating")}
          completeLabel={t("onboarding.scoreBadge.complete")}
          onComplete={() => {
            setShowScoreCalculation(false);
            toast({
              title: t("onboarding.toasts.welcome"),
              description: t("onboarding.toasts.welcomeDesc"),
            });
            navigate('/dashboard');
          }}
        />
      )}
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse-soft"
          style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.2))` }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse-soft delay-300"
          style={{ background: `linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.15))` }}
        />
      </div>

      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between">
        <button 
          onClick={handleBack} 
          aria-label={t("onboarding.back")}
          className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t("onboarding.back")}</span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-display font-bold text-primary-foreground">BeyondRounds</span>
        </div>
        <LanguageLinks variant="overlay" className="shrink-0" />
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 py-16 sm:py-20 overflow-y-auto">
        <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
          {/* Enhanced Progress */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = encouragement.icon;
                    return <IconComponent size={16} className="text-primary" />;
                  })()}
                  <span className="text-sm font-medium text-primary-foreground/80">{encouragement.text}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary-foreground">{Math.round(progress)}%</div>
                {remainingSteps > 0 && (
                  <div className="text-xs text-primary-foreground/50">
                    {t("onboarding.minLeft", { count: estimatedMinutes })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress bar with milestones */}
            <div className="relative h-2 bg-primary-foreground/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              {/* Milestone markers */}
              {milestones.map((milestone) => (
                <div
                  key={milestone}
                  className={`absolute top-0 w-0.5 h-full transition-all duration-300 ${
                    progress >= milestone 
                      ? 'bg-primary' 
                      : 'bg-primary-foreground/20'
                  }`}
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
            
            {/* Step counter */}
            <div className="flex justify-between items-center text-xs text-primary-foreground/50">
              <span>{t("onboarding.stepOf", { current: currentStep + 1, total: totalSteps })}</span>
              {remainingSteps > 0 && (
                <span className="flex items-center gap-1">
                  <span>{t("onboarding.moreToGo", { count: remainingSteps })}</span>
                </span>
              )}
            </div>
          </div>

          {/* Question Card - unified theme: dark glass card, orange gradient selected options */}
          <div className="backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 animate-fade-up bg-white/10 border-white/20">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1 sm:mb-2">
              {t(`onboarding.${question.id}.title`)}
            </h2>
            <p className="text-primary-foreground/50 text-sm sm:text-base mb-6 sm:mb-8">{t(`onboarding.${question.id}.subtitle`)}</p>

            {/* Personal Info Form */}
            {question.inputType === "personal-info" && (
              <div className="space-y-4 mb-8">
                {/* Photo Uploads Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Profile Photo */}
                  <div>
                    <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.profilePhoto")}</label>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      aria-label="Upload profile photo"
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-primary-foreground/20 hover:border-primary/50 bg-background/10 flex flex-col items-center justify-center transition-all overflow-hidden"
                    >
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover"
                          width={200}
                          height={200}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-primary-foreground/40 mb-2" />
                          <span className="text-xs text-primary-foreground/50">{t("onboarding.personal_info.addPhoto")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Medical License */}
                  <div>
                    <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.medicalLicense")}</label>
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleLicenseChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      aria-label="Upload medical license"
                      className={`w-full aspect-square rounded-2xl border-2 border-dashed ${licenseFile ? 'border-accent/50 bg-accent/10' : 'border-primary-foreground/20 hover:border-primary/50 bg-background/10'} flex flex-col items-center justify-center transition-all overflow-hidden`}
                    >
                      {licensePreview ? (
                        <img 
                          src={licensePreview} 
                          alt="License preview" 
                          className="w-full h-full object-cover"
                          width={200}
                          height={200}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : licenseFile ? (
                        <>
                          <FileCheck className="h-8 w-8 text-accent mb-2" />
                          <span className="text-xs text-accent font-medium">{t("onboarding.personal_info.licenseAdded")}</span>
                          <span className="text-xs text-primary-foreground/40 mt-1 px-2 truncate max-w-full">{licenseFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-primary-foreground/40 mb-2" />
                          <span className="text-xs text-primary-foreground/50">{t("onboarding.personal_info.uploadLicense")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.fullName")}</label>
                  <Input
                    value={personalInfo.name}
                    onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                    placeholder={t("onboarding.personal_info.fullNamePlaceholder")}
                    className={`h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-2xl ${
                      !personalInfo.name.trim() ? 'border-primary/50' : ''
                    }`}
                  />
                </div>
                <LocationSelect
                  country={personalInfo.country}
                  state={personalInfo.state}
                  city={personalInfo.city}
                  neighborhood={personalInfo.neighborhood}
                  nationality={personalInfo.nationality}
                  onCountryChange={(value) => handlePersonalInfoChange("country", value)}
                  onStateChange={(value) => handlePersonalInfoChange("state", value)}
                  onCityChange={(value) => handlePersonalInfoChange("city", value)}
                  onNeighborhoodChange={(value) => handlePersonalInfoChange("neighborhood", value)}
                  onNationalityChange={(value) => handlePersonalInfoChange("nationality", value)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.gender")}</label>
                    <Select value={personalInfo.gender} onValueChange={(value) => handlePersonalInfoChange("gender", value)}>
                      <SelectTrigger className={`h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl ${
                        !personalInfo.gender ? 'border-primary/50' : ''
                      }`}>
                        <SelectValue placeholder={t("onboarding.personal_info.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("onboarding.personal_info.male")}</SelectItem>
                        <SelectItem value="female">{t("onboarding.personal_info.female")}</SelectItem>
                        <SelectItem value="non-binary">{t("onboarding.personal_info.nonBinary")}</SelectItem>
                        <SelectItem value="prefer-not-to-say">{t("onboarding.personal_info.preferNotToSay")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.birthYear")}</label>
                    <Select value={personalInfo.birthYear} onValueChange={(value) => handlePersonalInfoChange("birthYear", value)}>
                      <SelectTrigger className={`h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl ${
                        !personalInfo.birthYear ? 'border-primary/50' : ''
                      }`}>
                        <SelectValue placeholder={t("onboarding.personal_info.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-base font-medium text-primary-foreground mb-2 block">{t("onboarding.personal_info.genderPreference")}</label>
                  <Select value={personalInfo.genderPreference} onValueChange={(value) => handlePersonalInfoChange("genderPreference", value)}>
                      <SelectTrigger className={`h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl ${
                        !personalInfo.genderPreference ? 'border-primary/50' : ''
                      }`}>
                      <SelectValue placeholder={t("onboarding.personal_info.selectPreference")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_preference">{t("onboarding.personal_info.noPreference")}</SelectItem>
                      <SelectItem value="mixed">{t("onboarding.personal_info.mixedGroups")}</SelectItem>
                      <SelectItem value="same_only">{t("onboarding.personal_info.sameOnly")}</SelectItem>
                      <SelectItem value="same_preferred">{t("onboarding.personal_info.samePreferred")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Signup Form */}
            {question.inputType === "signup" && (
              <div className="space-y-5 mb-8">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <p className="text-primary-foreground/80 text-sm text-center">
                    {t("onboarding.signup.welcomePrefix")}<span className="font-semibold">{personalInfo.name || t("onboarding.signup.doctor")}</span>{t("onboarding.signup.welcomeSuffix")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-foreground/80 text-base font-medium">
                    {t("onboarding.signup.emailAddress")}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("onboarding.signup.emailPlaceholder")}
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`pl-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary focus:ring-primary/20 transition-all ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary-foreground/80 text-base font-medium">
                    {t("onboarding.signup.password")}
                  </Label>
                  <div className="relative group">
                    {(() => {
                      const hasLowercase = /[a-z]/.test(signupData.password);
                      const hasUppercase = /[A-Z]/.test(signupData.password);
                      const hasNumber = /[0-9]/.test(signupData.password);
                      const minLength = signupData.password.length >= 8;
                      const isValid = hasLowercase && hasUppercase && hasNumber && minLength;
                      
                      return (
                        <>
                          <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                            isValid 
                              ? 'text-accent' 
                              : signupData.password.length > 0 
                              ? 'text-primary' 
                              : 'text-primary-foreground/40 group-focus-within:text-primary'
                          }`} size={18} />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signupData.password}
                            onChange={handleSignupChange}
                            className={`pl-12 pr-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:ring-primary/20 transition-all ${
                              isValid 
                                ? 'border-accent/85 focus:border-accent/85' 
                                : signupData.password.length > 0 
                                ? 'border-primary/50 focus:border-primary/70' 
                                : errors.password 
                                ? 'border-destructive' 
                                : 'focus:border-primary'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                              isValid 
                                ? 'text-accent hover:text-accent/80' 
                                : signupData.password.length > 0 
                                ? 'text-primary hover:text-primary/80' 
                                : 'text-primary-foreground/40 hover:text-primary-foreground'
                            }`}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                  {signupData.password.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {(() => {
                        const hasLowercase = /[a-z]/.test(signupData.password);
                        const hasUppercase = /[A-Z]/.test(signupData.password);
                        const hasNumber = /[0-9]/.test(signupData.password);
                        const minLength = signupData.password.length >= 8;
                        
                        return (
                          <>
                            <div className={`flex items-center gap-2 text-xs ${
                              hasLowercase ? 'text-accent' : 'text-primary/70'
                            }`}>
                              <span>{hasLowercase ? '✓' : '○'}</span>
                              <span>{t("onboarding.signup.lowercaseReq")}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${
                              minLength ? 'text-accent' : 'text-primary/70'
                            }`}>
                              <span>{minLength ? '✓' : '○'}</span>
                              <span>{t("onboarding.signup.minLengthReq")}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${
                              hasUppercase ? 'text-accent' : 'text-primary/70'
                            }`}>
                              <span>{hasUppercase ? '✓' : '○'}</span>
                              <span>{t("onboarding.signup.uppercaseReq")}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${
                              hasNumber ? 'text-accent' : 'text-primary/70'
                            }`}>
                              <span>{hasNumber ? '✓' : '○'}</span>
                              <span>{t("onboarding.signup.numberReq")}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-primary-foreground/80 text-base font-medium">
                    {t("onboarding.signup.confirmPassword")}
                  </Label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      confirmPassword && signupData.password === confirmPassword
                        ? 'text-accent' 
                        : confirmPassword && signupData.password !== confirmPassword && signupData.password.length > 0
                        ? 'text-muted-foreground' 
                        : confirmPassword && signupData.password !== confirmPassword
                        ? 'text-destructive' 
                        : 'text-primary-foreground/40 group-focus-within:text-primary'
                    }`} size={18} />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("onboarding.signup.confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-12 pr-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:ring-primary/20 transition-all ${
                        confirmPassword && signupData.password === confirmPassword
                          ? 'border-accent/85 focus:border-accent/85' 
                          : confirmPassword && signupData.password !== confirmPassword && signupData.password.length > 0
                          ? 'border-primary/50 focus:border-primary/70' 
                          : confirmPassword && signupData.password !== confirmPassword
                          ? 'border-destructive focus:border-destructive' 
                          : 'focus:border-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        confirmPassword && signupData.password === confirmPassword
                          ? 'text-accent hover:text-accent/80' 
                          : confirmPassword && signupData.password !== confirmPassword && signupData.password.length > 0
                          ? 'text-muted-foreground hover:text-muted-foreground/80' 
                          : confirmPassword && signupData.password !== confirmPassword
                          ? 'text-destructive hover:text-destructive/80' 
                          : 'text-primary-foreground/40 hover:text-primary-foreground'
                      }`}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && signupData.password !== confirmPassword && (
                    <p className={`text-xs ${signupData.password.length > 0 ? 'text-primary/80' : 'text-destructive'}`}>
                      {signupData.password.length > 0 ? t("onboarding.signup.passwordsNoMatchYet") : t("onboarding.signup.passwordsNoMatch")}
                    </p>
                  )}
                  {confirmPassword && signupData.password === confirmPassword && (
                    <p className="text-accent text-xs">{t("onboarding.signup.passwordsMatch")}</p>
                  )}
                </div>

                <p className="text-primary-foreground/40 text-xs text-center pt-2">
                  {t("onboarding.signup.byCreating")}{" "}
                  <LocalizedLink to="/terms" className="text-primary hover:underline">{t("onboarding.signup.terms")}</LocalizedLink>
                  {" "}{t("onboarding.signup.and")}{" "}
                  <LocalizedLink to="/privacy" className="text-primary hover:underline">{t("onboarding.signup.privacyPolicy")}</LocalizedLink>
                </p>
              </div>
            )}

            {/* Options Grid */}
            {question.options && (
              <div className={`grid gap-2 sm:gap-3 mb-6 sm:mb-8 ${
                question.id === 'group_language_preference' 
                  ? 'grid-cols-2' 
                  : question.options.length > 10 
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                    : question.options.length > 6 
                      ? 'grid-cols-2 sm:grid-cols-3' 
                      : 'grid-cols-2'
              }`}>
                {question.options.map((option) => {
                  const isSelected = currentAnswers.includes(option.id);
                  const isLanguageQuestion = question.id === 'group_language_preference';
                  const useHighlightStyle = true; /* same theme for all option steps: orange gradient selected, white text, light checkmark */
                  const isSpecialtyOrLarge = question.options && question.options.length > 10;
                  const LanguageIcon = isLanguageQuestion
                    ? option.id === 'both'
                      ? Globe
                      : Languages
                    : null;
                  const isBothOption = isLanguageQuestion && option.id === 'both';
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      aria-label={`Select ${getOptionLabel(question.id, option.id)}`}
                      aria-pressed={isSelected}
                      className={`relative rounded-xl border-2 text-left transition-all duration-300 ${
                        isBothOption ? 'col-span-2 justify-center' : ''
                      } ${
                        isSpecialtyOrLarge
                          ? 'p-3 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-h-[72px] sm:min-h-[80px]'
                          : 'p-3 sm:p-4 flex items-center gap-2 sm:gap-3'
                      } ${
                        useHighlightStyle
                          ? isSelected
                            ? 'border-primary bg-gradient-gold shadow-[0_0_24px_-4px_rgba(251,146,60,0.45)] scale-[1.02]'
                            : 'border-white/30 bg-white/10 hover:border-primary/50 hover:bg-primary/10 hover:scale-[1.01]'
                          : isSelected
                            ? 'border-primary bg-primary/10 shadow-glow-sm scale-[1.02]'
                            : 'border-primary-foreground/10 bg-background/5 hover:border-primary-foreground/30 hover:bg-background/10 hover:scale-[1.01]'
                      }`}
                    >
                      {isSelected && (
                        <div className={`absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center animate-fade-in ${useHighlightStyle ? 'bg-white/25' : 'bg-gradient-gold'}`}>
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      {LanguageIcon ? (
                        <LanguageIcon className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${isLanguageQuestion && isSelected ? 'text-white' : isSelected ? 'text-primary' : 'text-white/90'}`} strokeWidth={2} />
                      ) : (
                        <span className={`shrink-0 ${isSpecialtyOrLarge ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>{option.icon}</span>
                      )}
                      <span className={`font-semibold text-center leading-tight ${isSpecialtyOrLarge ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} ${useHighlightStyle ? (isSelected ? 'text-white' : 'text-white') : isSelected ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                        {getOptionLabel(question.id, option.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {question.skipable && (
                <Button 
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-primary-foreground/20 text-primary-foreground/70 hover:bg-primary-foreground/10 text-sm sm:text-base"
                >
                  {t("onboarding.skip")}
                </Button>
              )}
              <Button 
                onClick={handleNext}
                disabled={question.inputType === "personal-info" ? isLoading : (!canProceed() || isLoading)}
                className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl font-semibold group disabled:opacity-50 bg-gradient-gold text-white border-0 shadow-[0_0_24px_-4px_rgba(251,146,60,0.45)] hover:opacity-95 hover:shadow-[0_0_28px_-4px_rgba(251,146,60,0.55)] transition-all text-sm sm:text-base ${question.skipable ? 'flex-1' : 'w-full'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {question.inputType === "signup" ? t("onboarding.createAccount") : t("onboarding.continue")}
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </>
                )}
              </Button>
            </div>

            {/* Already have account - only show on signup step */}
            {question.inputType === "signup" && (
              <div className="mt-6 text-center">
                <p className="text-primary-foreground/50 text-sm">
                  {t("onboarding.signup.alreadyHaveAccount")}{" "}
                  <LocalizedLink to="/auth" className="text-primary hover:underline font-medium">{t("onboarding.signup.signIn")}</LocalizedLink>
                </p>
              </div>
            )}
          </div>

          {/* Value reminder */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-primary-foreground/40 text-xs sm:text-sm px-2">
            <Sparkles size={14} className="text-primary" />
            <span>
              {progress >= 75 
                ? t("onboarding.valueAlmostDone")
                : progress >= 50
                ? t("onboarding.valueBuildingNetwork")
                : t("onboarding.valueHelpMatches")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
