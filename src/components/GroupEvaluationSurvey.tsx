'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getEvaluation, submitEvaluation } from "@/services/evaluationService";
import { uploadPhotos } from "@/services/storageService";

interface GroupEvaluationSurveyProps {
  groupId: string;
  matchWeek: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shouldShowSurvey = (matchWeek: string): boolean => {
  const now = new Date();
  const matchDate = new Date(matchWeek);
  matchDate.setHours(16, 0, 0, 0); // Thursday 4 PM
  
  // Show survey after Thursday evening (after 8 PM) or on Friday
  const thursdayEvening = new Date(matchDate);
  thursdayEvening.setHours(20, 0, 0, 0); // Thursday 8 PM
  
  return now >= thursdayEvening;
};

const GroupEvaluationSurvey = ({ groupId, matchWeek, open, onOpenChange }: GroupEvaluationSurveyProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [metInPerson, setMetInPerson] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [realConnection, setRealConnection] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !groupId) return;

    // Check if user already submitted evaluation
    const checkExistingEvaluation = async () => {
      const evaluation = await getEvaluation(user.id, groupId);
      
      if (evaluation) {
        setMetInPerson(evaluation.met_in_person);
        setRating(evaluation.meeting_rating);
        setRealConnection(evaluation.real_connection);
        setFeedbackText(evaluation.feedback_text || "");
        setPhotoUrls(evaluation.photos_urls || []);
        setHasSubmitted(true);
      }
    };

    checkExistingEvaluation();
  }, [user, groupId]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    const newPhotos: File[] = [];
    for (let i = 0; i < files.length && newPhotos.length + photos.length < 5; i++) {
      const file = files[i];
      if (file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
        newPhotos.push(file);
      }
    }

    if (newPhotos.length === 0) {
      toast({
        title: t("meetingEvaluation.toastInvalidPhotos"),
        description: t("meetingEvaluation.toastInvalidPhotosDesc"),
        variant: "destructive",
      });
      return;
    }

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const removePhotoUrl = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || metInPerson === null) {
      toast({
        title: t("meetingEvaluation.toastRequiredField"),
        description: t("meetingEvaluation.toastAnswerMetInPerson"),
        variant: "destructive",
      });
      return;
    }

    if (metInPerson && rating === null) {
      toast({
        title: t("meetingEvaluation.toastRequiredField"),
        description: t("meetingEvaluation.toastRateMeeting"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload photos if any
      let uploadedPhotoUrls: string[] = [...photoUrls];
      
      if (photos.length > 0 && user) {
        const basePath = `${user.id}/${groupId}`;
        const newUrls = await uploadPhotos('meeting-photos', photos, basePath);
        uploadedPhotoUrls = [...uploadedPhotoUrls, ...newUrls];
      }

      // Save evaluation using service
      const success = await submitEvaluation({
        user_id: user!.id,
        group_id: groupId,
        match_week: matchWeek,
        met_in_person: metInPerson,
        meeting_rating: rating,
        real_connection: realConnection,
        feedback_text: feedbackText || null,
        photos_urls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
      });

      if (!success) {
        throw new Error("Failed to submit evaluation");
      }

      setHasSubmitted(true);
      toast({
        title: t("meetingEvaluation.toastThankYou"),
        description: t("meetingEvaluation.toastThankYouDesc"),
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast({
        title: t("meetingEvaluation.toastError"),
        description: t("meetingEvaluation.toastErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show if it's not time yet
  if (!shouldShowSurvey(matchWeek)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("meetingEvaluation.title")}</DialogTitle>
          <DialogDescription>
            {t("meetingEvaluation.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("meetingEvaluation.didYouMeet")}
            </Label>
            <RadioGroup
              value={metInPerson === null ? "" : metInPerson ? "yes" : "no"}
              onValueChange={(value) => {
                if (value) {
                  setMetInPerson(value === "yes");
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="met-yes" />
                <Label htmlFor="met-yes" className="font-normal cursor-pointer">
                  {t("meetingEvaluation.yesWeMet")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="met-no" />
                <Label htmlFor="met-no" className="font-normal cursor-pointer">
                  {t("meetingEvaluation.noWeDidntMeet")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {metInPerson && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t("meetingEvaluation.howWasMeeting")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={t("meetingEvaluation.rateOutOf5", { value })}
                      aria-pressed={rating === value}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        rating === value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                    <div className="flex items-center justify-center gap-2">
                      <Star
                        className={`h-6 w-6 ${
                          rating === value ? "fill-primary text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="font-semibold">{value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {metInPerson && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t("meetingEvaluation.realConnection")}
              </Label>
              <RadioGroup
                value={realConnection === null ? "" : realConnection ? "yes" : "no"}
                onValueChange={(value) => {
                  if (value) {
                    setRealConnection(value === "yes");
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="connection-yes" />
                  <Label htmlFor="connection-yes" className="font-normal cursor-pointer">
                    {t("meetingEvaluation.yesDefinitely")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="connection-no" />
                  <Label htmlFor="connection-no" className="font-normal cursor-pointer">
                    {t("meetingEvaluation.notReally")}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("meetingEvaluation.sharePhotos")}
            </Label>
            <div className="space-y-3">
              {/* Existing photos */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={t("meetingEvaluation.meetingPhoto", { index: index + 1 })}
                        className="w-full h-24 object-cover rounded-xl"
                        loading="lazy"
                        decoding="async"
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoUrl(index)}
                        aria-label={t("meetingEvaluation.removePhoto", { index: index + 1 })}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New photos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={t("meetingEvaluation.previewPhoto", { index: index + 1 })}
                        className="w-full h-24 object-cover rounded-xl"
                        loading="lazy"
                        decoding="async"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label={t("meetingEvaluation.removePreviewPhoto", { index: index + 1 })}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length + photoUrls.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">{t("meetingEvaluation.addPhotosMax5")}</span>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-base font-semibold">
              {t("meetingEvaluation.additionalFeedback")}
            </Label>
            <Textarea
              id="feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t("meetingEvaluation.additionalFeedbackPlaceholder")}
              className="min-h-[100px] rounded-xl border-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {!hasSubmitted && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl"
                >
                  {t("meetingEvaluation.skip")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-xl"
                >
                  {loading ? t("meetingEvaluation.submitting") : t("meetingEvaluation.submit")}
                </Button>
              </>
            )}
            {hasSubmitted && (
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl"
              >
                {t("meetingEvaluation.close")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupEvaluationSurvey;
