'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, AlertTriangle, Calendar, Save, Loader2 } from 'lucide-react';

interface NotificationPreferences {
  id?: number;
  emailEnabled: boolean;
  testComplete: boolean;
  batchComplete: boolean;
  scheduledTestComplete: boolean;
  alertsEnabled: boolean;
  lowScoreThreshold: number;
  highScoreThreshold: number;
  scoreDropAlert: boolean;
  witnessFailureAlert: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  reportTime: string;
}

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    testComplete: true,
    batchComplete: true,
    scheduledTestComplete: true,
    alertsEnabled: true,
    lowScoreThreshold: 70,
    highScoreThreshold: 90,
    scoreDropAlert: true,
    witnessFailureAlert: true,
    dailyReport: false,
    weeklyReport: true,
    monthlyReport: false,
    reportTime: '09:00',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification preferences saved',
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications about your tests and alerts
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Email Notifications</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailEnabled" className="text-base font-medium">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="emailEnabled"
                checked={preferences.emailEnabled}
                onCheckedChange={(checked: boolean) => updatePreference('emailEnabled', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: preferences.emailEnabled ? 1 : 0.5 }}>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="testComplete" className="font-medium">
                    Test Completion
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify when individual tests complete
                  </p>
                </div>
                <Switch
                  id="testComplete"
                  checked={preferences.testComplete}
                  onCheckedChange={(checked: boolean) => updatePreference('testComplete', checked)}
                  disabled={!preferences.emailEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="batchComplete" className="font-medium">
                    Batch Test Completion
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify when batch tests finish
                  </p>
                </div>
                <Switch
                  id="batchComplete"
                  checked={preferences.batchComplete}
                  onCheckedChange={(checked: boolean) => updatePreference('batchComplete', checked)}
                  disabled={!preferences.emailEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scheduledTestComplete" className="font-medium">
                    Scheduled Test Completion
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify when scheduled tests complete
                  </p>
                </div>
                <Switch
                  id="scheduledTestComplete"
                  checked={preferences.scheduledTestComplete}
                  onCheckedChange={(checked: boolean) => updatePreference('scheduledTestComplete', checked)}
                  disabled={!preferences.emailEnabled}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Alerts */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Performance Alerts</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alertsEnabled" className="text-base font-medium">
                  Enable Performance Alerts
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified about performance issues
                </p>
              </div>
              <Switch
                id="alertsEnabled"
                checked={preferences.alertsEnabled}
                onCheckedChange={(checked: boolean) => updatePreference('alertsEnabled', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-6 opacity-100 transition-opacity" style={{ opacity: preferences.alertsEnabled ? 1 : 0.5 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lowScoreThreshold" className="font-medium">
                    Low Score Threshold
                  </Label>
                  <Input
                    id="lowScoreThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={preferences.lowScoreThreshold}
                    onChange={(e) => updatePreference('lowScoreThreshold', parseFloat(e.target.value))}
                    disabled={!preferences.alertsEnabled}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Alert when score falls below this value
                  </p>
                </div>

                <div>
                  <Label htmlFor="highScoreThreshold" className="font-medium">
                    High Score Threshold
                  </Label>
                  <Input
                    id="highScoreThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={preferences.highScoreThreshold}
                    onChange={(e) => updatePreference('highScoreThreshold', parseFloat(e.target.value))}
                    disabled={!preferences.alertsEnabled}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Celebrate when score exceeds this value
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scoreDropAlert" className="font-medium">
                    Score Drop Detection
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alert on significant score decreases
                  </p>
                </div>
                <Switch
                  id="scoreDropAlert"
                  checked={preferences.scoreDropAlert}
                  onCheckedChange={(checked: boolean) => updatePreference('scoreDropAlert', checked)}
                  disabled={!preferences.alertsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="witnessFailureAlert" className="font-medium">
                    Witness Consensus Failures
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alert when witness verification fails
                  </p>
                </div>
                <Switch
                  id="witnessFailureAlert"
                  checked={preferences.witnessFailureAlert}
                  onCheckedChange={(checked: boolean) => updatePreference('witnessFailureAlert', checked)}
                  disabled={!preferences.alertsEnabled}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Scheduled Reports */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Scheduled Reports</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dailyReport" className="font-medium">
                  Daily Report
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive a daily summary of your tests
                </p>
              </div>
              <Switch
                id="dailyReport"
                checked={preferences.dailyReport}
                onCheckedChange={(checked: boolean) => updatePreference('dailyReport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyReport" className="font-medium">
                  Weekly Report
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive a weekly summary of your tests
                </p>
              </div>
              <Switch
                id="weeklyReport"
                checked={preferences.weeklyReport}
                onCheckedChange={(checked: boolean) => updatePreference('weeklyReport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="monthlyReport" className="font-medium">
                  Monthly Report
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive a monthly summary of your tests
                </p>
              </div>
              <Switch
                id="monthlyReport"
                checked={preferences.monthlyReport}
                onCheckedChange={(checked: boolean) => updatePreference('monthlyReport', checked)}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="reportTime" className="font-medium">
                Report Delivery Time
              </Label>
              <Input
                id="reportTime"
                type="time"
                value={preferences.reportTime}
                onChange={(e) => updatePreference('reportTime', e.target.value)}
                className="mt-2 max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Time to send scheduled reports (your local time)
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={savePreferences}
            disabled={saving}
            size="lg"
            className="min-w-[150px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
