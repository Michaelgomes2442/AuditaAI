'use client';

import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UpgradeBannerProps {
  userTier?: string;
  showUpgradeModal?: () => void;
}

export default function UpgradeBanner({ userTier, showUpgradeModal }: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const isFreeUser = !userTier || userTier === 'FREE';

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('upgrade-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('upgrade-banner-dismissed', 'true');
  };

  // Only show for FREE users who haven't dismissed
  if (!isFreeUser || isDismissed) {
    return null;
  }

  return (
    <div 
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 to-orange-600 border-b border-amber-500/30 shadow-lg"
      data-tour="upgrade-banner"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Zap className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white text-sm md:text-base font-medium">
              🎯 You're on the <strong>FREE</strong> plan. Upgrade to unlock{' '}
              <span className="font-bold">live testing</span> and{' '}
              <span className="font-bold">business integrations</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showUpgradeModal ? (
              <Button
                onClick={showUpgradeModal}
                size="sm"
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-md"
              >
                Upgrade Now
              </Button>
            ) : (
              <Link href={"/billing" as any}>
                <Button
                  size="sm"
                  className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-md"
                >
                  Upgrade Now
                </Button>
              </Link>
            )}
            
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
