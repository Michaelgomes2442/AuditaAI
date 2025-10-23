import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prismadb";
import { FileText, Shield, UserPlus } from "lucide-react";
import BlockMetrics from "./metrics";

async function getGovernanceStats() {
  const [userCount, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { role: "ADMIN" }
    }),
  ]);
  
  // Simulated policies until we have the actual table
  const policies = [
    {
      id: "1",
      name: "Data Retention Policy",
      description: "Audit logs are retained for 90 days",
      createdAt: new Date(2025, 9, 1)
    },
    {
      id: "2",
      name: "Access Control Policy",
      description: "Only admins can view sensitive data",
      createdAt: new Date(2025, 9, 15)
    },
    {
      id: "3",
      name: "Audit Frequency Policy",
      description: "System-wide audits run every 24 hours",
      createdAt: new Date(2025, 9, 20)
    }
  ];

  return {
    userCount,
    adminCount,
    policies
  };
}

export default async function GovernancePage() {
  const { userCount, adminCount, policies } = await getGovernanceStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Governance</h2>
      </div>
      
      <BlockMetrics orgId={userCount.toString()} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
              Users with platform access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground">
              Audit policies in effect
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Policies</CardTitle>
          <CardDescription>Latest audit policies and governance rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {policies.map((policy) => (
              <div key={policy.id} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{policy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {new Date(policy.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
