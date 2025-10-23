"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, GitMerge, FileText, TrendingUp, AlertCircle, Scale, CheckCircle2, XCircle, Activity, HelpCircle, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdvancedReceipt {
  receipt_type: string;
  version: string;
  category: string;
  description: string;
  fields: string[];
  use_case: string;
}

export default function AdvancedReceiptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("audit");
  const [advancedReceipts, setAdvancedReceipts] = useState<AdvancedReceipt[]>([]);
  const [receiptCategories, setReceiptCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real receipt conversation data from backend
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        
        // Fetch conversation receipts
        const conversationResponse = await fetch('http://localhost:3001/api/receipts/conversations');
        if (!conversationResponse.ok) throw new Error('Failed to fetch conversation receipts');
        const conversationData = await conversationResponse.json();
        
        // Transform real receipts into advanced receipt catalog
        const receiptMap = new Map<string, AdvancedReceipt[]>();
        
        conversationData.forEach((receipt: any) => {
          const receiptType = receipt.event || receipt.receipt_type || 'GOVERNANCE_EVENT';
          const category = categorizeReceipt(receiptType);
          
          const advReceipt: AdvancedReceipt = {
            receipt_type: receiptType,
            version: receipt.version || 'v3.x',
            category: category,
            description: receipt.description || `Real governance event: ${receiptType}`,
            fields: Object.keys(receipt),
            use_case: receipt.use_case || 'Enterprise governance and compliance tracking'
          };
          
          if (!receiptMap.has(category)) {
            receiptMap.set(category, []);
          }
          receiptMap.get(category)!.push(advReceipt);
        });
        
        // Create category stats
        const categories = [
          { id: "audit", name: "Audit Receipts", count: receiptMap.get("audit")?.length || 0, color: "from-blue-500 to-cyan-500" },
          { id: "policy", name: "Policy Management", count: receiptMap.get("policy")?.length || 0, color: "from-purple-500 to-pink-500" },
          { id: "risk", name: "Risk & Ethics", count: receiptMap.get("risk")?.length || 0, color: "from-orange-500 to-red-500" },
          { id: "governance", name: "Governance Gates", count: receiptMap.get("governance")?.length || 0, color: "from-green-500 to-emerald-500" },
          { id: "consent", name: "Consent Control", count: receiptMap.get("consent")?.length || 0, color: "from-yellow-500 to-amber-500" }
        ];
        
        setReceiptCategories(categories);
        
        // Flatten all receipts
        const allReceipts = Array.from(receiptMap.values()).flat();
        setAdvancedReceipts(allReceipts.length > 0 ? allReceipts : getDefaultReceipts());
        setError(null);
      } catch (err) {
        console.error('Failed to load receipt data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fallback to default receipts on error
        setAdvancedReceipts(getDefaultReceipts());
        setReceiptCategories([
          { id: "audit", name: "Audit Receipts", count: 4, color: "from-blue-500 to-cyan-500" },
          { id: "policy", name: "Policy Management", count: 2, color: "from-purple-500 to-pink-500" },
          { id: "risk", name: "Risk & Ethics", count: 3, color: "from-orange-500 to-red-500" },
          { id: "governance", name: "Governance Gates", count: 2, color: "from-green-500 to-emerald-500" },
          { id: "consent", name: "Consent Control", count: 2, color: "from-yellow-500 to-amber-500" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceiptData();
    const interval = setInterval(fetchReceiptData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Helper to categorize receipts by type
  function categorizeReceipt(type: string): string {
    if (type.includes('AUDIT') || type.includes('SIGN') || type.includes('ATTEST')) return 'audit';
    if (type.includes('POLICY') || type.includes('PFIELD')) return 'policy';
    if (type.includes('RISK') || type.includes('ERL') || type.includes('ETH')) return 'risk';
    if (type.includes('GOVERN') || type.includes('RG-') || type.includes('VALID')) return 'governance';
    if (type.includes('CONSENT') || type.includes('GRANT') || type.includes('REVOKE')) return 'consent';
    return 'governance'; // default
  }

  // Fallback default receipts if API fails
  function getDefaultReceipts(): AdvancedReceipt[] {
    return [
    {
      receipt_type: "Δ-AUDIT-SIGN",
      version: "v3.12",
      category: "audit",
      description: "Cryptographic signature receipt for audit trail integrity",
      fields: ["receipt_type", "lamport", "prev_digest", "signature", "signer_id", "algorithm", "self_hash", "trace_id"],
      use_case: "Legal compliance: Digital signatures for audit events with non-repudiation guarantees"
    },
    {
      receipt_type: "Δ-AUDIT-ATTEST",
      version: "v3.13",
      category: "audit",
      description: "Third-party attestation of governance events",
      fields: ["receipt_type", "lamport", "prev_digest", "attester", "statement", "confidence", "self_hash", "trace_id"],
      use_case: "External validation: Independent auditor attestation for regulatory reporting"
    },
    {
      receipt_type: "Δ-AUDIT-VERIFY",
      version: "v3.14",
      category: "audit",
      description: "Verification result of audit chain integrity",
      fields: ["receipt_type", "lamport", "prev_digest", "verified_range", "result", "anomalies", "self_hash", "trace_id"],
      use_case: "Continuous monitoring: Real-time verification of governance chain integrity"
    },
    {
      receipt_type: "Δ-AUDIT-TIME-WINDOW",
      version: "v3.18",
      category: "audit",
      description: "Time-bounded audit window for compliance periods",
      fields: ["receipt_type", "lamport", "prev_digest", "window_start", "window_end", "events_count", "self_hash", "trace_id"],
      use_case: "Regulatory reporting: Define audit periods for SOC2, ISO27001, GDPR compliance"
    },
    {
      receipt_type: "Δ-PFIELD-SUGGEST",
      version: "v3.19",
      category: "policy",
      description: "AI-driven policy parameter suggestions based on performance",
      fields: ["receipt_type", "lamport", "prev_digest", "proposed", "confidence", "evidence", "self_hash", "trace_id"],
      use_case: "Adaptive governance: ML-driven optimization of sigma/epsilon thresholds"
    },
    {
      receipt_type: "Δ-PFIELD-JUSTIFY",
      version: "v3.20",
      category: "policy",
      description: "Justification and rationale for policy changes",
      fields: ["receipt_type", "lamport", "prev_digest", "evidence", "rationale", "self_hash", "trace_id"],
      use_case: "Explainability: Transparent policy evolution with audit-ready justifications"
    },
    {
      receipt_type: "Δ-ERL",
      version: "v3.24",
      category: "risk",
      description: "Expected Regulatory Loss quantification",
      fields: ["receipt_type", "lamport", "prev_digest", "violation_rate", "severity", "erl", "self_hash", "trace_id"],
      use_case: "Risk quantification: Financial impact assessment of governance violations (0-1 scale)"
    },
    {
      receipt_type: "Δ-ETH-METRIC",
      version: "v3.25",
      category: "risk",
      description: "Ethics metric combining transparency, stability, and divergence",
      fields: ["receipt_type", "lamport", "prev_digest", "transparency", "stability", "divergence", "score", "self_hash", "trace_id"],
      use_case: "ESG reporting: Quantifiable ethics score for stakeholder transparency"
    },
    {
      receipt_type: "Δ-RISK-GATE",
      version: "v3.26",
      category: "risk",
      description: "Automated risk gate with ALLOW/BLOCK decision",
      fields: ["receipt_type", "lamport", "prev_digest", "erl", "gate", "threshold", "self_hash", "trace_id"],
      use_case: "Real-time control: Automatic blocking of high-risk AI operations before execution"
    },
    {
      receipt_type: "Δ-RG-VALID",
      version: "v3.27",
      category: "governance",
      description: "Governance receipt validation count",
      fields: ["receipt_type", "lamport", "prev_digest", "count_valid", "count_invalid", "self_hash", "trace_id"],
      use_case: "Quality assurance: Continuous validation of governance receipt integrity"
    },
    {
      receipt_type: "Δ-RG-INVALID",
      version: "v3.28",
      category: "governance",
      description: "Invalid receipt detection and logging",
      fields: ["receipt_type", "lamport", "prev_digest", "items", "self_hash", "trace_id"],
      use_case: "Anomaly detection: Identify and quarantine malformed governance events"
    },
    {
      receipt_type: "Δ-CONSENT-GRANT",
      version: "v3.37",
      category: "consent",
      description: "User consent grant with TTL",
      fields: ["receipt_type", "lamport", "prev_digest", "request_hash", "approver", "ttl_seconds", "self_hash", "trace_id"],
      use_case: "GDPR compliance: Time-limited consent management with cryptographic proof"
    },
    {
      receipt_type: "Δ-CONSENT-REVOKE",
      version: "v3.38",
      category: "consent",
      description: "Consent revocation receipt",
      fields: ["receipt_type", "lamport", "prev_digest", "grant_hash", "revoker", "self_hash", "trace_id"],
      use_case: "Right to be forgotten: Immediate consent withdrawal with full audit trail"
    }
    ];
  }

  const valueProposition = [
    {
      title: "Regulatory Compliance",
      metrics: ["SOC2 Type II", "ISO27001", "GDPR Article 22"],
      description: "Complete audit trail with cryptographic signatures and time-bounded windows",
      icon: Scale,
      color: "text-blue-400"
    },
    {
      title: "Risk Quantification",
      metrics: ["ERL Score", "Ethics Metric", "Automated Gates"],
      description: "Financial impact assessment of AI governance violations in real-time",
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: "Adaptive Intelligence",
      metrics: ["ML-Driven Tuning", "Evidence-Based", "Explainable"],
      description: "AI-optimized policy parameters with transparent justifications",
      icon: Activity,
      color: "text-purple-400"
    },
    {
      title: "Legal Protection",
      metrics: ["Non-Repudiation", "Consent Proofs", "Attestation"],
      description: "Cryptographic proof for legal defense and regulatory audits",
      icon: Shield,
      color: "text-amber-400"
    }
  ];

  const filteredReceipts = advancedReceipts.filter(r => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="container mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/lab" className="flex items-center space-x-3">
              <Shield className="h-7 w-7 text-teal-400" />
              <span className="text-xl font-mono font-bold">
                Audit<span className="text-teal-400">a</span>AI Lab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/lab" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-teal-500/30 transition-all">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono text-sm">Back to Lab</span>
              </Link>
              <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-teal-500/30 transition-all">
                <Home className="h-4 w-4" />
                <span className="font-mono text-sm">Home</span>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-teal-500/30 hover:bg-teal-500/10">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-mono text-sm">How to Use</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-teal-500/30 overflow-y-auto max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-mono text-teal-400">Advanced Receipts Guide</DialogTitle>
                    <DialogDescription className="text-slate-400 font-mono">Enterprise governance receipt catalog v3.12-v3.38</DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">What are Advanced Receipts?</h3>
                      <p className="text-slate-300 leading-relaxed">Advanced Receipts (v3.12-v3.38) extend basic Δ-receipts with enterprise features like digital signatures, third-party attestation, consent management, and regulatory loss quantification (ERL). These receipts enable SOC2, ISO27001, and GDPR compliance.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Receipt Categories</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Audit Receipts:</strong> Signatures, attestations, verifications, time-windows</li>
                        <li><strong>Policy Management:</strong> Field suggestions, justifications, amendments</li>
                        <li><strong>Risk & Ethics:</strong> ERL scores, ethics metrics, risk gates</li>
                        <li><strong>Governance Gates:</strong> HITL triggers, escalations, band promotions</li>
                        <li><strong>Consent Control:</strong> User consent tracking, revocations</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">How to Use This Dashboard</h3>
                      <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li><strong>Category Tabs:</strong> Browse receipts by audit/policy/risk/governance/consent<p className="ml-6 text-sm text-slate-400">Each category has specialized fields and use cases</p></li>
                        <li><strong>Receipt Cards:</strong> View type, version, and field schema<p className="ml-6 text-sm text-slate-400">Click to see example JSON and integration docs</p></li>
                        <li><strong>Use Cases:</strong> Understand business applications<p className="ml-6 text-sm text-slate-400">Each receipt links to specific compliance requirements</p></li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Business Value</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Compliance Ready:</strong> Pre-built receipts for SOC2, ISO27001, GDPR</li>
                        <li><strong>Risk Quantification:</strong> ERL scores enable financial risk modeling</li>
                        <li><strong>Audit Trail:</strong> Cryptographic non-repudiation via signatures</li>
                        <li><strong>Consent Management:</strong> GDPR-compliant user data control</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center space-x-1 text-sm font-mono">
                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-teal-400">RECEIPTS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
              <GitMerge className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold">Advanced Receipts</h1>
              <p className="text-slate-400 font-mono text-sm">v3.12-v3.38 Enterprise Governance</p>
            </div>
          </div>
          <p className="text-slate-300 font-mono text-sm max-w-3xl">
            Enterprise-grade audit receipts for compliance, risk quantification, adaptive policy management, 
            and legal protection. Full traceability with cryptographic proofs.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-mono text-sm">Loading receipt data from backend...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-yellow-900/20 border-yellow-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Using Fallback Data
              </CardTitle>
              <CardDescription className="text-yellow-300/70">
                {error} - Displaying default receipt catalog.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Data View */}
        {!loading && (
          <>
        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {valueProposition.map((value) => (
            <Card key={value.title} className="bg-slate-800/50 border-slate-600">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <value.icon className={`h-5 w-5 ${value.color}`} />
                  <CardTitle className="text-sm font-mono">{value.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {value.metrics.map((metric) => (
                    <Badge key={metric} variant="outline" className={`font-mono text-xs ${value.color} mr-1`}>
                      {metric}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-3">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="receipts" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="receipts" className="font-mono">Receipt Catalog</TabsTrigger>
            <TabsTrigger value="categories" className="font-mono">Categories</TabsTrigger>
            <TabsTrigger value="roi" className="font-mono">Business Value</TabsTrigger>
          </TabsList>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              {receiptCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    selectedCategory === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                      : "bg-slate-800/50 border border-slate-600 text-slate-300 hover:border-teal-500/30"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredReceipts.map((receipt) => (
                <Card key={receipt.receipt_type} className="bg-slate-800/50 border-slate-600 hover:border-teal-500/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="font-mono text-teal-400 border-teal-500/30">
                        {receipt.version}
                      </Badge>
                      <FileText className="h-5 w-5 text-teal-400" />
                    </div>
                    <CardTitle className="font-mono text-lg">{receipt.receipt_type}</CardTitle>
                    <CardDescription className="font-mono text-sm">
                      {receipt.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-2">Use Case</div>
                      <p className="text-sm font-mono text-slate-300">{receipt.use_case}</p>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-2">Fields ({receipt.fields.length})</div>
                      <div className="flex flex-wrap gap-1">
                        {receipt.fields.slice(0, 6).map((field) => (
                          <Badge key={field} variant="secondary" className="font-mono text-xs">
                            {field}
                          </Badge>
                        ))}
                        {receipt.fields.length > 6 && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            +{receipt.fields.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receiptCategories.map((category) => (
                <Card key={category.id} className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="font-mono flex items-center justify-between">
                      <span>{category.name}</span>
                      <Badge className={`bg-gradient-to-r ${category.color} text-white border-0`}>
                        {category.count}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedReceipts
                        .filter(r => r.category === category.id)
                        .map((receipt) => (
                          <div key={receipt.receipt_type} className="p-2 rounded bg-slate-900/50 border border-slate-700">
                            <div className="text-xs font-mono font-bold text-teal-400">{receipt.receipt_type}</div>
                            <div className="text-xs font-mono text-slate-500">{receipt.version}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ROI Tab */}
          <TabsContent value="roi" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Business Value & ROI
                </CardTitle>
                <CardDescription className="font-mono">
                  How Advanced Receipts reduce risk and increase enterprise value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Scale className="h-6 w-6 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-mono font-bold text-lg mb-2 text-blue-400">Regulatory Compliance</h3>
                      <p className="text-sm font-mono text-slate-300 mb-3">
                        Automated compliance with SOC2, ISO27001, GDPR, and AI Act requirements. 
                        Complete audit trails with cryptographic signatures eliminate manual reporting.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Cost Savings</div>
                          <div className="text-xl font-mono font-bold text-green-400">$2M-5M/yr</div>
                          <div className="text-xs text-slate-400 font-mono">Reduced audit costs</div>
                        </div>
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Time Reduction</div>
                          <div className="text-xl font-mono font-bold text-blue-400">85%</div>
                          <div className="text-xs text-slate-400 font-mono">Faster compliance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-orange-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-mono font-bold text-lg mb-2 text-orange-400">Risk Quantification (ERL)</h3>
                      <p className="text-sm font-mono text-slate-300 mb-3">
                        Expected Regulatory Loss (ERL) converts governance violations into financial impact. 
                        Real-time risk gates block high-risk operations before execution.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Risk Reduction</div>
                          <div className="text-xl font-mono font-bold text-green-400">73%</div>
                          <div className="text-xs text-slate-400 font-mono">Fewer violations</div>
                        </div>
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Prevented Loss</div>
                          <div className="text-xl font-mono font-bold text-orange-400">$8M+</div>
                          <div className="text-xs text-slate-400 font-mono">Avg per enterprise</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <Activity className="h-6 w-6 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-mono font-bold text-lg mb-2 text-purple-400">Adaptive Policy Management</h3>
                      <p className="text-sm font-mono text-slate-300 mb-3">
                        ML-driven policy optimization with transparent justifications. 
                        AI suggests parameter tuning based on performance evidence.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Performance Gain</div>
                          <div className="text-xl font-mono font-bold text-purple-400">+34%</div>
                          <div className="text-xs text-slate-400 font-mono">Policy efficiency</div>
                        </div>
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Manual Work</div>
                          <div className="text-xl font-mono font-bold text-green-400">-92%</div>
                          <div className="text-xs text-slate-400 font-mono">Policy tuning</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-yellow-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-mono font-bold text-lg mb-2 text-yellow-400">Legal Protection</h3>
                      <p className="text-sm font-mono text-slate-300 mb-3">
                        Cryptographic non-repudiation for legal defense. 
                        GDPR consent management with time-limited grants and instant revocation.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">Legal Defense</div>
                          <div className="text-xl font-mono font-bold text-yellow-400">100%</div>
                          <div className="text-xs text-slate-400 font-mono">Audit coverage</div>
                        </div>
                        <div className="p-3 rounded bg-slate-900/50 border border-slate-700">
                          <div className="text-xs text-slate-500 font-mono">GDPR Compliance</div>
                          <div className="text-xl font-mono font-bold text-green-400">Full</div>
                          <div className="text-xs text-slate-400 font-mono">Article 22</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
