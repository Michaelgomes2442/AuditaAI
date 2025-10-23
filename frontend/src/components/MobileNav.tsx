'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Zap, LayoutDashboard, Beaker, Receipt, CreditCard, Lightbulb, GitCompare, Activity, FileText, Webhook, Shield, Grid3x3, DollarSign, Target, TestTube, BookOpen, MessageSquare, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pilot', label: 'Pilot', icon: Zap },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/heatmap', label: 'Heatmap', icon: Grid3x3 },
    { href: '/costs', label: 'Costs', icon: DollarSign },
    { href: '/regression', label: 'Regression', icon: Target },
    { href: '/playground', label: 'Playground', icon: TestTube },
    { href: '/documentation', label: 'Docs', icon: BookOpen },
    { href: '/support', label: 'Support', icon: MessageSquare },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/sso', label: 'SSO', icon: Building2 },
    { href: '/lab', label: 'Lab', icon: Beaker },
    { href: '/templates', label: 'Templates', icon: FileText },
    { href: '/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/audit-logs', label: 'Audit Logs', icon: Activity },
    { href: '/rate-limits', label: 'Rate Limits', icon: CreditCard },
    { href: '/receipts', label: 'Receipts', icon: Receipt },
    { href: '/pricing', label: 'Pricing', icon: DollarSign },
    { href: '/walkthrough', label: 'Demo', icon: Lightbulb }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Hamburger Button - Theme toggle and language moved to profile settings */}
      <div className="fixed top-4 right-20 z-40 flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`lg:hidden p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-blue-500 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center dark:bg-gray-800 dark:border-gray-600 ${className}`}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <nav
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">
              Audit<span className="text-blue-400">a</span>AI
            </h2>
            <p className="text-sm text-gray-400 mt-1">Navigation Menu</p>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[48px] ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm dark:bg-gray-950/95 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <ThemeToggle />
              <span className="text-sm text-gray-400">Theme</span>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Close Menu
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
