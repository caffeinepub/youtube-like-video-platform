import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from '@tanstack/react-router';
import {
  Home, Search, Upload, Bell, Menu,
  Flame, Clapperboard, Users, BookOpen,
  LogOut, User, Shield, Download, Copyright,
  Wallet, MessageSquare, PlaySquare, TrendingUp, Mic,
  Heart, Play, Settings,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';
import NetworkStatusBanner from './NetworkStatusBanner';
import ProfileSetupModal from './ProfileSetupModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

const navItems = [
  { to: '/', icon: Home, label: 'home', exact: true },
  { to: '/reels', icon: PlaySquare, label: 'reels' },
  { to: '/shorts', icon: Clapperboard, label: 'shorts' },
  { to: '/subscriptions', icon: Users, label: 'subscriptions' },
  { to: '/community', icon: MessageSquare, label: 'community' },
];

const accountItems = [
  { to: '/profile', icon: User, label: 'profile' },
  { to: '/playlists', icon: BookOpen, label: 'playlists' },
  { to: '/upload', icon: Upload, label: 'upload' },
  { to: '/withdrawal', icon: Wallet, label: 'withdraw' },
];

const moreItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/download', icon: Download, label: 'Download App' },
  { to: '/copyright-policy', icon: Copyright, label: 'Copyright Policy' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, clear, login, loginStatus } = useInternetIdentity();
  const { googleUser, handleGoogleLogout } = useGoogleAuth();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const isAuthenticated = !!identity || !!googleUser;
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    transcript,
  } = useVoiceSearch();

  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (isAuthenticated && !profileLoading && profileFetched && userProfile === null) {
      setShowProfileSetup(true);
    }
  }, [isAuthenticated, profileLoading, profileFetched, userProfile]);

  useEffect(() => {
    async function loadAvatar() {
      if (userProfile?.avatar) {
        const url = convertBlobToDataURL(userProfile.avatar);
        setAvatarUrl(url);
      } else if (googleUser?.picture) {
        setAvatarUrl(googleUser.picture);
      } else {
        setAvatarUrl(null);
      }
    }
    loadAvatar();
  }, [userProfile, googleUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/search', search: { q: searchQuery.trim() } });
    }
  };

  const handleLogout = async () => {
    if (identity) {
      await clear();
    }
    if (googleUser) {
      handleGoogleLogout();
    }
    queryClient.clear();
    navigate({ to: '/' });
  };

  const displayName = userProfile?.name || googleUser?.name || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NetworkStatusBanner />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-14 border-b border-mt-charcoal-800 bg-mt-charcoal-900/95 backdrop-blur-md flex items-center px-4 gap-3">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-mt-red-500 rounded-lg flex items-center justify-center shadow-glow-red-sm">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-lg text-foreground hidden sm:block">
              Media<span className="text-mt-red-500">Tube</span>
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mt-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full h-9 pl-9 pr-4 bg-mt-charcoal-800 border border-mt-charcoal-700 rounded-full text-sm text-foreground placeholder:text-mt-charcoal-400 focus:outline-none focus:border-mt-red-500 focus:ring-1 focus:ring-mt-red-500 transition-colors"
            />
          </div>
          {voiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-mt-red-500 text-white'
                  : 'bg-mt-charcoal-800 text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-700'
              }`}
              aria-label="Voice search"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              <Link to="/upload">
                <Button
                  size="sm"
                  className="hidden sm:flex items-center gap-1.5 bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full font-medium text-xs h-8 px-3"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('upload')}
                </Button>
              </Link>

              <button className="p-2 rounded-full text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-transparent hover:ring-mt-red-500 transition-all">
                    <Avatar className="w-8 h-8">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                      <AvatarFallback className="bg-mt-red-500 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground"
                >
                  <div className="px-3 py-2 border-b border-mt-charcoal-700">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    {userProfile?.handle && (
                      <p className="text-xs text-mt-charcoal-400">@{userProfile.handle}</p>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer hover:bg-mt-charcoal-700">
                      <User className="w-4 h-4" /> {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer hover:bg-mt-charcoal-700">
                        <Shield className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer hover:bg-mt-charcoal-700">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-mt-charcoal-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-mt-red-400 hover:text-mt-red-300 hover:bg-mt-charcoal-700"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="p-2 rounded-lg text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Button
                onClick={() => login()}
                disabled={loginStatus === 'logging-in'}
                size="sm"
                className="bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full font-medium text-xs h-8 px-4"
              >
                {loginStatus === 'logging-in' ? 'Signing in...' : t('signIn')}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-14 left-0 bottom-0 z-40 w-60 bg-mt-charcoal-900 border-r border-mt-charcoal-800
            transform transition-transform duration-300 ease-in-out overflow-y-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:top-0 lg:z-auto lg:w-56 lg:shrink-0
          `}
        >
          <div className="flex flex-col h-full py-3">
            {/* Discover Section */}
            <div className="px-3 mb-1">
              <p className="text-xs font-semibold text-mt-charcoal-500 uppercase tracking-wider px-2 mb-1">
                Discover
              </p>
              {navItems.map(({ to, icon: Icon, label, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5
                      ${active
                        ? 'bg-mt-red-500/15 text-mt-red-400 border-l-2 border-mt-red-500 pl-[10px]'
                        : 'text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'scale-110' : ''} transition-transform`} />
                    <span>{t(label)}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mx-3 my-2 border-t border-mt-charcoal-800" />

            {/* My Account Section */}
            {isAuthenticated && (
              <div className="px-3 mb-1">
                <p className="text-xs font-semibold text-mt-charcoal-500 uppercase tracking-wider px-2 mb-1">
                  My Account
                </p>
                {accountItems.map(({ to, icon: Icon, label }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5
                        ${active
                          ? 'bg-mt-red-500/15 text-mt-red-400 border-l-2 border-mt-red-500 pl-[10px]'
                          : 'text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'scale-110' : ''} transition-transform`} />
                      <span>{t(label)}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mx-3 my-2 border-t border-mt-charcoal-800" />

            {/* More Section */}
            <div className="px-3 mb-1">
              <p className="text-xs font-semibold text-mt-charcoal-500 uppercase tracking-wider px-2 mb-1">
                More
              </p>
              {moreItems.map(({ to, icon: Icon, label }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5
                      ${active
                        ? 'bg-mt-red-500/15 text-mt-red-400 border-l-2 border-mt-red-500 pl-[10px]'
                        : 'text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'scale-110' : ''} transition-transform`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-auto px-5 py-4 border-t border-mt-charcoal-800">
              <p className="text-[10px] text-mt-charcoal-600 leading-relaxed">
                Built with{' '}
                <Heart className="inline w-3 h-3 text-mt-red-500 fill-mt-red-500" />{' '}
                using{' '}
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'mediatube')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mt-red-400 hover:text-mt-red-300 transition-colors"
                >
                  caffeine.ai
                </a>
              </p>
              <p className="text-[10px] text-mt-charcoal-700 mt-1">
                © {new Date().getFullYear()} MediaTube
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
        />
      )}
    </div>
  );
}
