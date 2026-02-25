import React from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Home, Zap, Plus, ListVideo, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

export default function BottomNav() {
  const matchRoute = useMatchRoute();
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const isHome = !!matchRoute({ to: '/' });
  const isShorts = !!matchRoute({ to: '/shorts' });
  const isUpload = !!matchRoute({ to: '/upload' });
  const isSubscriptions = false;
  const isProfile = !!matchRoute({ to: '/profile' });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
        >
          <Home
            className={`w-6 h-6 transition-colors ${
              isHome ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            strokeWidth={isHome ? 2.5 : 1.75}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              isHome ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {t('home')}
          </span>
        </Link>

        {/* Shorts */}
        <Link
          to="/shorts"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
        >
          <Zap
            className={`w-6 h-6 transition-colors ${
              isShorts ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            strokeWidth={isShorts ? 2.5 : 1.75}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              isShorts ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {t('shorts')}
          </span>
        </Link>

        {/* Upload / Create — centered prominent button */}
        <Link
          to="/upload"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              isUpload
                ? 'bg-foreground border-foreground'
                : 'bg-background border-border group-hover:border-foreground'
            }`}
          >
            <Plus
              className={`w-5 h-5 transition-colors ${
                isUpload ? 'text-background' : 'text-foreground'
              }`}
              strokeWidth={2.5}
            />
          </div>
        </Link>

        {/* Subscriptions */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
        >
          <ListVideo
            className={`w-6 h-6 transition-colors ${
              isSubscriptions
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
            strokeWidth={isSubscriptions ? 2.5 : 1.75}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              isSubscriptions
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {t('subscriptions')}
          </span>
        </Link>

        {/* You / Profile */}
        <Link
          to="/profile"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 group"
        >
          <User
            className={`w-6 h-6 transition-colors ${
              isProfile ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            strokeWidth={isProfile ? 2.5 : 1.75}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              isProfile ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {t('you')}
          </span>
        </Link>
      </div>
    </nav>
  );
}
