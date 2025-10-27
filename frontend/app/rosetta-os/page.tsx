'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload,
  Shield, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Hash,
  Clock,
  User,
  ChevronRight,
  Download,
  RefreshCw,
  ArrowUp,
  Archive,
  Eye,
  Zap,
  Database,
  GitBranch,
  Settings,
  Lock,
  Cpu,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface RosettaVersion {
  id: string;
  version: string;
  band: string;
  hash: string;
  fileUrl: string;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'active' | 'archived' | 'failed';
  deltaSummary: string;
  createdAt: Date;
  activatedAt: Date | null;
}

interface UploadStep {
  step: number;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
}

interface RosettaReceipt {
  id: string;
  type: string;
  version: string;
  band: string;
  lamport: number;
  timestamp: Date;
  hash: string;
}

export default function RosettaOSDashboard() {
  // Active Rosetta
  const [activeRosetta, setActiveRosetta] = useState<RosettaVersion | null>(null);
  
  // Version history
  const [versions, setVersions] = useState<RosettaVersion[]>([]);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Receipts
  const [receipts, setReceipts] = useState<RosettaReceipt[]>([]);
  
  // UI state
  const [selectedVersion, setSelectedVersion] = useState<RosettaVersion | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [lamportClock, setLamportClock] = useState(1547);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with sample data
  useEffect(() => {
    const now = Date.now();
    
    const sampleVersions: RosettaVersion[] = [
      {
        id: 'rv-1',
        version: 'vΩ.9a',
        band: 'Band-1',
        hash: 'sha256:7a3e4f8b2c1d9e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
        fileUrl: '/rosetta/v9a.html',
        uploadedBy: 'Michael Gomes',
        status: 'active',
        deltaSummary: 'baseline - full CRIES integration',
        createdAt: new Date(now - 21 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(now - 20 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'rv-2',
        version: 'vΩ.8f',
        band: 'Band-0',
        hash: 'sha256:6b9c3e2a1f0d8e7b4c5a6d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9',
        fileUrl: '/rosetta/v8f.html',
        uploadedBy: 'Michael Gomes',
        status: 'archived',
        deltaSummary: '+field vectors, coherence coupling',
        createdAt: new Date(now - 51 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(now - 50 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'rv-3',
        version: 'vΩ.7d',
        band: 'Band-0',
        hash: 'sha256:2c8d5f1a4b7e9c6d3a8f5b2e9d6c3a0f7b4e1d8c5a2f9b6e3d0c7a4f1e8d5b2',
        fileUrl: '/rosetta/v7d.html',
        uploadedBy: 'Michael Gomes',
        status: 'archived',
        deltaSummary: 'initial Δ-receipts implementation',
        createdAt: new Date(now - 69 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(now - 68 * 24 * 60 * 60 * 1000)
      }
    ];
    
    setVersions(sampleVersions);
    setActiveRosetta(sampleVersions[0]);

    const sampleReceipts: RosettaReceipt[] = [
      {
        id: 'rcpt-1',
        type: 'Δ-ROSETTA-PROMOTE',
        version: 'vΩ.9a',
        band: 'Band-1',
        lamport: 1520,
        timestamp: new Date(now - 20 * 24 * 60 * 60 * 1000),
        hash: '0x7a3e4f8b'
      },
      {
        id: 'rcpt-2',
        type: 'Δ-ROSETTA-VERIFY',
        version: 'vΩ.9a',
        band: 'Band-1',
        lamport: 1519,
        timestamp: new Date(now - 21 * 24 * 60 * 60 * 1000),
        hash: '0x7a3e4f8a'
      },
      {
        id: 'rcpt-3',
        type: 'Δ-ROSETTA-UPLOAD',
        version: 'vΩ.9a',
        band: 'Band-1',
        lamport: 1518,
        timestamp: new Date(now - 21 * 24 * 60 * 60 * 1000),
        hash: '0x7a3e4f89'
      }
    ];
    
    setReceipts(sampleReceipts);
  }, []);

  // Handle file drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['.html', '.pdf', '.zip', '.json'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      alert('Invalid file type. Please upload .html, .pdf, .zip, or .json files.');
      return;
    }
    
    setSelectedFile(file);
  };

  const uploadRosetta = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    const steps: UploadStep[] = [
      { step: 1, label: 'Upload', status: 'processing', message: 'Uploading file...' },
      { step: 2, label: 'Verify', status: 'pending' },
      { step: 3, label: 'Compare', status: 'pending' },
      { step: 4, label: 'Promote', status: 'pending' }
    ];
    setUploadSteps(steps);

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 1: Upload complete
    steps[0].status = 'complete';
    steps[0].message = 'File uploaded successfully';
    steps[1].status = 'processing';
    steps[1].message = 'Computing SHA-256 hash...';
    setUploadSteps([...steps]);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Step 2: Verify complete
    const mockHash = `sha256:${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(64, '0')}`;
    steps[1].status = 'complete';
    steps[1].message = `Hash verified: ${mockHash.substring(0, 20)}...`;
    steps[2].status = 'processing';
    steps[2].message = 'Comparing with vΩ.9a...';
    setUploadSteps([...steps]);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Compare complete
    const mockDelta = '+18 new receipts, CRIES weights updated, Band-2 integration';
    steps[2].status = 'complete';
    steps[2].message = mockDelta;
    steps[3].status = 'processing';
    steps[3].message = 'Promoting to active runtime...';
    setUploadSteps([...steps]);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 4: Promote complete
    steps[3].status = 'complete';
    steps[3].message = 'Rosetta vΩ.10 activated';
    setUploadSteps([...steps]);

    // Create new version
    const newVersion: RosettaVersion = {
      id: `rv-${Date.now()}`,
      version: 'vΩ.10',
      band: 'Band-1',
      hash: mockHash,
      fileUrl: `/rosetta/v10.${selectedFile.name.split('.').pop()}`,
      uploadedBy: 'Michael Gomes',
      status: 'active',
      deltaSummary: mockDelta,
      createdAt: new Date(),
      activatedAt: new Date()
    };

    // Archive old active version
    setVersions(prev => {
      const updated = prev.map(v => 
        v.status === 'active' ? { ...v, status: 'archived' as const } : v
      );
      return [newVersion, ...updated];
    });

    setActiveRosetta(newVersion);

    // Create receipts
    const newReceipts: RosettaReceipt[] = [
      {
        id: `rcpt-${Date.now()}-3`,
        type: 'Δ-ROSETTA-PROMOTE',
        version: 'vΩ.10',
        band: 'Band-1',
        lamport: lamportClock + 3,
        timestamp: new Date(),
        hash: `0x${Math.floor(Math.random() * 0xFFFF).toString(16)}`
      },
      {
        id: `rcpt-${Date.now()}-2`,
        type: 'Δ-ROSETTA-VERIFY',
        version: 'vΩ.10',
        band: 'Band-1',
        lamport: lamportClock + 2,
        timestamp: new Date(),
        hash: `0x${Math.floor(Math.random() * 0xFFFF).toString(16)}`
      },
      {
        id: `rcpt-${Date.now()}-1`,
        type: 'Δ-ROSETTA-UPLOAD',
        version: 'vΩ.10',
        band: 'Band-1',
        lamport: lamportClock + 1,
        timestamp: new Date(),
        hash: `0x${Math.floor(Math.random() * 0xFFFF).toString(16)}`
      }
    ];

    setReceipts(prev => [...newReceipts, ...prev]);
    setLamportClock(prev => prev + 3);

    // Reset upload state
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFile(null);
      setUploadSteps([]);
    }, 2000);
  };

  const reverifyIntegrity = async () => {
    if (!activeRosetta) return;
    
    // Simulate reverification
    alert(`Re-verifying integrity of ${activeRosetta.version}...\n\nHash: ${activeRosetta.hash}\n\n✅ Integrity verified!`);
  };

  const exportReceipt = () => {
    if (!activeRosetta) return;
    
    const receipt = {
      version: activeRosetta.version,
      band: activeRosetta.band,
      hash: activeRosetta.hash,
      status: activeRosetta.status,
      uploadedBy: activeRosetta.uploadedBy,
      activatedAt: activeRosetta.activatedAt,
      receipts: receipts.filter(r => r.version === activeRosetta.version)
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rosetta-${activeRosetta.version}-receipt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusDisplay = (status: RosettaVersion['status']) => {
    switch (status) {
      case 'active':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-500/10', label: '✅ Active' };
      case 'verified':
        return { icon: <Shield className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10', label: '🛡️ Verified' };
      case 'archived':
        return { icon: <Archive className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-500/10', label: '🗃 Archived' };
      case 'pending':
        return { icon: <Clock className="w-4 h-4" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: '⏳ Pending' };
      case 'failed':
        return { icon: <XCircle className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10', label: '❌ Failed' };
    }
  };

  const getStepIcon = (status: UploadStep['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Cpu className="w-10 h-10 text-purple-400" />
              Rosetta OS Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Cognitive OS management and version control</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              <Database className="w-3 h-3 mr-1" />
              {versions.length} Versions
            </Badge>
            <Badge variant="outline" className="border-pink-500 text-pink-400">
              <Zap className="w-3 h-3 mr-1" />
              Lamport: {lamportClock}
            </Badge>
          </div>
        </div>

        {/* Active Rosetta Summary */}
        {activeRosetta && (
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-100 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-purple-400" />
                    Active Rosetta Monolith
                  </CardTitle>
                  <CardDescription>Currently governing all AuditaAI operations</CardDescription>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-1">
                  🟢 ACTIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Version</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">{activeRosetta.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Band Level</p>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {activeRosetta.band}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    {(() => {
                      const display = getStatusDisplay(activeRosetta.status);
                      return (
                        <Badge className={`${display.bg} ${display.color} border-0`}>
                          {display.icon}
                          <span className="ml-1">{display.label}</span>
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">SHA-256 Hash</p>
                    <div className="bg-slate-900/50 rounded p-2 border border-slate-700">
                      <code className="text-xs text-pink-400 font-mono break-all">
                        {activeRosetta.hash}
                      </code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Uploaded By</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">{activeRosetta.uploadedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Activated</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {activeRosetta.activatedAt?.toLocaleDateString()} {activeRosetta.activatedAt?.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Δ-Summary</p>
                    <p className="text-sm text-slate-300">{activeRosetta.deltaSummary}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reverifyIntegrity}
                  className="border-purple-500/30 hover:bg-purple-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-verify Integrity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportReceipt}
                  className="border-pink-500/30 hover:bg-pink-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Promote New Rosetta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Upload & Validation Panel */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload & Validation
              </CardTitle>
              <CardDescription>Upload new Rosetta Monolith for verification and promotion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".html,.pdf,.zip,.json"
                  onChange={handleFileInput}
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                {selectedFile ? (
                  <>
                    <p className="text-lg font-medium text-slate-200 mb-2">{selectedFile.name}</p>
                    <p className="text-sm text-slate-400 mb-4">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadRosetta();
                      }}
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload & Verify
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-slate-300 mb-2">
                      Drop your Rosetta Monolith here
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      or click to browse
                    </p>
                    <p className="text-xs text-slate-600">
                      Supports: .html, .pdf, .zip, .json
                    </p>
                  </>
                )}
              </div>

              {/* Validation Steps */}
              {uploadSteps.length > 0 && (
                <div className="space-y-3">
                  {uploadSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        step.status === 'complete' ? 'border-green-500/30 bg-green-500/5' :
                        step.status === 'processing' ? 'border-blue-500/30 bg-blue-500/5' :
                        step.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                        'border-slate-700 bg-slate-800/30'
                      }`}
                    >
                      <div className="mt-0.5">{getStepIcon(step.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">
                            Step {step.step}
                          </span>
                          <span className="text-sm font-medium text-slate-200">
                            {step.label}
                          </span>
                        </div>
                        {step.message && (
                          <p className="text-xs text-slate-400">{step.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Receipts */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Recent Receipts
              </CardTitle>
              <CardDescription>Δ-events related to Rosetta operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receipts.slice(0, 8).map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="mt-1">
                      {receipt.type.includes('PROMOTE') && <ArrowUp className="w-4 h-4 text-green-400" />}
                      {receipt.type.includes('VERIFY') && <Shield className="w-4 h-4 text-blue-400" />}
                      {receipt.type.includes('UPLOAD') && <Upload className="w-4 h-4 text-purple-400" />}
                      {receipt.type.includes('ARCHIVE') && <Archive className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-cyan-400">
                          {receipt.type}
                        </code>
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                          {receipt.version}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {receipt.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          L:{receipt.lamport}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Hash className="w-3 h-3" />
                          {receipt.hash}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rosetta Boot Configuration */}
        <div className="grid grid-cols-2 gap-4">
          {/* Hydrator State */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Hydrator State — vΩ.1.4 Init
              </CardTitle>
              <CardDescription>Initial CRIES parameters for boot sequence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Core Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Omega (Ω)</p>
                    <p className="text-2xl font-bold text-cyan-400 font-mono">0.67</p>
                    <p className="text-xs text-slate-500 mt-1">Initial clarity</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Sigma (σ)</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">0.10</p>
                    <p className="text-xs text-slate-500 mt-1">Initial surprise</p>
                  </div>
                </div>

                {/* Glyph & Window */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Glyph</p>
                    <div className="text-3xl mb-1">△</div>
                    <p className="text-xs text-slate-500">Stabilize mode</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">CRIES Window</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">9</p>
                    <p className="text-xs text-slate-500">Moving average</p>
                  </div>
                </div>

                {/* Guild Distribution */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-sm text-slate-300 mb-3">Guild Distribution:</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Reason', weight: 0.32 },
                      { name: 'Engineering', weight: 0.28 },
                      { name: 'Creative', weight: 0.18 },
                      { name: 'Ethics', weight: 0.12 },
                      { name: 'Ops', weight: 0.10 }
                    ].map((guild, idx) => (
                      <div key={guild.name} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24">{guild.name}</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              idx === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              idx === 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                              idx === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              idx === 3 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}
                            style={{ width: `${guild.weight * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right font-mono">
                          {(guild.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boot Status */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">Hydrator Ready</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Initial state validated. Ready for boot sequence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Band-0 Thresholds & Policies */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-yellow-400" />
                Band-0 Governance Configuration
              </CardTitle>
              <CardDescription>Safety gates and policy enforcement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Omega Threshold */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-200">Omega Threshold</span>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Critical
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-xs text-slate-400">pause_if_omega_lt:</code>
                    <span className="text-2xl font-bold text-yellow-400 font-mono">0.74</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    System will pause and request human oversight if Ω drops below this threshold
                  </p>
                  
                  {/* Visual Indicator */}
                  <div className="mt-3">
                    <div className="bg-slate-700 rounded-full h-2 relative">
                      <div className="absolute left-0 w-[74%] bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-l-full" />
                      <div className="absolute left-[74%] w-[26%] bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-r-full" />
                      <div className="absolute left-[74%] top-[-4px] w-1 h-4 bg-white rounded" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0.0</span>
                      <span className="text-yellow-400 font-bold">↑ 0.74 threshold</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>

                {/* One Question Rule */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">one_question_rule</span>
                  </div>
                  <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      "If a Band-0 gate may fail, ask exactly one clarifying question, then act"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      ✓ Enabled
                    </Badge>
                    <span className="text-xs text-slate-400">Policy active across all tracks</span>
                  </div>
                </div>

                {/* Witness Required */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-300">witness_required</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      true
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    All Band-0 critical decisions must be witnessed and logged to Q-Trace
                  </p>
                </div>

                {/* Q-Trace Configuration */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-300">qtrace_config</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Format:</span>
                      <code className="text-cyan-400 font-mono">Q-NEW-{'{'}NNNN{'}'}</code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Auto-increment:</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Example:</span>
                      <code className="text-purple-400 font-mono">Q-NEW-0001</code>
                    </div>
                  </div>
                </div>

                {/* Configuration Summary */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">All Gates Configured</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Band-0 safety policies active. Ω threshold at 0.74, witness logging enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Version History Table */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-pink-400" />
              Version History
            </CardTitle>
            <CardDescription>All Rosetta Monolith versions and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Version</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Band</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Hash</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Uploaded</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Activated</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Δ-Summary</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => {
                    const statusDisplay = getStatusDisplay(version.status);
                    return (
                      <tr key={version.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3">
                          <span className="text-sm font-mono font-bold text-purple-400">
                            {version.version}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                            {version.band}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <code className="text-xs text-pink-400 font-mono">
                            {version.hash.substring(0, 20)}...
                          </code>
                        </td>
                        <td className="py-3">
                          <Badge className={`${statusDisplay.bg} ${statusDisplay.color} border-0 text-xs flex items-center gap-1 w-fit`}>
                            {statusDisplay.icon}
                            {version.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-slate-400">
                          {version.createdAt.toLocaleDateString()}
                        </td>
                        <td className="py-3 text-xs text-slate-400">
                          {version.activatedAt?.toLocaleDateString() || '-'}
                        </td>
                        <td className="py-3 text-xs text-slate-300 max-w-[200px] truncate">
                          {version.deltaSummary}
                        </td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowMetadataModal(true);
                            }}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Modal (Simple Alert for now) */}
        {showMetadataModal && selectedVersion && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowMetadataModal(false)}>
            <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full m-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Rosetta Metadata - {selectedVersion.version}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Version</p>
                    <p className="text-sm text-slate-200 font-mono">{selectedVersion.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Band Level</p>
                    <p className="text-sm text-slate-200">{selectedVersion.band}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">SHA-256 Hash</p>
                    <code className="text-xs text-pink-400 font-mono break-all bg-slate-800 p-2 rounded block">
                      {selectedVersion.hash}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Uploaded By</p>
                    <p className="text-sm text-slate-200">{selectedVersion.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <p className="text-sm text-slate-200">{selectedVersion.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Created</p>
                    <p className="text-sm text-slate-200">{selectedVersion.createdAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Activated</p>
                    <p className="text-sm text-slate-200">{selectedVersion.activatedAt?.toLocaleString() || 'Not activated'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Δ-Summary</p>
                    <p className="text-sm text-slate-200">{selectedVersion.deltaSummary}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowMetadataModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Cryptographic verification enabled
                </span>
                <span>•</span>
                <span>Lamport chain integrity: ✅ Verified</span>
                <span>•</span>
                <span>Auto-archival on promotion</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>Rosetta OS Manager v1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
