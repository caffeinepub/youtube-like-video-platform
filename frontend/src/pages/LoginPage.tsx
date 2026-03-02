import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Play } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus } = useInternetIdentity();
  const { handleGoogleLogin, isGoogleLoading } = useGoogleAuth();
  const { refetch: refetchProfile } = useGetCallerUserProfile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';

  const handleGoogleClick = () => {
    handleGoogleLogin(async (user) => {
      const result = await refetchProfile();
      if (result.data === null) {
        setGoogleName(user.name || '');
        setGoogleAvatar(user.picture || '');
        setShowProfileSetup(true);
      } else {
        navigate({ to: '/' });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-mt-red-500 rounded-xl flex items-center justify-center shadow-glow-red">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              Media<span className="text-mt-red-500">Tube</span>
            </span>
          </div>
          <p className="text-mt-charcoal-400 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-2xl p-8 shadow-card">
          <h1 className="font-display font-bold text-2xl text-foreground mb-6">Welcome back</h1>

          {/* Email/Password Form */}
          <div className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <Label className="text-mt-charcoal-300 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mt-charcoal-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-mt-charcoal-300 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mt-charcoal-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mt-charcoal-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-mt-charcoal-900 px-3 text-mt-charcoal-500">or continue with</span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleClick}
              disabled={isGoogleLoading}
              variant="outline"
              className="w-full bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground hover:bg-mt-charcoal-700 hover:border-mt-red-500 rounded-xl h-11 font-medium"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <SiGoogle className="w-4 h-4 mr-2 text-red-400" />
              )}
              Continue with Google
            </Button>

            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-xl h-11 font-semibold"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Continue with Internet Identity
            </Button>
          </div>

          <p className="text-center text-sm text-mt-charcoal-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-mt-red-400 hover:text-mt-red-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {showProfileSetup && (
        <ProfileSetupModal
          open={showProfileSetup}
          onClose={() => { setShowProfileSetup(false); navigate({ to: '/' }); }}
          googleDisplayName={googleName}
          googleAvatarUrl={googleAvatar}
        />
      )}
    </div>
  );
}
