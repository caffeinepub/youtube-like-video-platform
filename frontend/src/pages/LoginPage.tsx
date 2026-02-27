import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGoogleAuth, type GoogleUser } from '../hooks/useGoogleAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile setup modal state (for Google sign-in flow)
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [googlePrefillName, setGooglePrefillName] = useState('');
  const [googlePrefillAvatar, setGooglePrefillAvatar] = useState('');

  const { handleGoogleLogin, isGoogleLoading, googleUser } = useGoogleAuth();
  const { login, loginStatus } = useInternetIdentity();
  const { data: userProfile, refetch: refetchProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const isIILoggingIn = loginStatus === 'logging-in';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    toast.info('Email/password login is coming soon. Please use Internet Identity or Google to sign in.');
    setIsSubmitting(false);
  };

  const handleIILogin = async () => {
    try {
      await login();
      navigate({ to: '/' });
    } catch {
      // handled by II provider
    }
  };

  const handleGoogleSignIn = () => {
    handleGoogleLogin(async (user: GoogleUser) => {
      // After successful Google auth, check if profile exists
      try {
        const result = await refetchProfile();
        const profile = result.data;
        if (profile) {
          // Profile exists — go home
          navigate({ to: '/' });
        } else {
          // No profile — show setup modal pre-filled with Google data
          setGooglePrefillName(user.name || '');
          setGooglePrefillAvatar(user.picture || '');
          setShowProfileSetup(true);
        }
      } catch {
        // If we can't check, show setup modal as fallback
        setGooglePrefillName(user.name || '');
        setGooglePrefillAvatar(user.picture || '');
        setShowProfileSetup(true);
      }
    });
  };

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false);
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <img
              src="/assets/generated/mediatube-logo-icon.dim_128x128.png"
              alt="Mediatube"
              className="h-12 w-12"
            />
            <span className="font-bold text-2xl brand-gradient-text">Mediatube</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Gmail / Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/30 border-border focus:border-primary"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full brand-gradient-bg text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <Separator className="flex-1" />
          </div>

          {/* Social / Identity Buttons */}
          <div className="space-y-3">
            {/* Continue with Google */}
            <Button
              variant="outline"
              className="w-full rounded-full border-border hover:bg-muted flex items-center gap-3 font-medium"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="h-4 w-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <SiGoogle className="h-4 w-4" style={{ color: '#4285F4' }} />
              )}
              {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Button>

            {/* Continue with Internet Identity */}
            <Button
              variant="outline"
              className="w-full rounded-full border-border hover:bg-muted flex items-center gap-3 font-medium"
              onClick={handleIILogin}
              disabled={isIILoggingIn}
            >
              {isIILoggingIn ? (
                <span className="h-4 w-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <img
                  src="/assets/generated/mediatube-logo-icon.dim_128x128.png"
                  alt="II"
                  className="h-4 w-4 rounded-full"
                />
              )}
              {isIILoggingIn ? 'Connecting...' : 'Continue with Internet Identity'}
            </Button>
          </div>

          {/* Footer links */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* App footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Profile Setup Modal for Google sign-in */}
      {showProfileSetup && googleUser && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={handleProfileSetupClose}
          googleDisplayName={googlePrefillName}
          googleAvatarUrl={googlePrefillAvatar}
        />
      )}
    </div>
  );
}
