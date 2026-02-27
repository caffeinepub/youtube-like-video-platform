import React, { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import ProfileSetupModal from './ProfileSetupModal';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import {
  Home,
  TrendingUp,
  PlaySquare,
  Users,
  Upload,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Download,
  BookOpen,
  DollarSign,
  Shield,
  MessageSquare,
  User,
  Key,
  LogIn,
  LogOut,
  Mic,
  MicOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: Home, label: 'home', path: '/' },
  { icon: TrendingUp, label: 'trending', path: '/shorts' },
  { icon: PlaySquare, label: 'subscriptions', path: '/subscriptions' },
  { icon: Users, label: 'community', path: '/community' },
  { icon: BookOpen, label: 'playlists', path: '/playlists' },
  { icon: MessageSquare, label: 'reels', path: '/reels' },
];

const ACCOUNT_NAV_ITEMS = [
  { icon: User, label: 'profile', path: '/profile' },
  { icon: Key, label: 'apiKeys', path: '/api-keys' },
  { icon: Upload, label: 'upload', path: '/upload' },
  { icon: DollarSign, label: 'monetization', path: '/monetization' },
];

const LABELS: Record<string, Record<string, string>> = {
  en: {
    home: 'Home', trending: 'Shorts', subscriptions: 'Subscriptions',
    community: 'Community', playlists: 'Playlists', reels: 'Reels',
    profile: 'Profile', apiKeys: 'API Keys', upload: 'Upload',
    monetization: 'Monetization', search: 'Search', signIn: 'Sign In',
    signOut: 'Sign Out', admin: 'Admin', download: 'Download App',
    copyright: 'Copyright Policy',
  },
  es: {
    home: 'Inicio', trending: 'Cortos', subscriptions: 'Suscripciones',
    community: 'Comunidad', playlists: 'Listas', reels: 'Reels',
    profile: 'Perfil', apiKeys: 'Claves API', upload: 'Subir',
    monetization: 'Monetización', search: 'Buscar', signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión', admin: 'Admin', download: 'Descargar App',
    copyright: 'Política de derechos',
  },
  fr: {
    home: 'Accueil', trending: 'Courts', subscriptions: 'Abonnements',
    community: 'Communauté', playlists: 'Playlists', reels: 'Reels',
    profile: 'Profil', apiKeys: 'Clés API', upload: 'Télécharger',
    monetization: 'Monétisation', search: 'Rechercher', signIn: 'Se connecter',
    signOut: 'Se déconnecter', admin: 'Admin', download: 'Télécharger App',
    copyright: 'Politique droits',
  },
  de: {
    home: 'Startseite', trending: 'Shorts', subscriptions: 'Abonnements',
    community: 'Gemeinschaft', playlists: 'Wiedergabelisten', reels: 'Reels',
    profile: 'Profil', apiKeys: 'API-Schlüssel', upload: 'Hochladen',
    monetization: 'Monetarisierung', search: 'Suchen', signIn: 'Anmelden',
    signOut: 'Abmelden', admin: 'Admin', download: 'App herunterladen',
    copyright: 'Urheberrecht',
  },
  ar: {
    home: 'الرئيسية', trending: 'قصيرة', subscriptions: 'اشتراكات',
    community: 'مجتمع', playlists: 'قوائم', reels: 'ريلز',
    profile: 'ملف', apiKeys: 'مفاتيح API', upload: 'رفع',
    monetization: 'تحقيق الدخل', search: 'بحث', signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج', admin: 'مشرف', download: 'تحميل التطبيق',
    copyright: 'سياسة حقوق النشر',
  },
  hi: {
    home: 'होम', trending: 'शॉर्ट्स', subscriptions: 'सदस्यता',
    community: 'समुदाय', playlists: 'प्लेलिस्ट', reels: 'रील्स',
    profile: 'प्रोफ़ाइल', apiKeys: 'API कुंजी', upload: 'अपलोड',
    monetization: 'मुद्रीकरण', search: 'खोज', signIn: 'साइन इन',
    signOut: 'साइन आउट', admin: 'एडमिन', download: 'ऐप डाउनलोड',
    copyright: 'कॉपीराइट नीति',
  },
  ja: {
    home: 'ホーム', trending: 'ショート', subscriptions: '登録チャンネル',
    community: 'コミュニティ', playlists: 'プレイリスト', reels: 'リール',
    profile: 'プロフィール', apiKeys: 'APIキー', upload: 'アップロード',
    monetization: '収益化', search: '検索', signIn: 'ログイン',
    signOut: 'ログアウト', admin: '管理者', download: 'アプリをダウンロード',
    copyright: '著作権ポリシー',
  },
};

