import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useMatchRoute } from '@tanstack/react-router';
import {
  Home,
  PlaySquare,
  Users,
  Clock,
  ThumbsUp,
  Menu,
  Search,
  Bell,
  Upload,
  Mic,
  Flame,
  Music2,
  Gamepad2,
  Newspaper,
  Trophy,
  Lightbulb,
  Shirt,
  Film,
  Smartphone,
  LogOut,
  User,
  Shield,
  Key,
  DollarSign,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { SiGoogle } from 'react-icons/si';
import ProfileSetupModal from './ProfileSetupModal';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: TrendingUp, label: 'Trending', path: '/trending' },
  { icon: PlaySquare, label: 'Shorts', path: '/shorts' },
  { icon: Film, label: 'Reels', path: '/reels' },
  { icon: Users, label: 'Subscriptions', path: '/subscriptions' },
];

const libraryItems = [
  { icon: Clock, label: 'History', path: '/history' },
  { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
  { icon: PlaySquare, label: 'Playlists', path: '/playlists' },
];

const exploreItems = [
  { icon: Flame, label: 'Trending', path: '/trending' },
  { icon: Music2, label: 'Music', path: '/music' },
  { icon: Gamepad2, label: 'Gaming', path: '/gaming' },
  { icon: Newspaper, label: 'News', path: '/news' },
  { icon: Trophy, label: 'Sports', path: '/sports' },
  { icon: Lightbulb, label: 'Learning', path: '/learning' },
  { icon: Shirt, label: 'Fashion', path: '/fashion' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  // All hooks called at top level
  const { identity, clear, login } = useInternetIdentity();
  const { googleUser, handleGoogleLogin, handleGoogleLogout, isGoogleLoading } = useGoogleAuth();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: profileCheck, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);
  const { isListening, startListening, stopListening, isSupported: voiceSupported, transcript } = useVoiceSearch();

  const isAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;
  const isAnyAuthenticated = isAuthenticated || isGoogleAuthenticated;

  // Show profile setup modal for new users
  useEffect(() => {
    if (isAnyAuthenticated && !profileLoading && isFetched && profileCheck === null) {
      setShowProfileSetup(true);
    }
  }, [isAnyAuthenticated, profileLoading, isFetched, profileCheck]);

  // When voice transcript arrives, navigate to search
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
      navigate({ to: '/search', search: { q: transcript } });
    }
  }, [transcript, navigate]);

  const handleIILogin = async () => {
    try {
      await login();
    } catch {
      // handled by II provider
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleGoogleLogoutAndClear = () => {
    handleGoogleLogout();
    queryClient.clear();
  };

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

  const avatarUrl = userProfile?.avatar ? convertBlobToDataURL(userProfile.avatar) : null;
  const displayName = isGoogleAuthenticated
    ? googleUser.name
    : userProfile?.name || 'User';
  const displayAvatar = isGoogleAuthenticated && !avatarUrl
    ? googleUser.picture
    : avatarUrl;

  const isPathActive = (path: string) => !!matchRoute({ to: path as '/', fuzzy: path !== '/' });

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 bg-background border-b border-border z-50 h-14 shrink-0">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/assets/generated/mediatube-logo-icon.dim_128x128.png"
                alt="Mediatube"
                className="h-8 w-8"
              />
              <span className="font-bold text-lg hidden sm:block brand-gradient-text">
                Mediatube
              </span>
            </Link>
          </div>

          {/* Center: Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xl mx-4">
            <div className="flex flex-1 items-center border border-border rounded-full overflow-hidden bg-muted/30 focus-within:border-primary">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search') || 'Search'}
                className="flex-1 px-4 py-2 bg-transparent text-sm outline-none"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="rounded-none border-l border-border h-10 w-12 hover:bg-muted"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {voiceSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleVoiceSearch}
                className={`rounded-full ${isListening ? 'bg-destructive/20 text-destructive' : ''}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <LanguageSelector />

            {isAnyAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => navigate({ to: '/upload' })}
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* Auth buttons */}
            {!isAnyAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Internet Identity Login */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIILogin}
                  className="rounded-full border-primary text-primary hover:bg-primary/10 hidden sm:flex"
                >
                  <User className="h-4 w-4 mr-1" />
                  Sign in
                </Button>
                {/* Google Login */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="rounded-full border-border hover:bg-muted hidden sm:flex items-center gap-1"
                >
                  <SiGoogle className="h-4 w-4" style={{ color: '#4285F4' }} />
                  <span className="hidden md:inline">
                    {isGoogleLoading ? 'Signing in...' : 'Google'}
                  </span>
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      {displayAvatar && <AvatarImage src={displayAvatar} alt={displayName} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{displayName}</p>
                    {isGoogleAuthenticated && (
                      <p className="text-xs text-muted-foreground">{googleUser.email}</p>
                    )}
                    {isAuthenticated && (
                      <p className="text-xs text-muted-foreground truncate">
                        {identity?.getPrincipal().toString().slice(0, 20)}...
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {isAuthenticated && (
                    <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                      <User className="h-4 w-4 mr-2" />
                      Your Channel
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (
                    <DropdownMenuItem onClick={() => navigate({ to: '/monetization' })}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Monetization
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (
                    <DropdownMenuItem onClick={() => navigate({ to: '/api-keys' })}>
                      <Key className="h-4 w-4 mr-2" />
                      API Keys
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {isAuthenticated && (
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out (II)
                    </DropdownMenuItem>
                  )}
                  {isGoogleAuthenticated && (
                    <DropdownMenuItem onClick={handleGoogleLogoutAndClear} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out (Google)
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'w-56' : 'w-16'
            } shrink-0 bg-background border-r border-border overflow-y-auto transition-all duration-200 hidden md:flex flex-col`}
          >
            <nav className="flex flex-col gap-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                );
              })}

              <Separator className="my-2" />

              {sidebarOpen && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  You
                </p>
              )}

              {libraryItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                );
              })}

              <Separator className="my-2" />

              {sidebarOpen && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Explore
                </p>
              )}

              {exploreItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                );
              })}

              <Separator className="my-2" />

              {/* Admin link */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isPathActive('/admin')
                        ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Shield className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>Admin</span>}
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">Admin</TooltipContent>}
              </Tooltip>

              {/* Community link */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/community"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isPathActive('/community')
                        ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <BookOpen className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>Community</span>}
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">Community</TooltipContent>}
              </Tooltip>

              {/* Download App link */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/download"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isPathActive('/download')
                        ? 'bg-mt-magenta/10 text-mt-magenta font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>Download App</span>}
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">Download App</TooltipContent>}
              </Tooltip>

              <Separator className="my-2" />

              {/* Footer links */}
              {sidebarOpen && (
                <div className="px-3 py-2 space-y-1">
                  <Link
                    to="/copyright-policy"
                    className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Copyright Policy
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Mediatube
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Built with ❤️ using{' '}
                    <a
                      href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                        typeof window !== 'undefined' ? window.location.hostname : 'mediatube'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      caffeine.ai
                    </a>
                  </p>
                </div>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
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
    </TooltipProvider>
  );
}
