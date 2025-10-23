'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Crown,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
  organization: {
    id: number;
    name: string;
  };
  members: TeamMember[];
  _count?: {
    members: number;
  };
  createdAt: string;
}

interface TeamMember {
  id: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

export default function TeamWorkspacePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (response.ok) {
        const newTeam = await response.json();
        setTeams([...teams, newTeam]);
        setSelectedTeam(newTeam);
        setNewTeamName('');
        setShowCreateTeam(false);
        toast({
          title: 'Success',
          description: 'Team created successfully',
        });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    }
  };

  const inviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        await fetchTeams();
        setInviteEmail('');
        toast({
          title: 'Success',
          description: 'Team member invited',
        });
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to invite member',
        variant: 'destructive',
      });
    }
  };

  const updateMemberRole = async (memberId: number, newRole: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchTeams();
        toast({
          title: 'Success',
          description: 'Member role updated',
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const removeMember = async (memberId: number) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTeams();
        toast({
          title: 'Success',
          description: 'Member removed from team',
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'MEMBER':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      case 'MEMBER':
        return 'outline';
      case 'VIEWER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Workspaces</h1>
        <p className="text-muted-foreground">
          Collaborate with your team and share test collections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Teams Sidebar */}
        <Card className="p-4 lg:col-span-1 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Your Teams</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateTeam(!showCreateTeam)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showCreateTeam && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <Label htmlFor="teamName" className="text-sm">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Marketing Team"
                className="mt-2 mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={createTeam}>
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateTeam(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTeam?.id === team.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {team.members?.length || 0} members
                </p>
              </button>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No teams yet</p>
                <p className="text-xs">Create your first team</p>
              </div>
            )}
          </div>
        </Card>

        {/* Team Details */}
        <div className="lg:col-span-3">
          {selectedTeam ? (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="collections">Shared Collections</TabsTrigger>
                <TabsTrigger value="analytics">Team Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="inviteEmail">Email Address</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inviteRole">Role</Label>
                      <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                        <SelectTrigger className="w-[150px] mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={inviteMember}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                  <div className="space-y-3">
                    {selectedTeam.members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getRoleIcon(member.role)}
                          <div>
                            <p className="font-medium">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role) as any}>
                            {member.role}
                          </Badge>
                          {member.role !== 'OWNER' && (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(val) => updateMemberRole(member.id, val)}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                  <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Role Descriptions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Crown className="h-5 w-5 text-yellow-500 mt-1" />
                      <div>
                        <p className="font-medium">Owner</p>
                        <p className="text-sm text-muted-foreground">
                          Full access to team, can delete team and manage all members
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Shield className="h-5 w-5 text-blue-500 mt-1" />
                      <div>
                        <p className="font-medium">Admin</p>
                        <p className="text-sm text-muted-foreground">
                          Can invite members, manage collections, and view analytics
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Edit className="h-5 w-5 text-green-500 mt-1" />
                      <div>
                        <p className="font-medium">Member</p>
                        <p className="text-sm text-muted-foreground">
                          Can create and edit shared test collections
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Eye className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium">Viewer</p>
                        <p className="text-sm text-muted-foreground">
                          Read-only access to shared collections and analytics
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Collections Tab */}
              <TabsContent value="collections">
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Shared Collections</h3>
                  <p className="text-muted-foreground mb-4">
                    Create collections of tests to share with your team
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Collection
                  </Button>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Team Analytics</h3>
                  <p className="text-muted-foreground">
                    View team performance metrics and usage statistics
                  </p>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamNameEdit">Team Name</Label>
                      <Input
                        id="teamNameEdit"
                        defaultValue={selectedTeam.name}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedTeam.organization.name}
                      </p>
                    </div>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Team
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Team Selected</h3>
              <p className="text-muted-foreground mb-6">
                Select a team or create a new one to get started
              </p>
              <Button onClick={() => setShowCreateTeam(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
