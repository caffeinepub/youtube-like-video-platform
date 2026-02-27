import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Home, TrendingUp, PlaySquare, Users, User, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LABELS: Record<string, Record<string, string>> = {
  en: { home: 'Home', shorts: 'Shorts', subscriptions: 'Subs', community: 'Community', profile: 'Profile', withdraw: 'Withdraw' },
  es: { home: 'Inicio', shorts: 'Cortos', subscriptions: 'Subs', community: 'Comunidad', profile: 'Perfil', withdraw: 'Retirar' },
  fr: { home: 'Accueil', shorts: 'Courts', subscriptions: 'Abos', community: 'Communauté', profile: 'Profil', withdraw: 'Retirer' },
  de: { home: 'Start', shorts: 'Shorts', subscriptions: 'Abos', community: 'Gemeinschaft', profile: 'Profil', withdraw: 'Abheben' },
  ar: { home: 'الرئيسية', shorts: 'قصيرة', subscriptions: 'اشتراكات', community: 'مجتمع', profile: 'ملف', withdraw: 'سحب' },
  hi: { home: 'होम', shorts: 'शॉर्ट्स', subscriptions: 'सदस्यता', community: 'समुदाय', profile: 'प्रोफ़ाइल', withdraw: 'निकासी' },
  ja: { home: 'ホーム', shorts: 'ショート', subscriptions: '登録', community: 'コミュニティ', profile: 'プロフィール', withdraw: '出金' },
};

function getLabel(lang: string, key: string): string {
  return LABELS[lang]?.[key] ?? LABELS['en'][key] ?? key;
}

const NAV_ITEMS = [
  { icon: Home, label: 'home', path: '/' },
  { icon: TrendingUp, label: 'shorts', path: '/shorts' },
  { icon: PlaySquare, label: 'subscriptions', path: '/subscriptions' },
  { icon: Wallet, label: 'withdraw', path: '/withdrawal' },
  { icon: User, label: 'profile', path: '/profile' },
];

export default function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { currentLanguage } = useLanguage();

  const t = (key: string) => getLabel(currentLanguage, key);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path;
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0
                ${isActive
                  ? 'text-mt-magenta'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-mt-magenta' : ''}`} />
              <span className={`text-[10px] font-medium truncate ${isActive ? 'text-mt-magenta' : ''}`}>
                {t(label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
