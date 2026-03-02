import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { LanguageCode } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES: { code: LanguageCode; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'es', native: 'Español' },
  { code: 'fr', native: 'Français' },
  { code: 'de', native: 'Deutsch' },
  { code: 'ja', native: '日本語' },
  { code: 'ar', native: 'العربية' },
];

export default function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();
  const current = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 p-2 rounded-lg text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 transition-colors text-sm">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">{current.native}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground"
      >
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between cursor-pointer hover:bg-mt-charcoal-700 ${
              currentLanguage === lang.code ? 'text-mt-red-400' : 'text-mt-charcoal-200'
            }`}
          >
            <span>{lang.native}</span>
            {currentLanguage === lang.code && (
              <span className="w-1.5 h-1.5 rounded-full bg-mt-red-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
