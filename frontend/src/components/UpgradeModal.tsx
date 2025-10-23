'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
}

export default function UpgradeModal({ isOpen, onClose, currentTier = 'FREE' }: UpgradeModalProps) {
  const tiers = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      description: 'Perfect for exploring AuditaAI',
      features: [
        { name: 'Preselected demo prompts', included: true },
        { name: 'View sample CRIES scores', included: true },
        { name: 'Basic audit reports', included: true },
        { name: 'Live model testing', included: false },
        { name: 'Business integrations', included: false },
        { name: 'Custom prompts', included: false },
        { name: 'Priority support', included: false },
      ],
      cta: 'Current Plan',
      isCurrent: currentTier === 'FREE',
      upgradeUrl: null,
    },
    {
      name: 'PRO',
      price: '$499',
      period: 'per month',
      description: 'Full power for serious AI governance',
      features: [
        { name: 'Everything in FREE', included: true },
        { name: 'Live model testing', included: true },
        { name: 'Business integrations', included: true },
        { name: 'Custom prompts', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'API access', included: true },
        { name: 'Email support', included: true },
      ],
      cta: 'Upgrade to PRO',
      isCurrent: currentTier === 'PRO' || currentTier === 'PAID',
      upgradeUrl: '/billing?tier=pro',
      highlighted: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      period: 'contact us',
      description: 'For organizations at scale',
      features: [
        { name: 'Everything in PRO', included: true },
        { name: 'Dedicated infrastructure', included: true },
        { name: 'Custom SLAs', included: true },
        { name: 'On-premise deployment', included: true },
        { name: 'White-label options', included: true },
        { name: 'Dedicated support team', included: true },
        { name: 'Custom contracts', included: true },
      ],
      cta: 'Contact Sales',
      isCurrent: currentTier === 'ENTERPRISE' || currentTier === 'ARCHITECT',
      upgradeUrl: '/contact?subject=enterprise',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-lg">
            Choose the plan that fits your AI governance needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-6 border transition-all ${
                tier.highlighted
                  ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/20 scale-105'
                  : tier.isCurrent
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wide">
                  ⭐ Most Popular
                </div>
              )}
              {tier.isCurrent && (
                <div className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">
                  ✓ Current Plan
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-slate-400 ml-2">/ {tier.period}</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {tier.isCurrent ? (
                <Button disabled className="w-full bg-green-500/20 text-green-400 cursor-not-allowed">
                  Current Plan
                </Button>
              ) : tier.upgradeUrl ? (
                <Link href={tier.upgradeUrl as any} onClick={onClose}>
                  <Button
                    className={`w-full ${
                      tier.highlighted
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full bg-slate-700 text-slate-500 cursor-not-allowed">
                  {tier.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="font-semibold text-white mb-2">💡 Need help choosing?</h4>
          <p className="text-sm text-slate-400">
            Not sure which plan is right for you?{' '}
            <Link href="/contact" className="text-cyan-400 hover:underline" onClick={onClose}>
              Contact our team
            </Link>{' '}
            for a personalized recommendation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
