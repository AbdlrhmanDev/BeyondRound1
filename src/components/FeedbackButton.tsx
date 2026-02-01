import { useState } from "react";
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

const categories = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "text-red-500" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, color: "text-yellow-500" },
  { id: "general", label: "General", icon: MessageSquare, color: "text-blue-500" },
];

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: "Select a category",
        description: "Please choose a feedback category",
        variant: "destructive",
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "Please enter feedback",
        description: "Your feedback cannot be empty",
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
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    toast({
      title: "Thank you! 💜",
      description: "Your feedback has been submitted",
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
                aria-label="Feedback — أرسل رأيك أو اقتراحك"
              >
                <MessageCircle className="h-5 w-5 text-white shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-white whitespace-nowrap pr-1">Feedback</span>
              </div>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent side="left" className="font-medium">
            أرسل رأيك أو اقتراحك — Send feedback
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Share your thoughts, report bugs, or suggest new features. We'd love to hear from you!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Category Selection */}
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                aria-label={`Select ${cat.label} category`}
                aria-pressed={category === cat.id}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  category === cat.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us what you think... suggestions, bugs, or anything else!"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackButton;
