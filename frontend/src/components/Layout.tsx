import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';
import ProfileSetupModal from './ProfileSetupModal';
import BottomNav from './BottomNav';
import LanguageSelector from './LanguageSelector';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  User,
  Key,
  LogOut,
  ChevronDown,
  Play,
  Zap,
  ListVideo,
  Film,
  Search,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface LayoutProps {
  children: React.ReactNode;
}

// Google "G" SVG logo
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const { login: iiLogin, clear: iiClear, loginStatus: iiLoginStatus, identity } = useInternetIdentity();
  const { googleUser, login: googleLogin, logout: googleLogout, isLoggingIn: googleLoggingIn } = useGoogleAuth();

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;
  const isAuthenticated = isIIAuthenticated || isGoogleAuthenticated;

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  // Show profile setup modal for II users who don't have a profile yet
  const showProfileSetup = isIIAuthenticated && !profileLoading && profileFetched && userProfile === null;

  // Google profile setup state (local, since Google users use anonymous actor)
  const [showGoogleProfileSetup, setShowGoogleProfileSetup] = useState(false);
  const googleProfileChecked = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync search input with URL query param when on /search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    if (isGoogleAuthenticated && !googleProfileChecked.current) {
      googleProfileChecked.current = true;
      const storedProfile = localStorage.getItem(`google_profile_${googleUser?.sub}`);
      if (!storedProfile) {
        setShowGoogleProfileSetup(true);
      }
    }
    if (!isGoogleAuthenticated) {
      googleProfileChecked.current = false;
      setShowGoogleProfileSetup(false);
    }
  }, [isGoogleAuthenticated, googleUser]);

  const handleIIAuth = async () => {
    if (isIIAuthenticated) {
      await iiClear();
      queryClient.clear();
    } else {
      try {
        await iiLogin();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await iiClear();
          setTimeout(() => iiLogin(), 300);
        }
      }
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  const handleGoogleLogout = () => {
    googleLogout();
    queryClient.invalidateQueries();
    toast.success('Signed out of Google');
  };

  const handleGoogleProfileComplete = () => {
    if (googleUser) {
      const existing = localStorage.getItem(`google_profile_${googleUser.sub}`);
      if (!existing) {
        localStorage.setItem(`google_profile_${googleUser.sub}`, JSON.stringify({ name: googleUser.name }));
      }
    }
    setShowGoogleProfileSetup(false);
    toast.success('Profile saved!');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate({ to: '/search', search: { q } });
    setMobileSearchOpen(false);
  };

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen((prev) => !prev);
    if (!mobileSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Determine II user avatar source
  const iiAvatarSrc =
    userProfile?.avatar && userProfile.avatar.length > 0
      ? convertBlobToDataURL(userProfile.avatar)
      : googleUser?.picture || undefined;

  const iiDisplayName = userProfile?.name || 'My Channel';

  const currentYear = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'mediatube');

  const navLinks = [
    { to: '/reels', label: t('reels'), icon: <Film className="w-4 h-4" /> },
    { to: '/shorts', label: t('shorts'), icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                  <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl text-foreground hidden sm:block">Mediatube</span>
              </Link>

              {/* Nav links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    activeProps={{ className: 'text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary' }}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Search bar — desktop */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-md items-center"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
                />
              </div>
            </form>

            {/* Nav actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Mobile search toggle */}
              <button
                onClick={handleMobileSearchToggle}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={t('search')}
              >
                {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Language selector */}
              <LanguageSelector />

              {/* Upload button - only for II authenticated users */}
              {isIIAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: '/upload' })}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  {t('upload')}
                </Button>
              )}

              {/* Google user display */}
              {isGoogleAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={googleUser.picture} alt={googleUser.name} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(googleUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                        {googleUser.name}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{googleUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{googleUser.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleGoogleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('signOutGoogle')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* II authenticated user menu */}
              {isIIAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                      <Avatar className="w-7 h-7">
                        {iiAvatarSrc && <AvatarImage src={iiAvatarSrc} alt={iiDisplayName} />}
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(iiDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                        {iiDisplayName}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2 flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        {iiAvatarSrc && <AvatarImage src={iiAvatarSrc} alt={iiDisplayName} />}
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(iiDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate">{iiDisplayName}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                      <User className="w-4 h-4 mr-2" />
                      {t('myProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/upload' })}>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('uploadVideo')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/playlists' })}>
                      <ListVideo className="w-4 h-4 mr-2" />
                      {t('playlists')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/api-keys' })}>
                      <Key className="w-4 h-4 mr-2" />
                      {t('apiKeys')}
                    </DropdownMenuItem>
                    {/* Admin Dashboard link — only for admin users */}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate({ to: '/admin' })}
                          className="text-primary focus:text-primary"
                        >
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleIIAuth} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('disconnect')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Login buttons for unauthenticated users */}
              {!isAuthenticated && (
                <div className="flex items-center gap-2">
                  {/* Sign in with Google */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoogleLogin}
                    disabled={googleLoggingIn}
                    className="flex items-center gap-2 border-border hover:bg-muted"
                  >
                    <GoogleLogo size={16} />
                    <span className="hidden sm:inline">
                      {googleLoggingIn ? t('signingIn') : t('signInWithGoogle')}
                    </span>
                    <span className="sm:hidden">{t('google')}</span>
                  </Button>

                  {/* Internet Identity login */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleIIAuth}
                    disabled={iiLoginStatus === 'logging-in'}
                    className="flex items-center gap-2"
                  >
                    {iiLoginStatus === 'logging-in' ? t('connecting') : t('login')}
                  </Button>
                </div>
              )}

              {/* Show login button if only Google is authenticated (for II features) */}
              {isGoogleAuthenticated && !isIIAuthenticated && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleIIAuth}
                  disabled={iiLoginStatus === 'logging-in'}
                  className="hidden sm:flex items-center gap-2"
                  title="Connect wallet to upload videos and interact"
                >
                  {iiLoginStatus === 'logging-in' ? t('connecting') : t('connectWallet')}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile search bar — shown when toggled */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-3">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
                  />
                </div>
                <Button type="submit" size="sm" variant="default">
                  {t('search')}
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Main content — add bottom padding on mobile to avoid content hiding behind BottomNav */}
      <main className="flex-1 pb-16 sm:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 mt-auto mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Play className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Mediatube</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
              <p className="text-center">
                © {currentYear} Mediatube. All rights reserved.
              </p>
              <span className="hidden sm:inline">·</span>
              <Link to="/copyright" className="hover:text-foreground transition-colors">
                Copyright Policy
              </Link>
              <span className="hidden sm:inline">·</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                Built with ❤️ using caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Setup Modal for II users */}
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onComplete={() => {}}
        />
      )}

      {/* Profile Setup Modal for Google users */}
      {showGoogleProfileSetup && (
        <ProfileSetupModal
          open={showGoogleProfileSetup}
          onComplete={handleGoogleProfileComplete}
        />
      )}

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
