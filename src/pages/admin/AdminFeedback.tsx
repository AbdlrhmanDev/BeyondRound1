import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Bug, Lightbulb, MessageSquare, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getFeedback, deleteFeedback, Feedback } from "@/services/adminService";

const categoryConfig = {
  bug: { label: "Bug Report", icon: Bug, color: "bg-red-500/10 text-red-500" },
  feature: { label: "Feature Request", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-500" },
  general: { label: "General", icon: MessageSquare, color: "bg-blue-500/10 text-blue-500" },
};

const AdminFeedback = () => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const feedbackData = await getFeedback(filter === "all" ? undefined : filter);
      setFeedback(feedbackData);
    } catch (error) {
      toast({ title: t("common.error"), description: t("admin.failedToFetchFeedback"), variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const handleDelete = async (id: string) => {
    const success = await deleteFeedback(id);
    if (!success) {
      toast({ title: t("common.error"), description: t("admin.failedToDeleteFeedback"), variant: "destructive" });
    } else {
      toast({ title: t("admin.deleted"), description: t("admin.feedbackRemoved") });
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feedback</h1>
            <p className="text-muted-foreground">
              {feedback.length} total submissions
            </p>
          </div>
          <Button variant="outline" onClick={fetchFeedback}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "bug", "feature", "general"].map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat === "all" ? "All" : categoryConfig[cat as keyof typeof categoryConfig]?.label}
            </Button>
          ))}
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : feedback.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No feedback found
              </CardContent>
            </Card>
          ) : (
            feedback.map((item) => {
              const config = categoryConfig[item.category as keyof typeof categoryConfig] || categoryConfig.general;
              const Icon = config.icon;
              
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {item.page_url && (
                          <span className="text-xs text-muted-foreground">
                            from {item.page_url}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.message}</p>
                    {item.user_id && (
                      <p className="text-xs text-muted-foreground mt-2">
                        User: {item.user_id.slice(0, 8)}...
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
