import { Link, useNavigate } from '@tanstack/react-router';
import { Upload, Video, Heart } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import ProfileSetupModal from './ProfileSetupModal';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      login();
    } else {
      navigate({ to: '/upload' });
    }
  };

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] bg-clip-text text-transparent">
              VideoHub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, <span className="font-medium text-foreground">{userProfile.name}</span>
              </span>
            )}
            <Button
              onClick={handleUploadClick}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              onClick={handleAuth}
              disabled={disabled}
              size="sm"
              className="bg-gradient-to-r from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] hover:opacity-90 transition-opacity"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-muted/30 py-6 mt-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VideoHub. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-4 h-4 text-[oklch(0.65_0.25_25)] fill-current" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
