'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { X, ChevronRight, ChevronLeft, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Custom Tooltip Component for Tour
 */
function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  isLastStep,
  size
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl max-w-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-400">
            Step {index + 1} of {size}
          </span>
        </div>
        <button
          {...skipProps}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {step.title && (
          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
        )}
        <div className="text-gray-300 leading-relaxed">{step.content}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/50">
        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index
                  ? 'bg-blue-500 w-6'
                  : i < index
                  ? 'bg-blue-400/50'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          {index > 0 && (
            <Button
              {...backProps}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {continuous && (
            <Button
              {...primaryProps}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLastStep ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface OnboardingTourProps {
  /** Which page the tour is running on */
  page?: 'pilot' | 'lab' | 'receipts' | 'pricing';
  /** Force show tour even if completed */
  forceShow?: boolean;
}

export default function OnboardingTour({ page = 'pilot', forceShow = false }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if user has completed the tour
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('tourCompleted');
      if (!tourCompleted || forceShow) {
        // Delay tour start to ensure DOM is ready
        setTimeout(() => setRunTour(true), 1000);
      }
    }
  }, [forceShow]);

  // Define tour steps based on page
  const getTourSteps = (): Step[] => {
    const commonSteps: Record<string, Step[]> = {
      pilot: [
        {
          target: '[data-tour="upload-model"]',
          content: (
            <>
              <p className="mb-3">
                Start by uploading your AI model configuration or selecting from our pre-configured models.
              </p>
              <p className="text-sm text-gray-400">
                We support OpenAI, Anthropic, Ollama, and custom endpoints.
              </p>
            </>
          ),
          title: '🚀 Upload Your Model',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="cries-scores"]',
          content: (
            <>
              <p className="mb-3">
                <strong>CRIES scores</strong> measure your AI model across 5 critical dimensions:
              </p>
              <ul className="space-y-1 text-sm">
                <li>• <strong>C</strong>ompleteness - Coverage & depth</li>
                <li>• <strong>R</strong>eliability - Consistency & errors</li>
                <li>• <strong>I</strong>ntegrity - Bias & alignment</li>
                <li>• <strong>E</strong>ffectiveness - Task completion</li>
                <li>• <strong>S</strong>ecurity - Adversarial resistance</li>
              </ul>
            </>
          ),
          title: '📊 CRIES Methodology',
          placement: 'right'
        },
        {
          target: '[data-tour="witness-tab"]',
          content: (
            <>
              <p className="mb-3">
                The <strong>Witness Protocol</strong> compares multiple AI models to verify outputs and detect consensus or divergence.
              </p>
              <p className="text-sm text-gray-400">
                Perfect for critical applications requiring high confidence.
              </p>
            </>
          ),
          title: '👥 Witness Consensus',
          placement: 'bottom'
        },
        {
          target: '[data-tour="receipts-link"]',
          content: (
            <>
              <p className="mb-3">
                Every audit generates a cryptographic <strong>receipt</strong> using Lamport chains for immutable verification.
              </p>
              <p className="text-sm text-gray-400">
                Perfect for compliance, SOC 2, and audit trails.
              </p>
            </>
          ),
          title: '🔒 Cryptographic Receipts',
          placement: 'left'
        },
        {
          target: '[data-tour="upgrade-banner"]',
          content: (
            <>
              <p className="mb-3">
                Upgrade to <strong>PRO</strong> for unlimited audits, witness consensus, and priority support.
              </p>
              <p className="text-sm text-gray-400">
                FREE tier: 10 audits/month • PRO: Unlimited • ENTERPRISE: Custom solutions
              </p>
            </>
          ),
          title: '⚡ Upgrade for More',
          placement: 'bottom'
        }
      ],
      lab: [
        {
          target: '[data-tour="lab-modules"]',
          content: (
            <>
              <p className="mb-3">
                The <strong>Lab</strong> provides specialized modules for different testing needs.
              </p>
              <p className="text-sm text-gray-400">
                Track-A, Track-B, Track-C, and Witness consensus - choose your testing strategy.
              </p>
            </>
          ),
          title: '🔬 Lab Modules',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="witness-module"]',
          content: (
            <>
              <p className="mb-3">
                Run <strong>Witness comparisons</strong> to test multiple models simultaneously and detect divergence.
              </p>
              <p className="text-sm text-gray-400">
                Ideal for high-stakes decisions and compliance validation.
              </p>
            </>
          ),
          title: '👁️ Witness Testing',
          placement: 'right'
        }
      ],
      receipts: [
        {
          target: '[data-tour="receipt-list"]',
          content: (
            <>
              <p className="mb-3">
                Your <strong>receipt registry</strong> maintains a tamper-proof chain of all audit events.
              </p>
              <p className="text-sm text-gray-400">
                Each receipt contains: hash, Lamport clock, event type, and chain link.
              </p>
            </>
          ),
          title: '📜 Receipt Registry',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="receipt-hash"]',
          content: (
            <>
              <p className="mb-3">
                Click any hash to <strong>verify the chain</strong> and ensure integrity from genesis to current state.
              </p>
              <p className="text-sm text-gray-400">
                Powered by Lamport timestamps for distributed verification.
              </p>
            </>
          ),
          title: '🔗 Chain Verification',
          placement: 'left'
        }
      ],
      pricing: [
        {
          target: '[data-tour="pricing-cards"]',
          content: (
            <>
              <p className="mb-3">
                Choose the plan that fits your needs - from free exploration to enterprise-scale compliance.
              </p>
              <p className="text-sm text-gray-400">
                All tiers include CRIES scoring, receipts, and cryptographic verification.
              </p>
            </>
          ),
          title: '💳 Pricing Tiers',
          disableBeacon: true,
          placement: 'bottom'
        }
      ]
    };

    return commonSteps[page] || commonSteps.pilot;
  };

  const steps = getTourSteps();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    // Update step index
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }

    // Handle tour completion or skip
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      setStepIndex(0);
      
      // Mark tour as completed in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('tourCompleted', 'true');
        localStorage.setItem('tourCompletedAt', new Date().toISOString());
      }
    }
  };

  // Don't render anything if tour is not running
  if (!runTour) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: '#1f2937', // gray-800
          backgroundColor: '#111827', // gray-900
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#3b82f6', // blue-600
          textColor: '#ffffff',
          width: undefined,
          beaconSize: 36
        },
        spotlight: {
          backgroundColor: 'transparent',
          border: '2px solid #3b82f6'
        }
      }}
      floaterProps={{
        disableAnimation: false
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour'
      }}
    />
  );
}

/**
 * Helper hook to manually trigger tour
 */
export function useOnboardingTour() {
  const restartTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tourCompleted');
      localStorage.removeItem('tourCompletedAt');
      window.location.reload();
    }
  };

  const skipTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tourCompleted', 'true');
      localStorage.setItem('tourCompletedAt', new Date().toISOString());
    }
  };

  const isTourCompleted = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tourCompleted') === 'true';
    }
    return false;
  };

  return { restartTour, skipTour, isTourCompleted };
}
