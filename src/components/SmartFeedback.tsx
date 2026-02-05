'use client';

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { submitSmartFeedback, SmartFeedbackData } from "@/services/feedbackService";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackContext =
  | "group_completed"
  | "after_meetup"
  | "profile_suggestion"
  | "general";

interface SmartFeedbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: FeedbackContext;
  groupId?: string;
  meetupId?: string;
}

// Emoji ratings with labels
const EMOJI_RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Fair" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

// Feedback chips by context
const FEEDBACK_CHIPS: Record<FeedbackContext, { id: string; labelKey: string }[]> = {
  group_completed: [
    { id: "matching_quality", labelKey: "smartFeedback.chips.matchingQuality" },
    { id: "group_size", labelKey: "smartFeedback.chips.groupSize" },
    { id: "timing", labelKey: "smartFeedback.chips.timing" },
    { id: "communication", labelKey: "smartFeedback.chips.communication" },
    { id: "interests_aligned", labelKey: "smartFeedback.chips.interestsAligned" },
  ],
  after_meetup: [
    { id: "matching_quality", labelKey: "smartFeedback.chips.matchingQuality" },
    { id: "venue", labelKey: "smartFeedback.chips.venue" },
    { id: "group_size", labelKey: "smartFeedback.chips.groupSize" },
    { id: "vibe", labelKey: "smartFeedback.chips.vibe" },
    { id: "conversation", labelKey: "smartFeedback.chips.conversation" },
    { id: "would_meet_again", labelKey: "smartFeedback.chips.wouldMeetAgain" },
  ],
  profile_suggestion: [
    { id: "app_experience", labelKey: "smartFeedback.chips.appExperience" },
    { id: "feature_request", labelKey: "smartFeedback.chips.featureRequest" },
    { id: "bug_report", labelKey: "smartFeedback.chips.bugReport" },
    { id: "matching_algorithm", labelKey: "smartFeedback.chips.matchingAlgorithm" },
    { id: "other", labelKey: "smartFeedback.chips.other" },
  ],
  general: [
    { id: "app_experience", labelKey: "smartFeedback.chips.appExperience" },
    { id: "feature_request", labelKey: "smartFeedback.chips.featureRequest" },
    { id: "bug_report", labelKey: "smartFeedback.chips.bugReport" },
    { id: "other", labelKey: "smartFeedback.chips.other" },
  ],
};

const SmartFeedback = ({
  open,
  onOpenChange,
  context = "general",
  groupId,
  meetupId,
}: SmartFeedbackProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Multi-step state
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [rating, setRating] = useState<number | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [additionalText, setAdditionalText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chips = FEEDBACK_CHIPS[context] || FEEDBACK_CHIPS.general;

  // Get context-specific copy
  const getTitle = () => {
    switch (context) {
      case "group_completed":
        return t("smartFeedback.titles.groupCompleted");
      case "after_meetup":
        return t("smartFeedback.titles.afterMeetup");
      case "profile_suggestion":
        return t("smartFeedback.titles.suggestion");
      default:
        return t("smartFeedback.titles.general");
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 1:
        return t("smartFeedback.subtitles.rating");
      case 2:
        return t("smartFeedback.subtitles.details");
      case 3:
        return t("smartFeedback.subtitles.anything");
      default:
        return "";
    }
  };

  const handleChipToggle = (chipId: string) => {
    setSelectedChips(prev =>
      prev.includes(chipId)
        ? prev.filter(id => id !== chipId)
        : [...prev, chipId]
    );
  };

  const handleNext = () => {
    if (step === 1 && rating !== null) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);

    const feedbackData: SmartFeedbackData = {
      user_id: user?.id || null,
      context_type: context,
      rating,
      feedback_chips: selectedChips,
      additional_text: additionalText.trim() || undefined,
      group_id: groupId,
      meetup_id: meetupId,
      page_url: window.location.pathname,
    };

    const success = await submitSmartFeedback(feedbackData);

    if (success) {
      setStep("success");
    } else {
      toast({
        title: t("smartFeedback.error"),
        description: t("smartFeedback.errorDesc"),
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep(1);
      setRating(null);
      setSelectedChips([]);
      setAdditionalText("");
    }, 300);
  }, [onOpenChange]);

  const canProceed = step === 1 ? rating !== null : true;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <DrawerHeader className="text-center pb-2">
            {step !== "success" && step > 1 && (
              <button
                onClick={handleBack}
                className="absolute left-4 top-6 p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <DrawerTitle className="text-lg font-semibold">
              {step === "success" ? t("smartFeedback.thankYou") : getTitle()}
            </DrawerTitle>
            {step !== "success" && (
              <DrawerDescription className="text-sm">
                {getSubtitle()}
              </DrawerDescription>
            )}
          </DrawerHeader>

          <div className="px-4 pb-6">
            {/* Step 1: Rating */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Emoji Rating */}
                <div className="flex justify-center gap-2">
                  {EMOJI_RATINGS.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setRating(item.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                        rating === item.value
                          ? "bg-primary/10 scale-110"
                          : "hover:bg-secondary"
                      )}
                    >
                      <span className="text-3xl" role="img" aria-label={item.label}>
                        {item.emoji}
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        rating === item.value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {t(`smartFeedback.ratings.${item.label.toLowerCase()}`)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="w-full rounded-xl h-12"
                >
                  {t("common.continue")}
                </Button>
              </div>
            )}

            {/* Step 2: Chips */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Selected rating display */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>{t("smartFeedback.yourRating")}:</span>
                  <span className="text-2xl">
                    {EMOJI_RATINGS.find(r => r.value === rating)?.emoji}
                  </span>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap justify-center gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => handleChipToggle(chip.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedChips.includes(chip.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {t(chip.labelKey)}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    className="flex-1 rounded-xl h-12"
                  >
                    {t("smartFeedback.skip")}
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 rounded-xl h-12"
                    disabled={selectedChips.length === 0}
                  >
                    {t("common.continue")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Text Input */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <span className="text-2xl">
                    {EMOJI_RATINGS.find(r => r.value === rating)?.emoji}
                  </span>
                  {selectedChips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedChips.slice(0, 3).map((chipId) => {
                        const chip = chips.find(c => c.id === chipId);
                        return chip ? (
                          <span
                            key={chipId}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {t(chip.labelKey)}
                          </span>
                        ) : null;
                      })}
                      {selectedChips.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{selectedChips.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <Textarea
                  placeholder={t("smartFeedback.textPlaceholder")}
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  className="min-h-[100px] resize-none rounded-xl"
                />

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full rounded-xl h-12"
                >
                  {isSubmitting ? t("smartFeedback.submitting") : t("smartFeedback.submit")}
                </Button>
              </div>
            )}

            {/* Success State */}
            {step === "success" && (
              <div className="text-center space-y-4 py-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {t("smartFeedback.thankYouMessage")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("smartFeedback.thankYouDesc")}
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="rounded-xl"
                >
                  {t("smartFeedback.done")}
                </Button>
              </div>
            )}

            {/* Step Indicator */}
            {step !== "success" && (
              <div className="flex justify-center gap-1.5 mt-6">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      s === step
                        ? "w-6 bg-primary"
                        : s < step
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-secondary"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SmartFeedback;
