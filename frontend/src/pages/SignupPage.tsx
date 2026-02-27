import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';
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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile setup modal state (for Google sign-up flow)
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [googlePrefillName, setGooglePrefillName] = useState('');
  const [googlePrefillAvatar, setGooglePrefillAvatar] = useState('');

  const { handleGoogleLogin, isGoogleLoading, googleUser } = useGoogleAuth();
  const { login, loginStatus } = useInternetIdentity();
  const { data: userProfile, refetch: refetchProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const isIILoggingIn = loginStatus === 'logging-in';

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    toast.info('Email/password signup is coming soon. Please use Internet Identity or Google to create an account.');
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

  const handleGoogleSignUp = () => {
    handleGoogleLogin(async (user: GoogleUser) => {
      // After successful Google auth, check if profile exists
      try {
        const result = await refetchProfile();
        const profile = result.data;
        if (profile) {
          // Profile already exists — go home (duplicate sign-in)
          navigate({ to: '/' });
        } else {
          // New user — show setup modal pre-filled with Google data
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

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

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
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup} className="space-y-5">
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
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-muted/30 border-border focus:border-primary ${
                    !passwordsMatch ? 'border-destructive focus:border-destructive' : ''
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full brand-gradient-bg text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
              disabled={isSubmitting || !passwordsMatch}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or sign up with</span>
            <Separator className="flex-1" />
          </div>

          {/* Social / Identity Buttons */}
          <div className="space-y-3">
            {/* Join with Google */}
            <Button
              variant="outline"
              className="w-full rounded-full border-border hover:bg-muted flex items-center gap-3 font-medium"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="h-4 w-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <SiGoogle className="h-4 w-4" style={{ color: '#4285F4' }} />
              )}
              {isGoogleLoading ? 'Signing up with Google...' : 'Join with Google'}
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
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
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

      {/* Profile Setup Modal for Google sign-up */}
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
