import { useState } from 'react';
import { Link, useNavigate, useMatchRoute } from '@tanstack/react-router';
import {
  Search, Bell, Upload, User, Menu,
  Home, Flame, ListVideo, Key, BookOpen, Rss, Tv2,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import ProfileSetupModal from './ProfileSetupModal';
import BottomNav from './BottomNav';
import { getInitials, convertBlobToDataURL } from '../utils/avatarHelpers';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' as const },
  { icon: Flame, label: 'Shorts', path: '/shorts' as const },
  { icon: Tv2, label: 'Subscriptions', path: '/subscriptions' as const },
  { icon: ListVideo, label: 'Playlists', path: '/playlists' as const },
  { icon: BookOpen, label: 'Community', path: '/community' as const },
  { icon: Rss, label: 'Upload', path: '/upload' as const },
];

export default function Layout({ children }: LayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const queryClient = useQueryClient();

  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { googleUser, logout: googleLogout } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;
  const isLoggingIn = loginStatus === 'logging-in';

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/search', search: { q: searchQuery.trim() } });
    }
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      if (identity) {
        await clear();
        queryClient.clear();
      } else if (googleUser) {
        googleLogout();
        queryClient.clear();
      }
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const displayName = userProfile?.name || googleUser?.name || 'User';
  const initials = getInitials(displayName);

  // convertBlobToDataURL is synchronous — returns string directly
  const avatarUrl = userProfile?.avatar
    ? convertBlobToDataURL(userProfile.avatar)
    : googleUser?.picture || null;

  return (
    <div className="min-h-screen bg-yt-bg text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-yt-surface border-b border-yt-border h-14 flex items-center px-4 gap-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <img
              src="/assets/generated/mediatube-logo-icon.dim_128x128.png"
              alt="Mediatube"
              className="h-8 w-8 object-contain"
            />
            <img
              src="/assets/generated/mediatube-logo-full.dim_320x80.png"
              alt="Mediatube"
              className="hidden sm:block h-5 object-contain"
            />
          </Link>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex">
          <div className="flex w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-yt-bg border border-yt-border rounded-l-full px-4 py-2 text-sm text-white placeholder-yt-text-secondary focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-yt-chip border border-yt-border border-l-0 rounded-r-full hover:bg-yt-chip-hover transition-colors"
            >
              <Search className="w-4 h-4 text-yt-text-secondary" />
            </button>
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Mobile search */}
          <button
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => navigate({ to: '/search', search: { q: '' } })}
          >
            <Search className="w-5 h-5 text-white" />
          </button>

          {isAuthenticated && (
            <>
              <Link
                to="/upload"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
              >
                <Upload className="w-5 h-5 text-white" />
              </Link>
              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleAuth}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-yt-red text-white text-sm font-bold hover:opacity-90 transition-opacity overflow-hidden"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleAuth}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 py-1.5 border border-blue-500 text-blue-400 rounded-full text-sm hover:bg-blue-500/10 transition-colors disabled:opacity-50"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{isLoggingIn ? 'Signing in...' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <aside
          className={`hidden lg:flex flex-col fixed top-14 left-0 bottom-0 z-40 bg-yt-bg transition-all duration-200 overflow-y-auto scrollbar-hide ${
            sidebarCollapsed ? 'w-[72px]' : 'w-60'
          }`}
        >
          <nav className="py-3">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const isActive = !!matchRoute({ to: path, fuzzy: path === '/' ? false : true });
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                    isActive ? 'bg-yt-chip font-semibold' : 'hover:bg-yt-chip'
                  } ${sidebarCollapsed ? 'justify-center px-0 mx-0 rounded-none py-4' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-yt-text-secondary'}`}
                  />
                  {!sidebarCollapsed && (
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-yt-text-secondary'}`}>
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}

            {!sidebarCollapsed && <div className="border-t border-yt-border my-3 mx-3" />}

            {isAuthenticated && !sidebarCollapsed && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl hover:bg-yt-chip transition-colors"
                >
                  <User className="w-5 h-5 text-yt-text-secondary shrink-0" />
                  <span className="text-sm text-yt-text-secondary">Your Channel</span>
                </Link>
                <Link
                  to="/api-keys"
                  className="flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl hover:bg-yt-chip transition-colors"
                >
                  <Key className="w-5 h-5 text-yt-text-secondary shrink-0" />
                  <span className="text-sm text-yt-text-secondary">API Keys</span>
                </Link>
              </>
            )}

            {isAuthenticated && sidebarCollapsed && (
              <Link
                to="/profile"
                className="flex items-center justify-center py-4 hover:bg-yt-chip transition-colors"
              >
                <User className="w-5 h-5 text-yt-text-secondary" />
              </Link>
            )}

            {!sidebarCollapsed && (
              <>
                <div className="border-t border-yt-border my-3 mx-3" />
                <div className="px-5 py-2">
                  <p className="text-xs text-yt-text-secondary">
                    © {new Date().getFullYear()} Mediatube
                  </p>
                  <p className="text-xs text-yt-text-secondary mt-1">
                    Built with ❤️ using{' '}
                    <a
                      href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                        typeof window !== 'undefined' ? window.location.hostname : 'mediatube'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      caffeine.ai
                    </a>
                  </p>
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 min-h-0 transition-all duration-200 pb-16 lg:pb-0 ${
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
