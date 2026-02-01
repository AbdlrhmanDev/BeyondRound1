import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_consent_accepted";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (accepted !== "true") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-5 rounded-2xl bg-card border border-border shadow-lg shadow-black/10 dark:shadow-black/30">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                We use cookies to keep you signed in and remember your preferences.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                By continuing, you agree to our use of cookies.{" "}
                <Link
                  to="/privacy"
                  className="underline hover:text-primary transition-colors"
                >
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
          <Button
            onClick={accept}
            className="w-full sm:w-auto shrink-0 rounded-xl"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
