import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useMatchRoute } from '@tanstack/react-router';
import {
  Search, Bell, Upload, User, Menu,
  Home, Flame, ListVideo, Key, BookOpen, Rss, Tv2,
  DollarSign, Shield, Mic, MicOff,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import ProfileSetupModal from './ProfileSetupModal';
import BottomNav from './BottomNav';
import { getInitials, convertBlobToDataURL } from '../utils/avatarHelpers';
import { toast } from 'sonner';

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { googleUser, logout: googleLogout } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;
  const isLoggingIn = loginStatus === 'logging-in';

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    transcript,
    error: voiceError,
  } = useVoiceSearch();

  // When transcript arrives, populate search and navigate
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
      navigate({ to: '/search', search: { q: transcript } });
    }
  }, [transcript, navigate]);

  // Show voice error as toast
  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/search', search: { q: searchQuery.trim() } });
    }
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/generated/mediatube-logo.dim_512x512.png"
              alt="Mediatube and Photo"
              className="h-9 w-9 object-contain rounded-lg"
            />
            <span className="hidden sm:block font-bold text-base tracking-tight brand-gradient-text">
              Mediatube and Photo
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex items-center gap-1">
          <div className="flex w-full">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Search'}
              className={`flex-1 bg-yt-bg border border-yt-border rounded-l-full px-4 py-2 text-sm text-white placeholder-yt-text-secondary focus:outline-none focus:border-mt-magenta transition-colors ${
                isListening ? 'border-mt-magenta placeholder-mt-magenta' : ''
              }`}
            />
            <button
              type="submit"
              className="px-5 py-2 bg-yt-chip border border-yt-border border-l-0 rounded-r-full hover:bg-yt-chip-hover transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-yt-text-secondary" />
            </button>
          </div>

          {/* Voice Search Button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              aria-label={isListening ? 'Stop listening' : 'Search by voice'}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 shrink-0 ${
                isListening
                  ? 'bg-mt-magenta text-white animate-pulse shadow-lg shadow-mt-magenta/40'
                  : 'bg-yt-chip hover:bg-yt-chip-hover text-yt-text-secondary hover:text-white'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
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
              className="flex items-center justify-center w-8 h-8 rounded-full bg-mt-magenta text-white text-sm font-bold hover:opacity-90 transition-opacity overflow-hidden"
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
              className="flex items-center gap-2 px-3 py-1.5 border border-mt-magenta text-mt-magenta rounded-full text-sm hover:bg-mt-magenta/10 transition-colors disabled:opacity-50"
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
                    isActive ? 'bg-mt-magenta/20 font-semibold' : 'hover:bg-yt-chip'
                  } ${sidebarCollapsed ? 'justify-center px-0 mx-0 rounded-none py-4' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-mt-magenta' : 'text-yt-text-secondary'}`}
                  />
                  {!sidebarCollapsed && (
                    <span className={`text-sm ${isActive ? 'text-mt-magenta' : 'text-yt-text-secondary'}`}>
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
                  to="/monetization"
                  className={`flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                    !!matchRoute({ to: '/monetization' }) ? 'bg-mt-magenta/20 font-semibold' : 'hover:bg-yt-chip'
                  }`}
                >
                  <DollarSign
                    className={`w-5 h-5 shrink-0 ${
                      !!matchRoute({ to: '/monetization' }) ? 'text-mt-magenta' : 'text-yt-text-secondary'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      !!matchRoute({ to: '/monetization' }) ? 'text-mt-magenta' : 'text-yt-text-secondary'
                    }`}
                  >
                    Monetization
                  </span>
                </Link>
                <Link
                  to="/api-keys"
                  className="flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl hover:bg-yt-chip transition-colors"
                >
                  <Key className="w-5 h-5 text-yt-text-secondary shrink-0" />
                  <span className="text-sm text-yt-text-secondary">API Keys</span>
                </Link>
                {isCallerAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-4 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                      !!matchRoute({ to: '/admin' }) ? 'bg-mt-magenta/20 font-semibold' : 'hover:bg-yt-chip'
                    }`}
                  >
                    <Shield
                      className={`w-5 h-5 shrink-0 ${
                        !!matchRoute({ to: '/admin' }) ? 'text-mt-magenta' : 'text-yt-text-secondary'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        !!matchRoute({ to: '/admin' }) ? 'text-mt-magenta' : 'text-yt-text-secondary'
                      }`}
                    >
                      Admin
                    </span>
                  </Link>
                )}
              </>
            )}

            {isAuthenticated && sidebarCollapsed && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center justify-center py-4 hover:bg-yt-chip transition-colors"
                >
                  <User className="w-5 h-5 text-yt-text-secondary" />
                </Link>
                <Link
                  to="/monetization"
                  className={`flex items-center justify-center py-4 transition-colors ${
                    !!matchRoute({ to: '/monetization' }) ? 'text-mt-magenta' : 'hover:bg-yt-chip text-yt-text-secondary'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </Link>
                {isCallerAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center justify-center py-4 transition-colors ${
                      !!matchRoute({ to: '/admin' }) ? 'text-mt-magenta' : 'hover:bg-yt-chip text-yt-text-secondary'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
              </>
            )}

            {!sidebarCollapsed && (
              <>
                <div className="border-t border-yt-border my-3 mx-3" />
                <div className="px-5 py-2">
                  <p className="text-xs text-yt-text-secondary">
                    © {new Date().getFullYear()} Mediatube and Photo
                  </p>
                  <p className="text-xs text-yt-text-secondary mt-1">
                    Built with ❤️ using{' '}
                    <a
                      href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                        typeof window !== 'undefined' ? window.location.hostname : 'mediatube-and-photo'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mt-pink hover:underline"
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