function getLabel(lang: string, key: string): string {
  return LABELS[lang]?.[key] ?? LABELS['en'][key] ?? key;
}

export default function Layout({ children }: LayoutProps) {
  const { identity, login, clear } = useInternetIdentity();
  const { googleUser, handleGoogleLogout } = useGoogleAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { currentLanguage } = useLanguage();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = !!identity || !!googleUser;

  const { data: userProfile } = useGetCallerUserProfile();

  const { isListening, isSupported: voiceSupported, startListening, stopListening, transcript } = useVoiceSearch();

  React.useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  const [showProfileSetup, setShowProfileSetup] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && userProfile === null) {
      setShowProfileSetup(true);
    } else if (!isAuthenticated) {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, userProfile]);

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

  // Prefer backend avatar, then Google picture, then null
  const backendAvatarUrl = userProfile?.avatar ? convertBlobToDataURL(userProfile.avatar) : null;
  const googleAvatarUrl = googleUser?.picture || null;
  const avatarUrl = backendAvatarUrl || googleAvatarUrl;

  const displayName = userProfile?.name || googleUser?.name || 'User';
  const initials = getInitials(displayName);

  const t = (key: string) => getLabel(currentLanguage, key);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/assets/generated/mediatube-logo-icon.dim_128x128.png"
            alt="Mediatube"
            className="w-8 h-8"
          />
          <span className="font-bold text-lg hidden sm:block brand-gradient-text">Mediatube</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 bg-muted/50 border-border"
            />
          </div>
          {voiceSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-9 w-9 shrink-0 ${isListening ? 'text-primary animate-pulse' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop voice search' : 'Voice search'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSelector />

          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hidden sm:flex"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                    <Avatar className="w-8 h-8">
                      {avatarUrl && (
                        <AvatarImage
                          src={avatarUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 flex items-center gap-2">
                    <Avatar className="w-9 h-9 shrink-0">
                      {avatarUrl && (
                        <AvatarImage
                          src={avatarUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {identity && (
                        <p className="text-xs text-muted-foreground truncate">
                          {identity.getPrincipal().toString().substring(0, 20)}...
                        </p>
                      )}
                      {googleUser && !identity && (
                        <p className="text-xs text-muted-foreground truncate">{googleUser.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/api-keys" className="flex items-center gap-2 cursor-pointer">
                      <Key className="w-4 h-4" />
                      {t('apiKeys')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/upload" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {t('upload')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/monetization" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="w-4 h-4" />
                      {t('monetization')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => navigate({ to: '/login' })}
              size="sm"
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t('signIn')}</span>
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)]
            w-56 bg-background border-r border-border
            flex flex-col overflow-y-auto
            transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {/* Main Nav */}
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const isActive = currentPath === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {t(label)}
                </Link>
              );
            })}

            {/* Account Section */}
            {isAuthenticated && (
              <>
                <div className="pt-3 pb-1 px-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Account
                  </p>
                </div>
                {ACCOUNT_NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                  const isActive = currentPath === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {t(label)}
                    </Link>
                  );
                })}
              </>
            )}

            {/* More Links */}
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </p>
            </div>
            <Link
              to="/download"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${currentPath === '/download'
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Download className="w-5 h-5 shrink-0" />
              {t('download')}
            </Link>
            <Link
              to="/copyright-policy"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${currentPath === '/copyright-policy'
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Shield className="w-5 h-5 shrink-0" />
              {t('copyright')}
            </Link>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Mediatube
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </aside>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          googleDisplayName={googleUser?.name}
          googleAvatarUrl={googleUser?.picture}
        />
      )}
    </div>
  );
}
