import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { Bell, Key, User, LucideIcon, Activity } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await requireUser() as Session;
  if (!session?.user) return null;

  type SectionItem = {
    label: string;
    value: string | null | undefined;
    badge?: string;
    action?: React.ReactNode;
  };

  const sections: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    items: SectionItem[];
  }> = [
    {
      title: "Account",
      description: "Manage your account settings and preferences",
      icon: User,
      items: [
        {
          label: "Email",
          value: session.user.email,
          badge: session.user.role
        },
        {
          label: "Name",
          value: session.user.name
        }
      ]
    },
    {
      title: "Security",
      description: "Update your security preferences",
      icon: Key,
      items: [
        {
          label: "Two-factor authentication",
          value: "Not configured",
          action: <Button size="sm">Enable</Button>
        }
      ]
    },
    {
      title: "Notifications",
      description: "Configure how you receive notifications",
      icon: Bell,
      items: [
        {
          label: "Email notifications",
          value: "Enabled",
          action: <Button variant="outline" size="sm">Configure</Button>
        }
      ]
    },
    {
      title: "API Rate Limits",
      description: "Monitor and manage your API usage limits",
      icon: Activity,
      items: [
        {
          label: "View rate limits",
          value: "Monitor API quota and usage",
          action: (
            <Link href="/rate-limits">
              <Button variant="outline" size="sm">View Limits</Button>
            </Link>
          )
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <section.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {item.value}
                        </p>
                        {item.badge && (
                          <Badge variant="secondary">{item.badge}</Badge>
                        )}
                      </div>
                    </div>
                    {item.action}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
