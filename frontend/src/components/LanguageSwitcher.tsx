"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/request';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";

export function LanguageSwitcher() {
  // Safely handle missing intl context
  let locale: Locale = 'en';
  let t: any = (key: string) => key;
  
  try {
    locale = useLocale() as Locale;
    t = useTranslations('common');
  } catch (error) {
    // Intl context not configured, use defaults
    console.warn('next-intl context not configured, using default locale');
  }
  
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove the current locale prefix from the pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');
    
    // Navigate to the same path with the new locale
    const newPath = `/${newLocale}${pathnameWithoutLocale}` as any;
    router.push(newPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{localeNames[locale]}</span>
          <span className="sm:hidden">{localeFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="cursor-pointer"
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            <span className="flex-1">{localeNames[loc]}</span>
            {locale === loc && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
