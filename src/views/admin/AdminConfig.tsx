'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, RefreshCw, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAppConfig, updateAppConfig } from "@/services/adminService";

interface ConfigItem {
  key: string;
  value: string;
  updated_at?: string;
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchConfig = async () => {
    setLoading(true);
    const data = await getAppConfig();
    setConfig(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleEdit = (item: ConfigItem) => {
    setEditingKey(item.key);
    setEditValue(item.value);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    const success = await updateAppConfig(key, editValue, `Updated ${key}`);
    setSaving(false);

    if (success) {
      toast({ title: "Config updated", description: `${key} saved` });
      setEditingKey(null);
      fetchConfig();
    } else {
      toast({ title: "Error", description: "Failed to update config", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              App Config
            </h1>
            <p className="text-muted-foreground">Manage application settings</p>
          </div>
          <Button variant="outline" onClick={fetchConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Keys ({config.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : config.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No configuration entries</p>
            ) : (
              <div className="space-y-3">
                {config.map((item) => (
                  <div key={item.key} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="min-w-[200px]">
                      <span className="font-mono text-sm font-medium">{item.key}</span>
                    </div>
                    {editingKey === item.key ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleSave(item.key)} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-mono truncate max-w-md">
                          {item.value}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
