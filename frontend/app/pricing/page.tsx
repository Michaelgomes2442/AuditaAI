'use client';

import Link from 'next/link';
import { Check, Crown, Zap, Shield, Rocket } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      features: [
        'Access to demo interface',
        '6 predefined prompt examples',
        'View Rosetta vs Standard comparison',
        'See CRIES scoring in action',
        'Read-only access',
        'Community support'
      ],
      limitations: [
        'No custom prompts',
        'No model uploads',
        'No API access',
        'No data exports'
      ],
      cta: 'Current Plan',
      href: '/demo'
    },
    {
      name: 'PAID',
      price: '$99',
      period: 'per month',
      icon: Crown,
      color: 'from-cyan-500 to-blue-500',
      popular: true,
      features: [
        'Everything in FREE, plus:',
        'Unlimited custom prompts',
        'Upload your own models',
        'Full API access',
        'Export audit logs & receipts',
        'Lamport chain verification',
        'Advanced CRIES analytics',
        'Priority support',
        'Team collaboration (5 users)',
        'Custom integrations'
      ],
      limitations: [],
      cta: 'Upgrade Now',
      href: '/contact'
    },
    {
      name: 'ARCHITECT',
      price: 'Custom',
      period: 'enterprise',
      icon: Rocket,
      color: 'from-purple-500 to-pink-500',
      features: [
        'Everything in PAID, plus:',
        'System configuration access',
        'Custom Rosetta specifications',
        'Dedicated infrastructure',
        'SLA guarantees',
        'Advanced security controls',
        'Compliance reporting',
        'White-label options',
        'Unlimited team members',
        'Dedicated account manager',
        '24/7 premium support'
      ],
      limitations: [],
      cta: 'Contact Sales',
      href: '/contact'
    }
  ];

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

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
          <div className="container mx-auto px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Shield className="h-7 w-7 text-cyan-400" />
                <span className="text-xl font-mono font-bold">
                  Audit<span className="text-cyan-400">a</span>AI
                </span>
              </Link>
              <div className="flex items-center space-x-2">
                <Link href="/signin">
                  <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors text-sm font-mono">
                    SIGN IN
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors text-sm font-mono font-bold">
                    SIGN UP FREE
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-8 py-16 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-slate-300 font-mono">
              Start free, upgrade when you're ready
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative p-8 rounded-lg border ${
                    plan.popular
                      ? 'border-cyan-500 bg-cyan-500/5'
                      : 'border-white/10 bg-white/5'
                  } backdrop-blur-sm`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-mono font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${plan.color} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-mono font-bold mb-2">{plan.name}</h2>
                    <div className="flex items-baseline mb-1">
                      <span className="text-4xl font-mono font-bold">{plan.price}</span>
                      {plan.price !== 'Custom' && (
                        <span className="text-slate-400 ml-2 font-mono text-sm">/{plan.period}</span>
                      )}
                    </div>
                    {plan.price === 'Custom' && (
                      <p className="text-slate-400 text-sm font-mono">{plan.period}</p>
                    )}
                  </div>

                  <div className="mb-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="mb-6 pt-6 border-t border-white/10">
                      <p className="text-xs text-slate-500 font-mono mb-2">NOT INCLUDED:</p>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start space-x-3 mb-2">
                          <span className="text-slate-600">✕</span>
                          <span className="text-xs text-slate-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link href={plan.href as any}>
                    <button
                      className={`w-full py-3 rounded-lg font-mono font-bold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                          : 'border border-white/10 hover:border-cyan-500/50'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 pt-16 border-t border-white/10">
            <h2 className="text-3xl font-mono font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">
                  Can I try before I buy?
                </h3>
                <p className="text-slate-300 text-sm">
                  Absolutely! Sign up for a free account and test drive our demo interface with predefined prompts. No credit card required.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">
                  What's included in the free tier?
                </h3>
                <p className="text-slate-300 text-sm">
                  Full access to our demo interface with 6 curated prompts showing Rosetta vs Standard model comparisons. Perfect for understanding the value of governance.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">
                  Can I upgrade anytime?
                </h3>
                <p className="text-slate-300 text-sm">
                  Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-slate-300 text-sm">
                  We accept all major credit cards, ACH transfers, and can provide invoicing for enterprise customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
