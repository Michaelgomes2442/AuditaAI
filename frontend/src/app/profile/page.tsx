'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Calendar, Award, Edit, Save, X, Loader2, Palette, Globe } from 'lucide-react';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Editable fields
  const [editedName, setEditedName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedName(data.name || '');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('An error occurred loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    // Validate password if changing
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!currentPassword) {
        setError('Current password required to change password');
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setEditedName(data.name || '');
        setIsEditing(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(profile?.name || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ARCHITECT':
        return 'from-purple-500 to-pink-500';
      case 'ADMIN':
        return 'from-red-500 to-orange-500';
      case 'AUDITOR':
        return 'from-blue-500 to-cyan-500';
      case 'WITNESS':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400 font-mono">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative">
        {/* Navigation */}
        <AuthNav />

        <div className="container mx-auto px-8 py-12 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">USER PROFILE</span>
            </div>
            <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-slate-300 text-sm mt-2 font-mono">
              View and manage your account settings
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-mono text-sm">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-mono text-sm">{error}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden">
            {/* Header with Edit Button */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-mono font-bold text-white">Account Information</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">User ID: #{profile.id}</p>
              </div>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-mono font-bold transition-all text-sm"
                >
                  <Edit className="w-4 h-4" />
                  EDIT PROFILE
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-500/20 border border-slate-500/30 text-slate-400 hover:bg-slate-500/30 font-mono font-bold transition-all text-sm disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 font-mono font-bold transition-all text-sm disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SAVING...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        SAVE CHANGES
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">FULL NAME</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-lg bg-slate-900/30 border border-white/5 text-white font-mono">
                    {profile.name || <span className="text-slate-500">Not set</span>}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-mono font-bold text-slate-400 mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  EMAIL ADDRESS
                </label>
                <div className="px-4 py-3 rounded-lg bg-slate-900/30 border border-white/5 text-slate-400 font-mono">
                  {profile.email}
                  <span className="ml-2 text-xs text-slate-500">(cannot be changed)</span>
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-mono font-bold text-slate-400 mb-2 block flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    ROLE
                  </label>
                  <div className={`px-4 py-3 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(profile.role)} text-white font-mono font-bold text-center`}>
                    {profile.role}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">STATUS</label>
                  <div className={`px-4 py-3 rounded-lg ${
                    profile.status === 'ACTIVE' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  } font-mono font-bold text-center`}>
                    {profile.status}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">PERMISSIONS</label>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-xs"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              {/* Architect Dev Tools Access */}
              {profile.role === 'ARCHITECT' && (
                <div className="pt-6 border-t border-white/10">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-mono font-bold text-white">Developer Tools</h3>
                          <p className="text-sm text-slate-400 font-mono">Architect-only system dashboard</p>
                        </div>
                      </div>
                      <Link
                        href="/dev"
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                      >
                        Open Dev Dashboard
                        <Award className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        User Management
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        System Monitoring
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Database Tools
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <label className="text-sm font-mono font-bold text-slate-400 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    CREATED
                  </label>
                  <div className="text-slate-300 font-mono text-sm">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">LAST LOGIN</label>
                  <div className="text-slate-300 font-mono text-sm">
                    {profile.lastLoginAt 
                      ? new Date(profile.lastLoginAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Password Change (Only in Edit Mode) */}
              {isEditing && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <h3 className="text-lg font-mono font-bold text-white mb-4">Change Password</h3>
                  
                  <div>
                    <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">CURRENT PASSWORD</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">NEW PASSWORD</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-mono font-bold text-slate-400 mb-2 block">CONFIRM NEW PASSWORD</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <p className="text-xs text-slate-500 font-mono">
                    Leave password fields empty if you don't want to change your password
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-mono font-bold text-white">Appearance Settings</h2>
              </div>
              <p className="text-sm text-slate-400 font-mono mt-1">Customize your interface preferences</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Theme Toggle */}
              <div>
                <label className="text-sm font-mono font-bold text-slate-400 mb-3 block flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  THEME
                </label>
                <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10">
                  <span className="text-sm font-mono text-slate-300">Choose your preferred color scheme</span>
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2">
                  Toggle between light and dark mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
