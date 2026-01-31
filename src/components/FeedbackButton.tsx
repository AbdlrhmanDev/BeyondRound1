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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id || null,
      category,
      message: feedback.trim(),
      page_url: window.location.pathname,
    });

    if (error) {
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
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
          aria-label="Open feedback dialog"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
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
