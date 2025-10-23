"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Lock,
  Unlock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Clock,
  Monitor
} from "lucide-react";

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface SecurityEvent {
  id: number;
  eventType: string;
  severity: string;
  ipAddress?: string;
  createdAt: string;
}

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    fetchSecurityStatus();
    fetchSecurityEvents();
    fetchIpWhitelist();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const response = await fetch("/api/security/status");
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error("Failed to fetch security status:", error);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const response = await fetch("/api/security/events");
      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch security events:", error);
    }
  };

  const fetchIpWhitelist = async () => {
    try {
      const response = await fetch("/api/security/ip-whitelist");
      if (response.ok) {
        const data = await response.json();
        setIpWhitelist(data.whitelist || []);
      }
    } catch (error) {
      console.error("Failed to fetch IP whitelist:", error);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await fetch("/api/security/2fa/setup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setShowSetup(true);
      }
    } catch (error) {
      console.error("Failed to setup 2FA:", error);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const response = await fetch("/api/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        setTwoFactorEnabled(true);
        setShowSetup(false);
        setVerificationCode("");
        fetchSecurityStatus();
      }
    } catch (error) {
      console.error("Failed to verify 2FA:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) return;

    try {
      const response = await fetch("/api/security/2fa/disable", {
        method: "POST",
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        fetchSecurityStatus();
      }
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
    }
  };

  const handleAddIp = async () => {
    if (!newIp) return;

    try {
      const response = await fetch("/api/security/ip-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: newIp }),
      });

      if (response.ok) {
        setNewIp("");
        fetchIpWhitelist();
      }
    } catch (error) {
      console.error("Failed to add IP:", error);
    }
  };

  const handleRemoveIp = async (ip: string) => {
    try {
      const response = await fetch("/api/security/ip-whitelist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: ip }),
      });

      if (response.ok) {
        fetchIpWhitelist();
      }
    } catch (error) {
      console.error("Failed to remove IP:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const severityColors = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Security Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and access controls
        </p>
      </div>

      <div className="grid gap-6">
        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication (Optional)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Unlock className="h-4 w-4" />
                      Disabled
                    </span>
                  )}
                </p>
              </div>
              {!twoFactorEnabled ? (
                <Button onClick={handleEnable2FA}>
                  <Lock className="h-4 w-4 mr-2" />
                  Enable 2FA
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleDisable2FA}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              )}
            </div>

            {showSetup && setupData && (
              <div className="space-y-4 border-t pt-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Scan QR Code</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Google Authenticator, Authy, or any TOTP app
                  </p>
                  <img
                    src={setupData.qrCode}
                    alt="2FA QR Code"
                    className="mx-auto border rounded-lg"
                    width={200}
                    height={200}
                  />
                </div>

                <div>
                  <Label>Or enter this code manually</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={setupData.secret} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(setupData.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerify2FA}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? "Verifying..." : "Verify & Enable"}
                </Button>

                {setupData.backupCodes.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Backup Codes
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Save these codes in a safe place. Each can be used once.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, index) => (
                        <code key={index} className="text-xs p-2 bg-white border rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* IP Whitelisting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              IP Whitelisting
            </CardTitle>
            <CardDescription>
              Only allow access from specific IP addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.100)"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
              />
              <Button onClick={handleAddIp}>Add IP</Button>
            </div>

            <div className="space-y-2">
              {ipWhitelist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No IP addresses whitelisted. Add one to restrict access.
                </p>
              ) : (
                ipWhitelist.map((ip, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <code className="text-sm">{ip}</code>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveIp(ip)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Password Strength Requirements</Label>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Minimum 8 characters</li>
                <li>• At least one uppercase letter</li>
                <li>• At least one lowercase letter</li>
                <li>• At least one number</li>
                <li>• At least one special character</li>
              </ul>
            </div>

            <div>
              <Label>Account Lockout</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Account locks for 30 minutes after 5 failed login attempts
              </p>
            </div>

            <Button variant="outline">Change Password</Button>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
            <CardDescription>
              Monitor account activity and security alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No security events recorded yet
                </p>
              ) : (
                securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {event.eventType.replace(/_/g, " ")}
                        </h4>
                        <Badge className={severityColors[event.severity as keyof typeof severityColors]}>
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {event.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.ipAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
