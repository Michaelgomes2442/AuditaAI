"use client";

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Globe, Info, CheckCircle2 } from "lucide-react";
import { locales, localeNames, localeFlags } from "@/i18n/request";

export default function LanguageSettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="h-8 w-8" />
          {t('language')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose your preferred language for the interface
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Current Language
            </CardTitle>
            <CardDescription>
              Select your preferred display language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="language" className="flex-1">
                {tCommon('language')}
              </Label>
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Available Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Available Languages</CardTitle>
            <CardDescription>
              All supported languages in AuditaAI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {locales.map((locale) => (
                <div
                  key={locale}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <span className="text-2xl">{localeFlags[locale]}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{localeNames[locale]}</h4>
                    <p className="text-sm text-muted-foreground">
                      Locale: {locale}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Internationalization Features
            </CardTitle>
            <CardDescription>
              What's included in multi-language support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Fully translated user interface</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Locale-specific date and number formatting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Currency formatting based on locale</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Right-to-left (RTL) support (coming soon)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Persistent language preference</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Examples</CardTitle>
            <CardDescription>
              See how translations work across the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Common Actions</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('save')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('cancel')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('delete')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('edit')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('search')}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Navigation</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('home')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('dashboard')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('documentation')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('support')}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Status Messages</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('loading')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('success')}</div>
                <div className="px-3 py-1 bg-muted rounded text-sm">{tCommon('error')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
