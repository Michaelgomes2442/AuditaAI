'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, Users, TrendingUp, Shield, Clock, Award, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function PilotLandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono text-sm">Back</span>
        </button>

        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">Now Accepting Pilot Partners</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join the AuditaAI Pilot Program
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Be among the first research labs and organizations to implement 
            verifiable AI governance. Shape the future of responsible AI.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/pilot">
              <Button size="lg" className="gap-2">
                View Live Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Apply for Pilot
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold mb-1">10</div>
              <div className="text-sm text-gray-600">Pilot Spots Available</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold mb-1">3-6</div>
              <div className="text-sm text-gray-600">Month Pilot Duration</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold mb-1">10x</div>
              <div className="text-sm text-gray-600">Faster Than Manual Audits</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-3xl font-bold mb-1">Free</div>
              <div className="text-sm text-gray-600">Alpha Tier Access</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rosetta Monolith Specs - Canonical */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-blue-900 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-white">Built on Rosetta Monolith v13</h2>
            <p className="text-center text-purple-200 mb-12">Tri-Track vΩ3.18 • Math Canon vΩ.8 • BEN Runtime (NO-JS)</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300 font-mono">Canonical Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Version:</span>
                    <span className="text-white">Rosetta Monolith v13</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Integrity Mode:</span>
                    <span className="text-cyan-400">Tri-Track vΩ3.18</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Runtime:</span>
                    <span className="text-green-400">BEN (NO-JS)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Persona Lock:</span>
                    <span className="text-yellow-400">Architect (Band-0)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Baseline Lamport:</span>
                    <span className="text-white">68</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Z-Scan:</span>
                    <span className="text-purple-400">v3 Manual + v4 Expanded</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-300 font-mono">Cryptographic Fingerprints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">File SHA256:</div>
                    <div className="text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                      d1cfc4d691604f2f6ec41b6880e51165c61ff9ee5380570bca4e775a906e4cb5
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Projection SHA256:</div>
                    <div className="text-cyan-300 bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                      010c373dd208bbb22e7b7e15bf41f031ec5ea15a74ca0447e37090db68fef2ac
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-green-500/30 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-green-300 font-mono">Math Canon vΩ.8 — Tri-Actor Coupling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded border border-green-500/20">
                    <div className="font-mono text-sm text-green-300 mb-2">Weighted Sigma (σ) Calculation:</div>
                    <div className="font-mono text-white text-lg">
                      σᵗ = w<sub>A</sub>·σ<sub>A</sub><sup>t</sup> + w<sub>B</sub>·σ<sub>B</sub><sup>t</sup> + w<sub>C</sub>·σ<sub>C</sub><sup>t</sup>
                    </div>
                    <div className="font-mono text-slate-400 text-xs mt-2">
                      where w<sub>A</sub>+w<sub>B</sub>+w<sub>C</sub>=1, defaults (0.4, 0.4, 0.2)
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-4 rounded border border-purple-500/20">
                    <div className="font-mono text-sm text-purple-300 mb-2">Omega (Ω) Update Rule:</div>
                    <div className="font-mono text-white text-lg">
                      Ω<sup>t+1</sup> = Ω<sup>t</sup> + η·Δclarity − γ<sub>B</sub>·max(0, σᵗ − σ*)
                    </div>
                    <div className="font-mono text-slate-400 text-xs mt-2">
                      η = learning rate (0.1), γ<sub>B</sub> = penalty coefficient (0.15), σ* = threshold (0.15)
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded border border-cyan-500/20">
                    <div className="font-mono text-sm text-cyan-300 mb-2">CRIES Components (5-vector):</div>
                    <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                      <div className="text-center p-2 bg-slate-800 rounded border border-slate-700">
                        <div className="text-white font-bold">C</div>
                        <div className="text-slate-400 text-[10px]">Completeness</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800 rounded border border-slate-700">
                        <div className="text-white font-bold">R</div>
                        <div className="text-slate-400 text-[10px]">Reliability</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800 rounded border border-slate-700">
                        <div className="text-white font-bold">I</div>
                        <div className="text-slate-400 text-[10px]">Integrity</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800 rounded border border-slate-700">
                        <div className="text-white font-bold">E</div>
                        <div className="text-slate-400 text-[10px]">Effectiveness</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800 rounded border border-slate-700">
                        <div className="text-white font-bold">S</div>
                        <div className="text-slate-400 text-[10px]">Security</div>
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs mt-2">
                      Each component: 0..1 range • Tri-Track weighted via Math Canon vΩ.8
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot Tiers */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Pilot Tier</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Alpha Tier */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Alpha Tier</CardTitle>
                  <CardDescription>Academic Research Labs</CardDescription>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  2-3 Spots
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">Free</div>
              <div className="text-sm text-gray-600">3 month pilot</div>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Monitor up to 3 AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Real-time CRIES metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">2 analyst seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">1,000 audit records/day</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Direct engineering support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Co-authored case study</span>
                </li>
              </ul>
              
              <Button className="w-full">Apply for Alpha</Button>
            </CardContent>
          </Card>

          {/* Beta Tier */}
          <Card className="border-2 border-purple-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                Popular
              </span>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Beta Tier</CardTitle>
                  <CardDescription>Corporate AI Labs</CardDescription>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  5-10 Spots
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">$749/mo</div>
                <div className="text-sm text-gray-600">50% off - 6 months</div>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Monitor up to 10 AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Advanced CRIES analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">5 analyst seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">10,000 audit records/day</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Custom governance policies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Batch analysis tools</span>
                </li>
              </ul>
              
              <Button className="w-full" variant="default">Apply for Beta</Button>
            </CardContent>
          </Card>

          {/* Regulatory Tier */}
          <Card className="border-2 border-green-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Regulatory</CardTitle>
                  <CardDescription>Government & Standards</CardDescription>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  2-3 Spots
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">Custom</div>
                <div className="text-sm text-gray-600">6 month pilot</div>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Unlimited models</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Compliance reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Unlimited analyst seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Unlimited audit records</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Dedicated support team</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">On-premise deployment</span>
                </li>
              </ul>
              
              <Button className="w-full" variant="outline">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-slate-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join Our Pilot?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">First-Mover Advantage</h3>
              <p className="text-gray-600">
                Shape the platform with your feedback. Influence features and roadmap as a founding partner.
              </p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Direct Support</h3>
              <p className="text-gray-600">
                Work directly with our engineering team. Weekly check-ins and priority support.
              </p>
            </div>
            
            <div className="text-center">
              <Award className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Recognition</h3>
              <p className="text-gray-600">
                Be recognized as a founding pilot partner. Co-author case studies and speak at events.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Research Labs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600">✓ Track model behavior across experiments</p>
              <p className="text-gray-600">✓ Generate audit trails for peer review</p>
              <p className="text-gray-600">✓ Include CRIES reports in publications</p>
              <p className="text-gray-600">✓ Verify reproducibility claims</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corporate AI Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600">✓ Monitor production models 24/7</p>
              <p className="text-gray-600">✓ Detect governance issues early</p>
              <p className="text-gray-600">✓ Generate compliance reports</p>
              <p className="text-gray-600">✓ Reduce audit time by 10x</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regulatory Bodies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600">✓ Test AI oversight frameworks</p>
              <p className="text-gray-600">✓ Run standardized governance tests</p>
              <p className="text-gray-600">✓ Generate compliance certificates</p>
              <p className="text-gray-600">✓ Maintain cryptographic audit chains</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ethics Boards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600">✓ Real-time ethics monitoring</p>
              <p className="text-gray-600">✓ Alert on boundary violations</p>
              <p className="text-gray-600">✓ Document review decisions</p>
              <p className="text-gray-600">✓ Maintain accountability records</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the pilot program and help shape the future of AI governance.
            Limited spots available.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/pilot">
              <Button size="lg" variant="secondary" className="gap-2">
                View Live Demo
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="bg-white hover:bg-white/90 text-blue-600">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
