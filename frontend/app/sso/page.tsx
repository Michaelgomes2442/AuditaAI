"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Key, 
  Shield,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Clock,
  Users
} from "lucide-react";

interface SSOConfig {
  id: number;
  provider: string;
  enabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface SSOStats {
  totalLogins: number;
  activeConfigs: number;
  jitUsersCreated: number;
  lastLogin?: string;
}

export default function SSOPage() {
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [stats, setStats] = useState<SSOStats | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("SAML");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // SAML Configuration
  const [samlEntryPoint, setSamlEntryPoint] = useState("");
  const [samlIssuer, setSamlIssuer] = useState("");
  const [samlCert, setSamlCert] = useState("");
  const [samlCallbackUrl, setSamlCallbackUrl] = useState("");

  // OAuth Configuration
  const [oauthClientId, setOauthClientId] = useState("");
  const [oauthClientSecret, setOauthClientSecret] = useState("");
  const [oauthAuthUrl, setOauthAuthUrl] = useState("");
  const [oauthTokenUrl, setOauthTokenUrl] = useState("");

  // Common Settings
  const [domainRestriction, setDomainRestriction] = useState("");
  const [jitProvisioning, setJitProvisioning] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/sso/config");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs || []);
      }
    } catch (error) {
      console.error("Failed to fetch SSO configs:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/sso/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch SSO stats:", error);
    }
  };

  const handleCreateConfig = async () => {
    try {
      const configData: any = {
        provider: selectedProvider,
        enabled,
        domainRestriction: domainRestriction.split(",").map(d => d.trim()).filter(Boolean),
        jitProvisioning,
      };

      if (selectedProvider === "SAML") {
        configData.samlEntryPoint = samlEntryPoint;
        configData.samlIssuer = samlIssuer;
        configData.samlCert = samlCert;
        configData.samlCallbackUrl = samlCallbackUrl;
      } else {
        configData.oauthClientId = oauthClientId;
        configData.oauthClientSecret = oauthClientSecret;
        configData.oauthAuthUrl = oauthAuthUrl;
        configData.oauthTokenUrl = oauthTokenUrl;
      }

      const response = await fetch("/api/sso/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchConfigs();
        // Reset form
        setSamlEntryPoint("");
        setSamlIssuer("");
        setSamlCert("");
        setSamlCallbackUrl("");
        setOauthClientId("");
        setOauthClientSecret("");
        setOauthAuthUrl("");
        setOauthTokenUrl("");
        setDomainRestriction("");
      }
    } catch (error) {
      console.error("Failed to create SSO config:", error);
    }
  };

  const handleToggleConfig = async (id: number, enabled: boolean) => {
    try {
      const response = await fetch(`/api/sso/config/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error("Failed to toggle SSO config:", error);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm("Are you sure you want to delete this SSO configuration?")) return;

    try {
      const response = await fetch(`/api/sso/config/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error("Failed to delete SSO config:", error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "AZURE_AD": return "🔷";
      case "GOOGLE": return "🔍";
      case "OKTA": return "🔐";
      case "SAML": return "🔒";
      default: return "🔑";
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Enterprise SSO
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure Single Sign-On for your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SSO Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogins || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeConfigs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">JIT Users Created</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jitUsersCreated || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last SSO Login</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SSO Configurations</CardTitle>
              <CardDescription>Manage your identity provider integrations</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancel" : "Add Configuration"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="mb-6 p-6 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold mb-4">New SSO Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAML">SAML 2.0</SelectItem>
                      <SelectItem value="AZURE_AD">Azure AD (OAuth)</SelectItem>
                      <SelectItem value="GOOGLE">Google Workspace (OAuth)</SelectItem>
                      <SelectItem value="OKTA">Okta (OAuth)</SelectItem>
                      <SelectItem value="GENERIC_OAUTH">Generic OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs value={selectedProvider === "SAML" ? "saml" : "oauth"}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saml">SAML Configuration</TabsTrigger>
                    <TabsTrigger value="oauth">OAuth Configuration</TabsTrigger>
                  </TabsList>

                  <TabsContent value="saml" className="space-y-4">
                    <div>
                      <Label htmlFor="saml-entry-point">SSO Entry Point (IdP URL)</Label>
                      <Input
                        id="saml-entry-point"
                        placeholder="https://idp.example.com/sso"
                        value={samlEntryPoint}
                        onChange={(e) => setSamlEntryPoint(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="saml-issuer">Issuer (Entity ID)</Label>
                      <Input
                        id="saml-issuer"
                        placeholder="https://idp.example.com/entity"
                        value={samlIssuer}
                        onChange={(e) => setSamlIssuer(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="saml-cert">X.509 Certificate</Label>
                      <textarea
                        id="saml-cert"
                        className="w-full min-h-[120px] p-2 border rounded-md font-mono text-xs"
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        value={samlCert}
                        onChange={(e) => setSamlCert(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="saml-callback">Callback URL (ACS URL)</Label>
                      <Input
                        id="saml-callback"
                        placeholder="https://auditaai.com/api/sso/saml/callback"
                        value={samlCallbackUrl}
                        onChange={(e) => setSamlCallbackUrl(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="oauth" className="space-y-4">
                    <div>
                      <Label htmlFor="oauth-client-id">Client ID</Label>
                      <Input
                        id="oauth-client-id"
                        placeholder="your-client-id"
                        value={oauthClientId}
                        onChange={(e) => setOauthClientId(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="oauth-client-secret">Client Secret</Label>
                      <Input
                        id="oauth-client-secret"
                        type="password"
                        placeholder="your-client-secret"
                        value={oauthClientSecret}
                        onChange={(e) => setOauthClientSecret(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="oauth-auth-url">Authorization URL</Label>
                      <Input
                        id="oauth-auth-url"
                        placeholder="https://provider.com/oauth/authorize"
                        value={oauthAuthUrl}
                        onChange={(e) => setOauthAuthUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="oauth-token-url">Token URL</Label>
                      <Input
                        id="oauth-token-url"
                        placeholder="https://provider.com/oauth/token"
                        value={oauthTokenUrl}
                        onChange={(e) => setOauthTokenUrl(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label htmlFor="domain-restriction">Email Domain Restriction (comma-separated)</Label>
                  <Input
                    id="domain-restriction"
                    placeholder="example.com, company.com"
                    value={domainRestriction}
                    onChange={(e) => setDomainRestriction(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Just-In-Time (JIT) Provisioning</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create users on first SSO login
                    </p>
                  </div>
                  <Switch checked={jitProvisioning} onCheckedChange={setJitProvisioning} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Configuration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to sign in with this provider
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <Button onClick={handleCreateConfig} className="w-full">
                  Create Configuration
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {configs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No SSO configurations yet. Add one to get started.
              </p>
            ) : (
              configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getProviderIcon(config.provider)}</span>
                    <div>
                      <h4 className="font-medium">
                        {config.provider.replace(/_/g, " ")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(config.createdAt).toLocaleDateString()}
                        {config.lastUsedAt && ` • Last used ${new Date(config.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {config.enabled ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => handleToggleConfig(config.id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteConfig(config.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SSO Integration Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">SAML 2.0 Setup</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Obtain SSO URL and Entity ID from your identity provider</li>
              <li>Download the X.509 certificate</li>
              <li>Configure ACS URL: <code className="px-1 py-0.5 bg-muted rounded">https://auditaai.com/api/sso/saml/callback</code></li>
              <li>Add configuration above and test the integration</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">OAuth 2.0 Setup</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Register your application with the OAuth provider</li>
              <li>Obtain Client ID and Client Secret</li>
              <li>Configure callback URL: <code className="px-1 py-0.5 bg-muted rounded">https://auditaai.com/api/sso/oauth/callback</code></li>
              <li>Add configuration above and authorize the application</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              <strong>Security Note:</strong> Store certificates and secrets securely. Enable JIT provisioning only if you trust the identity provider's user validation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
