import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, Clapperboard, Users, User, PlaySquare, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/shorts', icon: Clapperboard, label: 'Shorts' },
  { to: '/reels', icon: PlaySquare, label: 'Reels' },
  { to: '/subscriptions', icon: Users, label: 'Subs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-mt-charcoal-900/95 backdrop-blur-md border-t border-mt-charcoal-800 shadow-[0_-4px_20px_oklch(0_0_0/0.4)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-0"
            >
              <div className={`
                p-1.5 rounded-lg transition-all duration-200
                ${active ? 'bg-mt-red-500/20' : ''}
              `}>
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    active
                      ? 'text-mt-red-400 scale-110'
                      : 'text-mt-charcoal-400'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                active ? 'text-mt-red-400' : 'text-mt-charcoal-500'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
