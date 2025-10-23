'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder to avoid hydration mismatch
    return (
      <Button
        variant="outline"
        size="icon"
        className="min-h-[48px] min-w-[48px] bg-gray-900/50 border-gray-700 hover:border-gray-600"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="min-h-[48px] min-w-[48px] bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-blue-400 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
