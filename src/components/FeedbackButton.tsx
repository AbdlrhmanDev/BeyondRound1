import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, X, Bug, Lightbulb, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/services/feedbackService";

const FeedbackButton = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = useMemo(
    () => [
      { id: "bug", labelKey: "feedbackModal.bugReport", icon: Bug, color: "text-red-500" },
      { id: "feature", labelKey: "feedbackModal.featureRequest", icon: Lightbulb, color: "text-yellow-500" },
      { id: "general", labelKey: "feedbackModal.general", icon: MessageSquare, color: "text-blue-500" },
    ],
    []
  );

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: t("feedbackModal.selectCategoryToast"),
        description: t("feedbackModal.selectCategoryToastDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: t("feedbackModal.enterFeedbackToast"),
        description: t("feedbackModal.enterFeedbackToastDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const success = await submitFeedback({
      user_id: user?.id || null,
      category,
      message: feedback.trim(),
      page_url: window.location.pathname,
    });

    if (!success) {
      toast({
        title: t("feedbackModal.errorToast"),
        description: t("feedbackModal.errorToastDesc"),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    toast({
      title: t("feedbackModal.thankYouTitle"),
      description: t("feedbackModal.thankYouDesc"),
    });
    
    setFeedback("");
    setCategory("");
    setIsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
                className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-full bg-orange-500 pl-3 pr-2 py-2 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background"
                aria-label={t("feedbackModal.tooltip")}
              >
                <MessageCircle className="h-5 w-5 text-white shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-white whitespace-nowrap pr-1">{t("feedbackModal.button")}</span>
              </div>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent side="left" className="font-medium">
            {t("feedbackModal.tooltip")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-2xl border-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            {t("feedbackModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("feedbackModal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                aria-label={t("feedbackModal.selectCategory", { label: t(cat.labelKey) })}
                aria-pressed={category === cat.id}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  category === cat.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                <span className="text-xs font-medium">{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder={t("feedbackModal.placeholder")}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] resize-none rounded-xl border-2"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
              <X className="h-4 w-4 mr-1" />
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl">
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? t("feedbackModal.sending") : t("feedbackModal.send")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackButton;
