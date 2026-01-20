import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      const { data } = await supabase
        .from("group_evaluations" as never)
        .select("id, met_in_person, meeting_rating, real_connection, feedback_text, photos_urls")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .maybeSingle();

      if (data && typeof data === 'object' && 'met_in_person' in data) {
        const evaluation = data as {
          met_in_person: boolean;
          meeting_rating: number | null;
          real_connection: boolean | null;
          feedback_text: string | null;
          photos_urls: string[] | null;
        };
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
        title: "Invalid photos",
        description: "Please select valid image files under 5MB each.",
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
        title: "Required field",
        description: "Please answer whether you met in person.",
        variant: "destructive",
      });
      return;
    }

    if (metInPerson && rating === null) {
      toast({
        title: "Required field",
        description: "Please rate the meeting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload photos if any
      let uploadedPhotoUrls: string[] = [...photoUrls];
      
      if (photos.length > 0) {
        const uploadPromises = photos.map(async (photo) => {
          const fileExt = photo.name.split('.').pop();
          const filePath = `${user.id}/${groupId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('meeting-photos')
            .upload(filePath, photo);
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('meeting-photos')
              .getPublicUrl(filePath);
            return publicUrl;
          }
          return null;
        });

        const urls = await Promise.all(uploadPromises);
        uploadedPhotoUrls = [...uploadedPhotoUrls, ...urls.filter(Boolean) as string[]];
      }

      // Save evaluation
      const { error } = await supabase
        .from("group_evaluations" as never)
        .upsert({
          user_id: user.id,
          group_id: groupId,
          met_in_person: metInPerson,
          meeting_rating: rating,
          real_connection: realConnection,
          feedback_text: feedbackText || null,
          photos_urls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
        } as never, {
          onConflict: "user_id,group_id",
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your evaluation has been submitted successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Meeting Evaluation</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience from the group meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Did you meet in person? */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Did you actually meet in person? *
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
                  Yes, we met
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="met-no" />
                <Label htmlFor="met-no" className="font-normal cursor-pointer">
                  No, we didn't meet
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Rating - only if they met */}
          {metInPerson && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                How was the meeting? * (Rate 1-5)
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
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

          {/* Real Connection */}
          {metInPerson && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Did you feel there was a "Real Connection"?
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
                    Yes, definitely
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="connection-no" />
                  <Label htmlFor="connection-no" className="font-normal cursor-pointer">
                    Not really
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Can you share photos from the meeting? (Optional)
            </Label>
            <div className="space-y-3">
              {/* Existing photos */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Meeting photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoUrl(index)}
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
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length + photoUrls.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Add Photos (Max 5)</span>
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

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-base font-semibold">
              Additional feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share any additional thoughts about the meeting..."
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            {!hasSubmitted && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
            {hasSubmitted && (
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupEvaluationSurvey;
