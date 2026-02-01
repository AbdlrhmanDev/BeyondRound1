import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || i18n.t("common.somethingWentWrong");
      const isConfigError = errorMessage.includes("Missing Supabase") || 
                           errorMessage.includes("VITE_SUPABASE") ||
                           errorMessage.includes("environment");

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>{i18n.t("common.applicationError")}</CardTitle>
              </div>
              <CardDescription>
                {isConfigError 
                  ? i18n.t("common.configurationError")
                  : i18n.t("common.somethingWentWrongShort")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">
                  {errorMessage}
                </p>
              </div>
              
              {isConfigError && (
                <div className="rounded-md bg-muted p-3 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("common.configErrorHint")}
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code className="text-xs bg-background px-1 py-0.5 rounded">VITE_SUPABASE_URL</code></li>
                    <li><code className="text-xs bg-background px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code></li>
                  </ul>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      {i18n.t("common.configErrorLocal")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i18n.t("common.configErrorVercel")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  {i18n.t("common.reloadPage")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
