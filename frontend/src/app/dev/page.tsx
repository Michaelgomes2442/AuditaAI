'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, Database, Activity, Terminal, Code, 
  Server, HardDrive, Cpu, Network, Lock, AlertTriangle,
  CheckCircle, XCircle, Clock, TrendingUp, RefreshCw,
  FileText, Settings, Zap, BarChart3, Eye, Trash2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  role: string;
  tier: string;
  permissions: string[];
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface SystemStats {
  users: {
    total: number;
    active: number;
    architects: number;
    admins: number;
    auditors: number;
  };
  database: {
    size: string;
    tables: number;
    records: number;
    lastBackup: string;
  };
  system: {
    uptime: string;
    memory: string;
    cpu: string;
    requests: number;
  };
}

export default function DevDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'database' | 'logs' | 'rosetta'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Rosetta management state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rosettas, setRosettas] = useState<any[]>([]);
  const [selectedRosetta1, setSelectedRosetta1] = useState<string>('');
  const [selectedRosetta2, setSelectedRosetta2] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  useEffect(() => {
    if (profile?.role === 'ARCHITECT') {
      loadDashboardData();
    }
  }, [profile]);

  useEffect(() => {
    if (autoRefresh && profile?.role === 'ARCHITECT') {
      const interval = setInterval(loadDashboardData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [autoRefresh, profile]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        
        // Redirect if not architect
        if (data.role !== 'ARCHITECT') {
          router.push('/profile');
        }
      } else {
        router.push('/signin');
      }
    } catch (err) {
      router.push('/signin');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load all users
      const usersRes = await fetch('/api/dev/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Load system stats
      const statsRes = await fetch('/api/dev/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load Rosetta versions
      const rosettasRes = await fetch('/api/dev/rosettas');
      if (rosettasRes.ok) {
        const rosettasData = await rosettasRes.json();
        setRosettas(rosettasData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/dev/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleUploadRosetta = async () => {
    if (!uploadFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    
    try {
      setUploadProgress(0);
      const response = await fetch('/api/dev/rosettas/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setUploadProgress(100);
        setUploadFile(null);
        loadDashboardData();
        alert('Rosetta uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to upload Rosetta:', err);
      alert('Failed to upload Rosetta');
    }
  };

  const handleCompareRosettas = async () => {
    if (!selectedRosetta1 || !selectedRosetta2) {
      alert('Please select two Rosettas to compare');
      return;
    }
    
    try {
      const response = await fetch('/api/dev/rosettas/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rosetta1: selectedRosetta1,
          rosetta2: selectedRosetta2,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setComparisonResult(data);
      }
    } catch (err) {
      console.error('Failed to compare Rosettas:', err);
    }
  };

  const handleDeleteRosetta = async (rosettaId: string) => {
    if (!confirm('Are you sure you want to delete this Rosetta version?')) return;
    
    try {
      const response = await fetch(`/api/dev/rosettas/${rosettaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete Rosetta:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-slate-400 font-mono">Loading dev dashboard...</p>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'ARCHITECT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-mono font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 font-mono mb-6">This dashboard is only accessible to Architects.</p>
          <Link href="/profile" className="px-6 py-3 rounded-lg bg-cyan-500 text-white font-mono hover:bg-cyan-600 transition-colors">
            Return to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(168, 85, 247, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative">
        {/* Navigation */}
        <AuthNav />

        <div className="container mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-mono text-purple-400">ARCHITECT DASHBOARD</span>
                </div>
                <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Developer Tools
                </h1>
                <p className="text-slate-300 text-sm mt-2 font-mono">
                  System monitoring and management console
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${
                    autoRefresh
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-slate-700 border border-slate-600 text-slate-400'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
                </button>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-mono text-sm hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-cyan-400" />
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">{stats?.users.total || 0}</div>
                  <div className="text-xs text-slate-400 font-mono">Total Users</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                <TrendingUp className="w-3 h-3" />
                {stats?.users.active || 0} active
              </div>
            </div>

            <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-purple-400" />
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">{stats?.database.tables || 0}</div>
                  <div className="text-xs text-slate-400 font-mono">DB Tables</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {stats?.database.size || '0 MB'} total
              </div>
            </div>

            <div className="bg-slate-800/50 border border-pink-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-pink-400" />
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">{stats?.system.requests || 0}</div>
                  <div className="text-xs text-slate-400 font-mono">API Requests</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Last 24 hours
              </div>
            </div>

            <div className="bg-slate-800/50 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Cpu className="w-8 h-8 text-green-400" />
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">{stats?.system.cpu || '0%'}</div>
                  <div className="text-xs text-slate-400 font-mono">CPU Usage</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {stats?.system.memory || '0 MB'} RAM
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  activeTab === 'database'
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Database
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                System Logs
              </button>
              <button
                onClick={() => setActiveTab('rosetta')}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  activeTab === 'rosetta'
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                Rosetta Management
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Status */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-400" />
                    System Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Frontend</span>
                      <span className="flex items-center gap-2 text-sm text-green-400 font-mono">
                        <CheckCircle className="w-4 h-4" />
                        Running
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Backend</span>
                      <span className="flex items-center gap-2 text-sm text-green-400 font-mono">
                        <CheckCircle className="w-4 h-4" />
                        Running
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Database</span>
                      <span className="flex items-center gap-2 text-sm text-green-400 font-mono">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Uptime</span>
                      <span className="text-sm text-white font-mono">{stats?.system.uptime || '0h 0m'}</span>
                    </div>
                  </div>
                </div>

                {/* User Breakdown */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    User Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Architects</span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 font-mono text-xs">
                        {stats?.users.architects || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Admins</span>
                      <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-xs">
                        {stats?.users.admins || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Auditors</span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-xs">
                        {stats?.users.auditors || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-mono">Active</span>
                      <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-mono text-xs">
                        {stats?.users.active || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  All Users
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-white">{user.id}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">{user.name || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            user.role === 'ARCHITECT' ? 'bg-purple-500/20 text-purple-400' :
                            user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'AUDITOR' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-xs font-mono bg-cyan-500/20 text-cyan-400">
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 text-xs font-mono ${
                            user.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {user.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Database Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 font-mono mb-1">Total Size</div>
                    <div className="text-2xl font-mono font-bold text-white">{stats?.database.size || '0 MB'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-mono mb-1">Total Tables</div>
                    <div className="text-2xl font-mono font-bold text-white">{stats?.database.tables || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-mono mb-1">Total Records</div>
                    <div className="text-2xl font-mono font-bold text-white">{stats?.database.records || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-mono mb-1">Last Backup</div>
                    <div className="text-lg font-mono text-white">{stats?.database.lastBackup || 'Never'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Backup DB
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-sm hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Run Migration
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-sm hover:bg-pink-500/20 transition-colors flex items-center justify-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Open Console
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                System Logs
              </h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 h-96 overflow-y-auto">
                <div>[{new Date().toISOString()}] INFO: System initialized</div>
                <div>[{new Date().toISOString()}] INFO: Database connected</div>
                <div>[{new Date().toISOString()}] INFO: Frontend server started on port 3000</div>
                <div>[{new Date().toISOString()}] INFO: Backend server started on port 3001</div>
                <div>[{new Date().toISOString()}] INFO: Architect dashboard accessed by {profile?.email}</div>
              </div>
            </div>
          )}

          {activeTab === 'rosetta' && (
            <div className="space-y-6">
              {/* Upload New Rosetta */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  Upload New Rosetta Version
                </h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                    <input
                      type="file"
                      accept=".json,.js,.ts"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="rosetta-upload"
                    />
                    <label htmlFor="rosetta-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-purple-500/10">
                          <Code className="w-8 h-8 text-purple-400" />
                        </div>
                        {uploadFile ? (
                          <>
                            <div className="text-white font-mono">{uploadFile.name}</div>
                            <div className="text-sm text-slate-400 font-mono">
                              {(uploadFile.size / 1024).toFixed(2)} KB
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-white font-mono">Click to select Rosetta file</div>
                            <div className="text-sm text-slate-400 font-mono">
                              JSON, JS, or TS files supported
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  {uploadFile && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleUploadRosetta}
                        className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                      >
                        Upload Rosetta
                      </button>
                      <button
                        onClick={() => setUploadFile(null)}
                        className="px-6 py-3 rounded-lg bg-slate-700 text-white font-mono hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400 font-mono">Uploading...</span>
                        <span className="text-sm text-purple-400 font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compare Rosettas */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Compare Rosetta Versions
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-mono text-slate-400 mb-2 block">VERSION 1</label>
                      <select
                        value={selectedRosetta1}
                        onChange={(e) => setSelectedRosetta1(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-white font-mono focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Select version...</option>
                        {rosettas.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} - v{r.version} ({new Date(r.uploadedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-mono text-slate-400 mb-2 block">VERSION 2</label>
                      <select
                        value={selectedRosetta2}
                        onChange={(e) => setSelectedRosetta2(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-purple-500/30 text-white font-mono focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select version...</option>
                        {rosettas.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} - v{r.version} ({new Date(r.uploadedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleCompareRosettas}
                    disabled={!selectedRosetta1 || !selectedRosetta2}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-mono font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compare Versions
                  </button>
                  
                  {comparisonResult && (
                    <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                      <div className="text-sm font-mono font-bold text-white mb-3">Comparison Results:</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="text-xs text-green-400 font-mono mb-1">Added Features</div>
                          <div className="text-2xl font-mono font-bold text-green-400">
                            {comparisonResult.added || 0}
                          </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="text-xs text-yellow-400 font-mono mb-1">Modified</div>
                          <div className="text-2xl font-mono font-bold text-yellow-400">
                            {comparisonResult.modified || 0}
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="text-xs text-red-400 font-mono mb-1">Removed</div>
                          <div className="text-2xl font-mono font-bold text-red-400">
                            {comparisonResult.removed || 0}
                          </div>
                        </div>
                      </div>
                      {comparisonResult.changes && comparisonResult.changes.length > 0 && (
                        <div className="mt-4 max-h-64 overflow-y-auto">
                          <div className="text-xs font-mono text-slate-400 mb-2">Detailed Changes:</div>
                          {comparisonResult.changes.map((change: any, idx: number) => (
                            <div key={idx} className="text-xs font-mono text-slate-300 mb-1 flex items-start gap-2">
                              <span className={`${
                                change.type === 'added' ? 'text-green-400' :
                                change.type === 'removed' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
                              </span>
                              <span>{change.path}: {change.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rosetta Versions List */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-pink-400" />
                    Installed Rosetta Versions
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Version</th>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Uploaded</th>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-mono font-bold text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {rosettas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-mono text-sm">
                            No Rosetta versions uploaded yet. Upload your first version above.
                          </td>
                        </tr>
                      ) : (
                        rosettas.map((rosetta) => (
                          <tr key={rosetta.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-white">{rosetta.name}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-mono">
                                v{rosetta.version}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-slate-300">
                              {rosetta.size}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-slate-300">
                              {new Date(rosetta.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-1 text-xs font-mono ${
                                rosetta.active ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {rosetta.active ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {rosetta.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRosetta(rosetta.id)}
                                  className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Planning Tools */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Deployment Planning
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <button className="px-4 py-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors">
                    <Terminal className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-sm font-mono text-white mb-1">Test Deployment</div>
                    <div className="text-xs font-mono text-slate-400">Run on staging</div>
                  </button>
                  <button className="px-4 py-6 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">
                    <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm font-mono text-white mb-1">Performance Test</div>
                    <div className="text-xs font-mono text-slate-400">Run benchmarks</div>
                  </button>
                  <button className="px-4 py-6 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-sm font-mono text-white mb-1">Deploy to Prod</div>
                    <div className="text-xs font-mono text-slate-400">Live deployment</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
