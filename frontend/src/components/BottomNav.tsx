import { Link, useMatchRoute } from '@tanstack/react-router';
import { Home, Flame, Upload, User, Tv2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' as const },
  { icon: Flame, label: 'Shorts', path: '/shorts' as const },
  { icon: Upload, label: 'Upload', path: '/upload' as const },
  { icon: Tv2, label: 'Subscriptions', path: '/subscriptions' as const },
  { icon: User, label: 'Profile', path: '/profile' as const },
];

export default function BottomNav() {
  const matchRoute = useMatchRoute();
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-yt-surface border-t border-yt-border">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = !!matchRoute({ to: path, fuzzy: path === '/' ? false : true });
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-white' : 'text-yt-text-secondary'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-yt-red' : ''}`} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
