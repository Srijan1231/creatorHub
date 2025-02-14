"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Globe, Check } from "lucide-react";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  categories: {
    platformConnections: boolean;
    incomeReports: boolean;
    analyticsUpdates: boolean;
    securityAlerts: boolean;
  };
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    categories: {
      platformConnections: true,
      incomeReports: true,
      analyticsUpdates: true,
      securityAlerts: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/user/settings");
      const data = await response.json();
      
      if (response.ok) {
        setSettings({
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          marketingEmails: data.marketingEmails ?? false,
          categories: data.notificationCategories ?? {
            platformConnections: true,
            incomeReports: true,
            analyticsUpdates: true,
            securityAlerts: true,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  }

  async function saveSettings() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          marketingEmails: settings.marketingEmails,
          notificationCategories: settings.categories,
        }),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated.",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <Button onClick={saveSettings} disabled={isLoading}>
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about your account activity
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="push-notifications">Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive push notifications about important updates
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pushNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and promotions
              </p>
            </div>
            <Switch
              id="marketing-emails"
              checked={settings.marketingEmails}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, marketingEmails: checked })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notification Categories</h2>
        <div className="space-y-4">
          {[
            {
              id: "platformConnections",
              title: "Platform Connections",
              description: "Updates about your connected platforms",
            },
            {
              id: "incomeReports",
              title: "Income Reports",
              description: "Weekly and monthly income summaries",
            },
            {
              id: "analyticsUpdates",
              title: "Analytics Updates",
              description: "Performance metrics and insights",
            },
            {
              id: "securityAlerts",
              title: "Security Alerts",
              description: "Important security-related notifications",
            },
          ].map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <h3 className="font-medium">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Switch
                checked={settings.categories[category.id as keyof typeof settings.categories]}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    categories: {
                      ...settings.categories,
                      [category.id]: checked,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}