import { getRequestConfig } from 'next-intl/server';

// List of all supported locales
export const locales = ['en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale names for display
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
};

export default getRequestConfig(async ({ locale }) => ({
  locale: locale || defaultLocale,
  messages: (await import(`./messages/${locale || defaultLocale}.json`)).default,
}));