import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Sparkles, Check, Mail, Lock, Eye, EyeOff, Camera, Upload, FileCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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
}

const questions: OnboardingQuestion[] = [
  // MEDICAL BACKGROUND
  {
    id: "specialty",
    title: "What's your specialty?",
    subtitle: "Match with similar or complementary fields",
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
    inputType: "personal-info",
  },
  // SIGNUP - FINAL STEP
  {
    id: "signup",
    title: "Create your account",
    subtitle: "Join BeyondRounds today",
    inputType: "signup",
  },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => currentYear - 25 - i);

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Onboarding = () => {
  const { user } = useAuth();
  const [filteredQuestions, setFilteredQuestions] = useState<OnboardingQuestion[]>(questions);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
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
        const [profileRes, prefsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("onboarding_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        const profile = profileRes.data;
        const prefs = prefsRes.data;

        // Map existing data to answers
        const existingAnswers: Record<string, string[]> = {};
        const completedQuestionIds = new Set<string>();

        // Check profile data (personal-info step)
        if (profile?.full_name && profile?.city && profile?.license_url) {
          completedQuestionIds.add("personal_info");
          setPersonalInfo({
            name: profile.full_name || "",
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

        // Filter out completed questions and signup (if user is logged in)
        const remainingQuestions = questions.filter((q) => {
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
        console.error("Error loading existing data:", error);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExistingData();
  }, [user]);

  const question = filteredQuestions[currentStep];
  const currentAnswers = answers[question?.id] || [];

  // Early return if no question available
  if (loadingExisting) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-foreground/50">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!question || filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">All Done!</h2>
          <p className="text-primary-foreground/50 mb-4">You've completed all onboarding steps.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

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
        toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
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
        toast({ title: "File too large", description: "Please select a file under 10MB", variant: "destructive" });
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
      const { error } = await signUp(signupData.email, signupData.password, personalInfo.name);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Save onboarding data
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        let avatarUrl = null;
        let licenseUrl = null;

        // Upload avatar if provided
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop();
          const filePath = `${newUser.id}/avatar.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            avatarUrl = publicUrl;
          }
        }

        // Upload license if provided
        if (licenseFile) {
          const fileExt = licenseFile.name.split('.').pop();
          const filePath = `${newUser.id}/license.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('licenses')
            .upload(filePath, licenseFile, { upsert: true });
          
          if (!uploadError) {
            // For private bucket, store the path (not public URL)
            licenseUrl = filePath;
          }
        }

        // Update profile
        await supabase
          .from("profiles")
          .update({
            full_name: personalInfo.name || null,
            neighborhood: personalInfo.neighborhood || null,
            gender: personalInfo.gender || null,
            birth_year: personalInfo.birthYear ? parseInt(personalInfo.birthYear) : null,
            gender_preference: personalInfo.genderPreference || null,
            nationality: personalInfo.nationality || null,
            avatar_url: avatarUrl,
            license_url: licenseUrl,
          } as any)
          .eq("user_id", newUser.id);

        // Save preferences
        await supabase.from("onboarding_preferences").upsert({
          user_id: newUser.id,
          specialty: answers.specialty?.[0] || null,
          specialty_preference: answers.specialty_preference?.[0] || null,
          career_stage: answers.stage?.[0] || null,
          sports: answers.sports || [],
          activity_level: answers.activity_level?.[0] || null,
          music_preferences: answers.music_preferences || [],
          movie_preferences: answers.movie_preferences || [],
          other_interests: answers.other_interests || [],
          meeting_activities: answers.meeting_activities || [],
          social_energy: answers.social_energy?.[0] || null,
          conversation_style: answers.conversation_style?.[0] || null,
          availability_slots: answers.availability || [],
          meeting_frequency: answers.meeting_frequency?.[0] || null,
          goals: answers.goals || [],
          dietary_preferences: answers.dietary_preferences || [],
          life_stage: answers.life_stage?.[0] || null,
          ideal_weekend: answers.ideal_weekend || [],
          open_to_business: answers.goals?.includes("business") || false,
          completed_at: new Date().toISOString(),
        });

        // Create welcome notification
        await supabase.from("notifications").insert({
          user_id: newUser.id,
          type: "welcome",
          title: "Welcome to BeyondRounds!",
          message: "Complete your profile to start connecting with physicians who share your interests.",
          link: "/profile",
        });
      }

      toast({
        title: "Welcome to BeyondRounds!",
        description: "Your account has been created successfully.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
      // Update preferences with current answers
      await supabase.from("onboarding_preferences").upsert({
        user_id: user.id,
        specialty: answers.specialty?.[0] || null,
        specialty_preference: answers.specialty_preference?.[0] || null,
        career_stage: answers.stage?.[0] || null,
        sports: answers.sports || [],
        activity_level: answers.activity_level?.[0] || null,
        music_preferences: answers.music_preferences || [],
        movie_preferences: answers.movie_preferences || [],
        other_interests: answers.other_interests || [],
        meeting_activities: answers.meeting_activities || [],
        social_energy: answers.social_energy?.[0] || null,
        conversation_style: answers.conversation_style?.[0] || null,
        availability_slots: answers.availability || [],
        meeting_frequency: answers.meeting_frequency?.[0] || null,
        goals: answers.goals || [],
        dietary_preferences: answers.dietary_preferences || [],
        life_stage: answers.life_stage?.[0] || null,
        ideal_weekend: answers.ideal_weekend || [],
        open_to_business: answers.goals?.includes("business") || false,
        completed_at: new Date().toISOString(),
      });

      toast({
        title: "Profile Updated!",
        description: "Your preferences have been saved successfully.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!question) return;
    
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
      return personalInfo.name.trim().length > 0 && personalInfo.city.trim().length > 0 && licenseFile !== null;
    }
    if (question.inputType === "signup") {
      return signupData.email.trim().length > 0 && signupData.password.length >= 6;
    }
    if (question.skipable) return true;
    return currentAnswers.length > 0;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-foreground">
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
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <button onClick={handleBack} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-display font-bold text-primary-foreground">BeyondRounds</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-primary-foreground/50 mb-2">
              <span>Step {currentStep + 1} of {filteredQuestions.length}</span>
              <span>{Math.round(((currentStep + 1) / filteredQuestions.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-primary-foreground/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / filteredQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-background/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-3xl p-8 animate-fade-up">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
              {question.title}
            </h2>
            <p className="text-primary-foreground/50 mb-8">{question.subtitle}</p>

            {/* Personal Info Form */}
            {question.inputType === "personal-info" && (
              <div className="space-y-4 mb-8">
                {/* Photo Uploads Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Profile Photo */}
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Profile Photo</label>
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
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-primary-foreground/20 hover:border-primary/50 bg-background/10 flex flex-col items-center justify-center transition-all overflow-hidden"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-primary-foreground/40 mb-2" />
                          <span className="text-xs text-primary-foreground/50">Add Photo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Medical License */}
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Medical License *</label>
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
                      className={`w-full aspect-square rounded-2xl border-2 border-dashed ${licenseFile ? 'border-green-500/50 bg-green-500/10' : 'border-primary-foreground/20 hover:border-primary/50 bg-background/10'} flex flex-col items-center justify-center transition-all overflow-hidden`}
                    >
                      {licensePreview ? (
                        <img src={licensePreview} alt="License preview" className="w-full h-full object-cover" />
                      ) : licenseFile ? (
                        <>
                          <FileCheck className="h-8 w-8 text-green-500 mb-2" />
                          <span className="text-xs text-green-500 font-medium">License Added</span>
                          <span className="text-xs text-primary-foreground/40 mt-1 px-2 truncate max-w-full">{licenseFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-primary-foreground/40 mb-2" />
                          <span className="text-xs text-primary-foreground/50">Upload License</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Full Name *</label>
                  <Input
                    value={personalInfo.name}
                    onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 rounded-2xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">City *</label>
                    <Input
                      value={personalInfo.city}
                      onChange={(e) => handlePersonalInfoChange("city", e.target.value)}
                      placeholder="Berlin"
                      className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Neighborhood</label>
                    <Input
                      value={personalInfo.neighborhood}
                      onChange={(e) => handlePersonalInfoChange("neighborhood", e.target.value)}
                      placeholder="Mitte"
                      className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 rounded-2xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Nationality</label>
                  <Input
                    value={personalInfo.nationality}
                    onChange={(e) => handlePersonalInfoChange("nationality", e.target.value)}
                    placeholder="German"
                    className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 rounded-2xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Gender</label>
                    <Select value={personalInfo.gender} onValueChange={(value) => handlePersonalInfoChange("gender", value)}>
                      <SelectTrigger className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Birth Year</label>
                    <Select value={personalInfo.birthYear} onValueChange={(value) => handlePersonalInfoChange("birthYear", value)}>
                      <SelectTrigger className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl">
                        <SelectValue placeholder="Select" />
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
                  <label className="text-sm font-medium text-primary-foreground/70 mb-2 block">Gender preference for groups</label>
                  <Select value={personalInfo.genderPreference} onValueChange={(value) => handlePersonalInfoChange("genderPreference", value)}>
                    <SelectTrigger className="h-14 bg-background/10 border-primary-foreground/20 text-primary-foreground rounded-2xl">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_preference">No preference</SelectItem>
                      <SelectItem value="mixed">Mixed groups preferred</SelectItem>
                      <SelectItem value="same_only">Same gender only</SelectItem>
                      <SelectItem value="same_preferred">Same gender preferred, mixed okay</SelectItem>
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
                    Welcome, <span className="font-semibold">{personalInfo.name || "Doctor"}</span>! Create your account to save your preferences and start matching.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-foreground/80 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`pl-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary focus:ring-primary/20 transition-all ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary-foreground/80 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className={`pl-12 pr-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary focus:ring-primary/20 transition-all ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/40 hover:text-primary-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
                </div>

                <p className="text-primary-foreground/40 text-xs text-center pt-2">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </div>
            )}

            {/* Options Grid */}
            {question.options && (
              <div className={`grid gap-3 mb-8 ${question.options.length > 10 ? 'grid-cols-3 sm:grid-cols-4' : question.options.length > 6 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                {question.options.map((option) => {
                  const isSelected = currentAnswers.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-glow-sm'
                          : 'border-primary-foreground/10 bg-background/5 hover:border-primary-foreground/30 hover:bg-background/10'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-gold flex items-center justify-center">
                          <Check size={10} className="text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-lg block mb-0.5">{option.icon}</span>
                      <span className={`font-medium text-xs ${isSelected ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {question.skipable && (
                <Button 
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-primary-foreground/20 text-primary-foreground/70 hover:bg-primary-foreground/10"
                >
                  Skip
                </Button>
              )}
              <Button 
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className={`h-14 font-semibold group disabled:opacity-50 ${question.skipable ? 'flex-1' : 'w-full'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {question.inputType === "signup" ? "Create Account" : "Continue"}
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </>
                )}
              </Button>
            </div>

            {/* Already have account - only show on signup step */}
            {question.inputType === "signup" && (
              <div className="mt-6 text-center">
                <p className="text-primary-foreground/50 text-sm">
                  Already have an account?{" "}
                  <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-primary-foreground/40 text-sm">
            <Sparkles size={14} className="text-primary" />
            <span>Your answers help us find better matches</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
