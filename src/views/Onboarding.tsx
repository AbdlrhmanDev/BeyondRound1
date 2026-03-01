'use client';

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Sparkles, Check, Mail, Lock, Eye, EyeOff, Camera, Upload, FileCheck, Zap, Star, Trophy, Languages, Globe, Stethoscope, Activity, Scissors, Baby, Heart, Brain, MessageCircle, Siren, Scan, Bone, Plus, Microscope, GraduationCap, Building2, Briefcase, Moon, Sun, Monitor, Tent, Music, Film, Coffee, Pizza, Wine, Gamepad2, Plane, Palette, HelpCircle, Users, User, Clock, Calendar, Utensils, Smile, LayoutGrid, Leaf, Shield, CheckCircle2, ChevronRight, PlayCircle, MapPin, Search, Clipboard, Award, Target, Waves, Dumbbell, Mountain, Flag, Snowflake, BookOpen, Guitar, Rocket, Dices, Sprout, Laptop, Martini, Trees, Home, Car, Mic } from "lucide-react";
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
  isEssential?: boolean;
}

const INTEREST_OPTIONS = {
  sports: [
    { id: "running", label: "Running" },
    { id: "cycling", label: "Cycling" },
    { id: "swimming", label: "Swimming" },
    { id: "gym", label: "Gym/Weights" },
    { id: "tennis", label: "Tennis/Padel" },
    { id: "football", label: "Football" },
    { id: "basketball", label: "Basketball" },
    { id: "climbing", label: "Climbing" },
    { id: "hiking", label: "Hiking" },
    { id: "yoga", label: "Yoga/Pilates" },
    { id: "martial_arts", label: "Martial Arts" },
    { id: "golf", label: "Golf" },
    { id: "skiing", label: "Skiing/Snowboard" },
    { id: "dancing", label: "Dancing" },
    { id: "water_sports", label: "Water Sports" },
  ],
  music: [
    { id: "pop", label: "Pop" },
    { id: "rock", label: "Rock" },
    { id: "hiphop", label: "Hip-Hop/Rap" },
    { id: "electronic", label: "Electronic/EDM" },
    { id: "classical", label: "Classical" },
    { id: "jazz", label: "Jazz" },
    { id: "rnb", label: "R&B/Soul" },
    { id: "indie", label: "Indie/Alt" },
    { id: "latin", label: "Latin" },
    { id: "world", label: "World Music" },
  ],
  movies: [
    { id: "action", label: "Action" },
    { id: "comedy", label: "Comedy" },
    { id: "drama", label: "Drama" },
    { id: "thriller", label: "Thriller/Horror" },
    { id: "scifi", label: "Sci-Fi/Fantasy" },
    { id: "documentary", label: "Documentaries" },
    { id: "romance", label: "Romance" },
    { id: "crime", label: "Crime/Mystery" },
    { id: "animated", label: "Animated" },
  ],
  other_interests: [
    { id: "reading", label: "Reading" },
    { id: "cooking", label: "Cooking" },
    { id: "photography", label: "Photography" },
    { id: "travel", label: "Travel" },
    { id: "art", label: "Art/Museums" },
    { id: "board_games", label: "Board Games" },
    { id: "video_games", label: "Video Games" },
    { id: "podcasts", label: "Podcasts" },
    { id: "wine", label: "Wine/Beer" },
    { id: "coffee", label: "Coffee Culture" },
    { id: "gardening", label: "Gardening" },
    { id: "tech", label: "Technology" },
    { id: "volunteering", label: "Volunteering" },
  ],
  meeting_activities: [
    { id: "coffee", label: "Coffee/Café" },
    { id: "dinner", label: "Dinner" },
    { id: "drinks", label: "Drinks/Bar" },
    { id: "outdoor", label: "Outdoor Walks" },
    { id: "sports", label: "Sports Together" },
    { id: "movies", label: "Movies/Theater" },
    { id: "museums", label: "Museums/Culture" },
    { id: "home", label: "Home Gatherings" },
    { id: "concerts", label: "Concerts/Music" },
    { id: "trips", label: "Day Trips" },
    { id: "games", label: "Game Nights" },
  ],
  dietary: [
    { id: "none", label: "No restrictions" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "halal", label: "Halal" },
    { id: "kosher", label: "Kosher" },
    { id: "gluten_free", label: "Gluten-free" },
  ],
  social_energy: [
    { id: "high", label: "High - Love big groups" },
    { id: "moderate", label: "Moderate - Small groups" },
    { id: "low", label: "Low key - Intimate" },
    { id: "varies", label: "Varies by mood" },
  ],
  conversation_style: [
    { id: "deep", label: "Deep & meaningful" },
    { id: "light", label: "Light & fun" },
    { id: "hobby", label: "Hobby-focused" },
    { id: "professional", label: "Professional topics" },
    { id: "mix", label: "Mix of everything" },
  ],
  meeting_frequency: [
    { id: "weekly", label: "Weekly" },
    { id: "biweekly", label: "Bi-weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "flexible", label: "As schedules allow" },
  ],
};

const questions: OnboardingQuestion[] = [
  // 1. SPECIALTY
  {
    id: "specialty",
    title: "Your Specialty",
    subtitle: "Connect with colleagues in similar or complementary fields",
    isEssential: true,
    options: [
      { id: "General Practice", label: "General Practice" },
      { id: "Internal Medicine", label: "Internal Medicine" },
      { id: "Surgery", label: "Surgery" },
      { id: "Pediatrics", label: "Pediatrics" },
      { id: "Cardiology", label: "Cardiology" },
      { id: "Neurology", label: "Neurology" },
      { id: "Psychiatry", label: "Psychiatry" },
      { id: "Emergency Medicine", label: "Emergency Medicine" },
      { id: "Anesthesiology", label: "Anesthesiology" },
      { id: "Radiology", label: "Radiology" },
      { id: "Dermatology", label: "Dermatology" },
      { id: "Orthopedics", label: "Orthopedics" },
      { id: "Ophthalmology", label: "Ophthalmology" },
      { id: "Gynecology", label: "OB/GYN" },
      { id: "Oncology", label: "Oncology" },
      { id: "Other", label: "Other" },
    ],
  },
  // 2. CAREER STAGE
  {
    id: "stage",
    title: "Current Career Stage",
    subtitle: "Connect with peers at a similar stage",
    isEssential: true,
    options: [
      { id: "medical_student", label: "Medical Student" },
      { id: "resident_junior", label: "Resident (1st-2nd yr)" },
      { id: "resident_senior", label: "Resident (3rd+ yr)" },
      { id: "fellow", label: "Fellow" },
      { id: "attending_early", label: "Attending (0-5 yrs)" },
      { id: "attending_senior", label: "Attending (5+ yrs)" },
      { id: "private_practice", label: "Private Practice" },
      { id: "academic", label: "Academic Medicine" },
    ],
  },
  // 3. LANGUAGE
  {
    id: "group_language_preference",
    title: "Preferred group language?",
    subtitle: "What language should the group communicate in?",
    isEssential: true,
    options: [
      { id: "english", label: "English" },
      { id: "german", label: "German" },
      { id: "both", label: "Both English & German" },
    ],
  },
  // 4. AVAILABILITY
  {
    id: "availability",
    title: "When are you free?",
    subtitle: "Match with compatible schedules",
    isEssential: true,
    multiSelect: true,
    options: [
      { id: "fri_evening", label: "Fri Evening" },
      { id: "sat_morning", label: "Sat Morning" },
      { id: "sat_afternoon", label: "Sat Afternoon" },
      { id: "sat_evening", label: "Sat Evening" },
      { id: "sun_morning", label: "Sun Morning" },
      { id: "sun_afternoon", label: "Sun Afternoon" },
      { id: "sun_evening", label: "Sun Evening" },
      { id: "weekday_eve", label: "Weekday Evenings" },
    ],
  },
  // 5. GOALS
  {
    id: "goals",
    title: "What are you looking for?",
    subtitle: "Define your friendship goals",
    isEssential: true,
    multiSelect: true,
    options: [
      { id: "casual_friends", label: "Casual Friends" },
      { id: "close_friends", label: "Close Friends" },
      { id: "activity_partners", label: "Activity Partners" },
      { id: "social_group", label: "A Social Circle" },
      { id: "mentorship", label: "Mentorship" },
      { id: "business", label: "Business Connections" },
      { id: "study_partners", label: "Study Partners" },
      { id: "travel_buddies", label: "Travel Buddies" },
    ],
  },
  // 6. PERSONAL INFO + PREFERENCES (Consolidated)
  {
    id: "personal_info",
    title: "Tell us about yourself",
    subtitle: "Personal details & preferences",
    isEssential: true,
    inputType: "personal-info",
  },
  // 7. SIGNUP
  {
    id: "signup",
    title: "Create your account",
    subtitle: "Join BeyondRounds today",
    isEssential: true,
    inputType: "signup",
  },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);
const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const days = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return { value: day.toString().padStart(2, '0'), label: day.toString() };
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const iconMap: Record<string, any> = {
  "General Practice": Stethoscope,
  "Internal Medicine": Activity,
  "Surgery": Scissors,
  "Pediatrics": Baby,
  "Cardiology": Heart,
  "Neurology": Brain,
  "Psychiatry": MessageCircle,
  "Emergency Medicine": Siren,
  "Anesthesiology": Activity,
  "Radiology": Scan,
  "Dermatology": Sparkles,
  "Orthopedics": Bone,
  "Ophthalmology": Eye,
  "Gynecology": Baby,
  "Oncology": Activity,
  "Other": Plus,
  "medical_student": GraduationCap,
  "resident_junior": Stethoscope,
  "resident_senior": Clipboard,
  "fellow": Award,
  "attending_early": User,
  "attending_senior": Star,
  "private_practice": Building2,
  "academic": Microscope,
  "english": Languages,
  "german": Languages,
  "both": Globe,
};

const DefaultIcon = CheckCircle2;

const Onboarding = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const essentialQuestions = questions; // Use all 7 steps as essential
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
    birthMonth: "",
    birthDay: "",
    genderPreference: "",
    nationality: "",
  });
  const [signupData, setSignupData] = useState({ email: "", password: "" });
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
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

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
        const existingAnswers: Record<string, string[]> = {};
        const completedQuestionIds = new Set<string>();

        if (profile?.full_name && profile?.city) {
          setPersonalInfo({
            name: profile.full_name || "",
            country: profile.country || "",
            state: profile.state || "",
            city: profile.city || "",
            neighborhood: profile.neighborhood || "",
            gender: profile.gender || "",
            birthYear: profile.date_of_birth ? profile.date_of_birth.split('-')[0] : "",
            birthMonth: profile.date_of_birth ? profile.date_of_birth.split('-')[1] : "",
            birthDay: profile.date_of_birth ? profile.date_of_birth.split('-')[2] : "",
            genderPreference: profile.gender_preference || "",
            nationality: profile.nationality || "",
          });
          if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
          if (profile.license_url) setLicensePreview(profile.license_url);
        }

        if (prefs) {
          // Map flat preds to answers
          if (prefs.specialty) existingAnswers.specialty = [prefs.specialty];
          if (prefs.career_stage) existingAnswers.stage = [prefs.career_stage];
          if (prefs.group_language_preference) existingAnswers.group_language_preference = [prefs.group_language_preference];
          if (prefs.availability_slots) existingAnswers.availability = prefs.availability_slots;
          if (prefs.goals) existingAnswers.goals = prefs.goals;

          // Map extra preferences back to answers for the 'personal-info' step to toggle correctly
          if (prefs.dietary_preferences) existingAnswers.dietary = prefs.dietary_preferences;
          if (prefs.meeting_activities) existingAnswers.meeting_activities = prefs.meeting_activities;
          if (prefs.sports) existingAnswers.sports = prefs.sports;
          // ... map others if needed, but 'personal-info' uses local state mostly or checks 'answers' directly
        }
        setAnswers(existingAnswers);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadExistingData();
  }, [user]);

  const question = filteredQuestions[currentStep];
  const progress = ((currentStep + 1) / filteredQuestions.length) * 100;
  const remainingSteps = filteredQuestions.length - (currentStep + 1);
  const estimatedMinutes = Math.ceil(remainingSteps * 0.5);

  const getOptionLabel = (qId: string, optId: string) => t(`onboarding.${qId}.${optId}`, optId);

  const handleSelect = (optionId: string) => {
    if (!question) return;
    handlePreferenceSelect(question.id, optionId, question.multiSelect || false);
  };

  const handlePreferenceSelect = (categoryId: string, optionId: string, multiSelect: boolean) => {
    const currentCategoryAnswers = answers[categoryId] || [];
    if (multiSelect) {
      setAnswers(prev => ({
        ...prev,
        [categoryId]: currentCategoryAnswers.includes(optionId)
          ? currentCategoryAnswers.filter(id => id !== optionId)
          : [...currentCategoryAnswers, optionId]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [categoryId]: [optionId]
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
        toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
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
        toast({ title: "File too large", description: "File must be under 10MB", variant: "destructive" });
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
      if (signupData.password !== confirmPassword) {
        setErrors({ password: "Passwords do not match" });
        return false;
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
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
      const { error, data: signUpData } = await signUp(signupData.email, signupData.password, personalInfo.name);

      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Prefer the user returned directly from signUp (signInWithPassword).
      // Fall back to getUser() only if signUp didn't return one — avoids a
      // race condition where a freshly-created client hasn't picked up the
      // session cookie yet, which would make getUser() return null and skip
      // all uploads.
      let newUser = signUpData?.user ?? null;
      if (!newUser) {
        const { data: { user: fetchedUser } } = await getSupabaseClient().auth.getUser();
        newUser = fetchedUser;
      }

      if (!newUser) {
        // Truly no session — save data for retry after login
        const normalizedAnswers = {
          ...answers,
          music_preferences: answers.music || [],
          movie_preferences: answers.movies || [],
          dietary_preferences: answers.dietary || [],
        };
        const onboardingData = { personalInfo, answers: normalizedAnswers, timestamp: new Date().toISOString() };
        localStorage.setItem('pending_onboarding_data', JSON.stringify(onboardingData));
        navigate('/auth');
        return;
      }

      let avatarUrl: string | null = null;
      let licenseUrl: string | null = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(newUser.id, avatarFile);
        if (!avatarUrl) toast({ title: "Avatar upload failed", description: "Your photo could not be uploaded. You can add it from your profile.", variant: "destructive" });
      }
      if (licenseFile) {
        licenseUrl = await uploadLicense(newUser.id, licenseFile);
        if (!licenseUrl) toast({ title: "License upload failed", description: "Your document could not be uploaded. You can re-submit from your profile.", variant: "destructive" });
      }

      const profileResult = await updateProfile(newUser.id, {
        full_name: personalInfo.name || null,
        country: personalInfo.country || null,
        state: personalInfo.state || null,
        city: personalInfo.city || null,
        neighborhood: personalInfo.neighborhood || null,
        gender: personalInfo.gender || null,
        date_of_birth: personalInfo.birthYear && personalInfo.birthMonth && personalInfo.birthDay
          ? `${personalInfo.birthYear}-${personalInfo.birthMonth.padStart(2, '0')}-${personalInfo.birthDay.padStart(2, '0')}`
          : null,
        gender_preference: personalInfo.genderPreference || null,
        nationality: personalInfo.nationality || null,
        avatar_url: avatarUrl,
        license_url: licenseUrl,
      });
      if (!profileResult) {
        console.error("Failed to save profile during signup");
      }

      const prefsResult = await saveOnboardingPreferences(newUser.id, {
        specialty: answers.specialty?.[0] || null,
        specialty_preference: "no_preference",
        group_language_preference: answers.group_language_preference?.[0] || "both",
        career_stage: answers.stage?.[0] || null,
        sports: answers.sports || [],
        activity_level: answers.activity_level?.[0] || null,
        music_preferences: answers.music || [],
        movie_preferences: answers.movies || [],
        other_interests: answers.other_interests || [],
        meeting_activities: answers.meeting_activities || ["coffee", "dinner"],
        availability_slots: answers.availability || [],
        goals: answers.goals || [],
        social_style: answers.social_style || [],
        dietary_preferences: answers.dietary || [],
        life_stage: answers.life_stage?.[0] || null,
        ideal_weekend: answers.ideal_weekend || [],
        completed_at: new Date().toISOString(),
      });
      if (!prefsResult) {
        // Direct save failed — store for welcome page to retry
        const normalizedAnswers = {
          ...answers,
          music_preferences: answers.music || [],
          movie_preferences: answers.movies || [],
          dietary_preferences: answers.dietary || [],
        };
        const onboardingData = { personalInfo, answers: normalizedAnswers, timestamp: new Date().toISOString() };
        localStorage.setItem('pending_onboarding_data', JSON.stringify(onboardingData));
        console.error("Failed to save preferences during signup — stored for retry");
      }

      await createNotification(newUser.id, {
        type: "welcome",
        title: "Welcome to BeyondRounds!",
        message: "Complete your profile to start connecting.",
        link: "/profile",
      });

      setShowScoreCalculation(true);
    } catch (error) {
      toast({ title: "Error", description: "An error occurred during signup", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Save personal info to profiles table
      let avatarUrl: string | null = null;
      let licenseUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadAvatar(user.id, avatarFile);
      if (licenseFile) licenseUrl = await uploadLicense(user.id, licenseFile);

      const profileUpdates: Record<string, unknown> = {
        full_name: personalInfo.name || null,
        country: personalInfo.country || null,
        state: personalInfo.state || null,
        city: personalInfo.city || null,
        neighborhood: personalInfo.neighborhood || null,
        gender: personalInfo.gender || null,
        date_of_birth: personalInfo.birthYear && personalInfo.birthMonth && personalInfo.birthDay
          ? `${personalInfo.birthYear}-${personalInfo.birthMonth.padStart(2, '0')}-${personalInfo.birthDay.padStart(2, '0')}`
          : null,
        gender_preference: personalInfo.genderPreference || null,
        nationality: personalInfo.nationality || null,
      };
      if (avatarUrl) profileUpdates.avatar_url = avatarUrl;
      if (licenseUrl) profileUpdates.license_url = licenseUrl;

      const profileResult = await updateProfile(user.id, profileUpdates as Partial<import("@/services/profileService").Profile>);
      if (!profileResult) {
        console.error("Failed to save profile data");
      }

      // Save preferences to onboarding_preferences table
      const prefsResult = await saveOnboardingPreferences(user.id, {
        specialty: answers.specialty?.[0] || null,
        specialty_preference: "no_preference",
        group_language_preference: answers.group_language_preference?.[0] || "both",
        career_stage: answers.stage?.[0] || null,
        sports: answers.sports || [],
        activity_level: answers.activity_level?.[0] || null,
        music_preferences: answers.music || [],
        movie_preferences: answers.movies || [],
        other_interests: answers.other_interests || [],
        meeting_activities: answers.meeting_activities || ["coffee", "dinner"],
        availability_slots: answers.availability || [],
        goals: answers.goals || [],
        social_style: answers.social_style || [],
        dietary_preferences: answers.dietary || [],
        life_stage: answers.life_stage?.[0] || null,
        ideal_weekend: answers.ideal_weekend || [],
        completed_at: new Date().toISOString(),
      });
      if (!prefsResult) {
        console.error("Failed to save onboarding preferences");
      }

      toast({ title: "Profile Updated", description: "Your preferences have been saved." });
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalInfoMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!personalInfo.name.trim()) missing.push("Full Name");
    if (!personalInfo.country.trim()) missing.push("Country");
    if (!personalInfo.city.trim()) missing.push("City");
    if (!licenseFile) missing.push("Medical License");
    return missing;
  };

  const handleNext = () => {
    if (!question) return;

    if (question.inputType === "personal-info") {
      const missing = getPersonalInfoMissingFields();
      if (missing.length > 0) {
        toast({ title: "Required Fields", description: `Please complete: ${missing.join(", ")}`, variant: "destructive" });
        return;
      }
    }

    if (question.inputType === "signup") {
      handleCreateAccount();
    } else if (currentStep < filteredQuestions.length - 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(currentStep + 1);
    } else {
      handleSaveAndComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const handleSkip = () => {
    if (currentStep < filteredQuestions.length - 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = () => {
    if (!question) return false;
    if (question.inputType === "personal-info") return true; // Handled by getPersonalInfoMissingFields
    if (question.inputType === "signup") return signupData.email && signupData.password === confirmPassword && signupData.password.length >= 8;
    if (question.skipable) return true;
    return (answers[question.id] || []).length > 0;
  };

  if (loadingExisting) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (showScoreCalculation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-500">
        <CalculateScoreBadge 
          onComplete={() => navigate('/dashboard')} 
          label={t('scoreBadge.calculating', 'Calculating your match score...')}
          completeLabel={t('scoreBadge.complete', 'Profile ready!')}
          allDoneTitle={t('allDone', 'All Done!')}
          allDoneSubtitle={t('allDoneSubtitle', 'You\'ve completed all onboarding steps.')}
          goToDashboardLabel={t('goDashboard', 'Go to Dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 md:px-8 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <span className="font-bold tracking-tight hidden sm:block">BeyondRounds</span>
          </div>
        </div>
        <LanguageLinks variant="ghost" className="text-muted-foreground hover:text-foreground" />
      </header>

      {/* Progress Line */}
      <div className="h-1 w-full bg-muted sticky top-16 z-40">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 pb-32 md:pb-12 animate-fade-in">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-sm font-medium text-muted-foreground">
          <span>Step {currentStep + 1} of {filteredQuestions.length}</span>
          {remainingSteps > 0 && <span>~{estimatedMinutes} min left</span>}
        </div>

        {/* Question Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
            {t(`onboarding.${question.id}.title`, question.title)}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t(`onboarding.${question.id}.subtitle`, question.subtitle)}
          </p>
          {question.multiSelect && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
              <Check size={12} /> {t("onboarding.selectMultiple", "Select all that apply")}
            </div>
          )}
        </div>

        {/* Dynamic Content */}
        {question.inputType === "personal-info" ? (
          <div className="space-y-8">
            {/* Verification */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Verification</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile Photo Upload */}
                <div className="relative group">
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  {avatarPreview ? (
                    <div className="relative w-full aspect-video rounded-xl border-2 border-primary bg-gray-50 overflow-hidden shadow-sm">
                      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
                        <img
                          src={avatarPreview}
                          alt="Profile preview"
                          className="w-full h-full object-contain object-center"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-2 py-1 text-xs font-medium bg-white/95 hover:bg-white text-gray-900 rounded-md shadow-sm border border-gray-200 transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                          className="px-2 py-1 text-xs font-medium bg-white/95 hover:bg-white text-red-600 rounded-md shadow-sm border border-gray-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-gray-50 transition-all flex flex-col items-center justify-center p-4 bg-white"
                    >
                      <Camera className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Profile Photo</span>
                      <span className="text-xs text-gray-500 mt-1">Click to upload</span>
                    </button>
                  )}
                </div>

                {/* Medical License Upload */}
                <div className="relative group">
                  <input ref={licenseInputRef} type="file" accept="image/*,.pdf" onChange={handleLicenseChange} className="hidden" />
                  {licenseFile ? (
                    <div className="relative w-full aspect-video rounded-xl border-2 border-primary bg-white overflow-hidden shadow-sm">
                      {licensePreview ? (
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <img
                            src={licensePreview}
                            alt="License preview"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-emerald-50 flex flex-col items-center justify-center">
                          <FileCheck className="w-10 h-10 text-primary mb-2" />
                          <span className="text-sm font-medium text-gray-700">{licenseFile.name}</span>
                          <span className="text-xs text-gray-500 mt-1">{(licenseFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => licenseInputRef.current?.click()}
                          className="px-2 py-1 text-xs font-medium bg-white/95 hover:bg-white text-gray-900 rounded-md shadow-sm border border-gray-200 transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLicenseFile(null);
                            setLicensePreview(null);
                          }}
                          className="px-2 py-1 text-xs font-medium bg-white/95 hover:bg-white text-red-600 rounded-md shadow-sm border border-gray-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-gray-50 transition-all flex flex-col items-center justify-center p-4 bg-white"
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Medical License</span>
                      <span className="text-xs text-gray-500 mt-1">Image or PDF</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600">Used only for verification. Not visible to members.</p>
            </section>

            {/* Profile */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profile</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium">Full Name</Label>
                  <Input
                    value={personalInfo.name}
                    onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                    placeholder="Dr. Jane Doe"
                    className="h-12 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <LocationSelect
                  country={personalInfo.country}
                  state={personalInfo.state}
                  city={personalInfo.city}
                  neighborhood={personalInfo.neighborhood}
                  onCountryChange={(v) => handlePersonalInfoChange("country", v)}
                  onStateChange={(v) => handlePersonalInfoChange("state", v)}
                  onCityChange={(v) => handlePersonalInfoChange("city", v)}
                  onNeighborhoodChange={(v) => handlePersonalInfoChange("neighborhood", v)}
                  variant="profile"
                  className="w-full"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Gender</Label>
                    <Select value={personalInfo.gender} onValueChange={(v) => handlePersonalInfoChange("gender", v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-white text-foreground border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 transition">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={8}>
                        <SelectItem value="male" className="text-gray-900 hover:bg-gray-100">Male</SelectItem>
                        <SelectItem value="female" className="text-gray-900 hover:bg-gray-100">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Date of Birth</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Select value={personalInfo.birthDay} onValueChange={(v) => handlePersonalInfoChange("birthDay", v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white text-foreground border border-gray-300 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 transition">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={8}>
                          {days.map(d => <SelectItem key={d.value} value={d.value} className="text-gray-900 hover:bg-gray-100">{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={personalInfo.birthMonth} onValueChange={(v) => handlePersonalInfoChange("birthMonth", v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white text-foreground border border-gray-300 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 transition">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={8}>
                          {months.map(m => <SelectItem key={m.value} value={m.value} className="text-gray-900 hover:bg-gray-100">{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={personalInfo.birthYear} onValueChange={(v) => handlePersonalInfoChange("birthYear", v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-white text-foreground border border-gray-300 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 transition">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={8}>
                          {years.map(y => <SelectItem key={y} value={y.toString()} className="text-gray-900 hover:bg-gray-100">{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Used only to improve matching. Not shown publicly.</p>
                  </div>
                </div>

              </div>
            </section>

            {/* Consolidated Preferences */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interests & Lifestyle</h3>
              </div>

              {/* Loop through interest categories */}
              {[
                { id: 'dietary', label: 'Dietary Preferences', options: INTEREST_OPTIONS.dietary },
                { id: 'meeting_activities', label: 'Preferred Activities', options: INTEREST_OPTIONS.meeting_activities },
                { id: 'sports', label: 'Sports', options: INTEREST_OPTIONS.sports },
                { id: 'music', label: 'Music', options: INTEREST_OPTIONS.music },
                { id: 'movies', label: 'Movies', options: INTEREST_OPTIONS.movies },
                { id: 'social_energy', label: 'Social Energy', options: INTEREST_OPTIONS.social_energy },
                { id: 'conversation_style', label: 'Conversation Style', options: INTEREST_OPTIONS.conversation_style },
                { id: 'meeting_frequency', label: 'Availability Frequency', options: INTEREST_OPTIONS.meeting_frequency },
              ].map(category => (
                <div key={category.id} className="space-y-3">
                  <Label className="text-base">{category.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map(opt => {
                      const isSelected = (answers[category.id] || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handlePreferenceSelect(category.id, opt.id, true)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:bg-muted"
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>
        ) : question.inputType === "signup" ? (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-primary/10 text-primary-foreground p-4 rounded-xl border border-primary/20 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-medium">Welcome, {personalInfo.name || "Doctor"}</p>
                <p className="opacity-80 mt-1">Your profile is private. Verified doctors only.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex items-center justify-center gap-2"
                onClick={async () => {
                  try {
                    // Save onboarding data before redirecting to Google auth
                    const normalizedAnswers = {
                      ...answers,
                      music_preferences: answers.music || [],
                      movie_preferences: answers.movies || [],
                      dietary_preferences: answers.dietary || [],
                    };
                    const onboardingData = { personalInfo, answers: normalizedAnswers, timestamp: new Date().toISOString() };
                    localStorage.setItem('pending_onboarding_data', JSON.stringify(onboardingData));

                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast({ title: "Google Sign In Failed", description: error.message, variant: "destructive" });
                    }
                  } catch (err) {
                    toast({ title: "Error", description: "Could not initialize Google sign in.", variant: "destructive" });
                  }
                }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" value={signupData.email} onChange={handleSignupChange} placeholder="doctor@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} name="password" value={signupData.password} onChange={handleSignupChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground"><Eye size={18} /></button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>
          </div>
        ) : (
          /* Standard Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options?.map((option) => {
              const Icon = iconMap[option.id] || CheckCircle2;
              const isSelected = (answers[question.id] || []).includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`group relative flex items-center p-4 rounded-xl border transition-all text-left ${isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                    }`}>
                    <Icon size={20} />
                  </div>
                  <span className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {getOptionLabel(question.id, option.id)}
                  </span>
                  {isSelected && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"><Check size={18} /></div>}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          {question.skipable && (
            <Button variant="ghost" onClick={handleSkip} className="flex-1 h-12 rounded-xl text-muted-foreground">Skip</Button>
          )}
          <Button onClick={handleNext} disabled={question.inputType === "personal-info" ? isLoading : (!canProceed() || isLoading)} className="flex-1 h-12 rounded-xl text-base shadow-sm">
            {isLoading ? "Processing..." : question.inputType === "signup" ? "Create Account" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
