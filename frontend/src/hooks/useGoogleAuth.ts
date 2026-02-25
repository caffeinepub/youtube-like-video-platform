import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string; // Google user ID
}

interface GoogleAuthContextValue {
  googleUser: GoogleUser | null;
  loginStatus: 'idle' | 'logging-in' | 'success' | 'error';
  login: () => void;
  logout: () => void;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

const STORAGE_KEY = 'google_auth_user';
const CLIENT_ID = '1098765432100-example.apps.googleusercontent.com'; // Will be replaced by GSI prompt

function parseJwt(token: string): GoogleUser | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      name: payload.name || '',
      email: payload.email || '',
      picture: payload.picture || '',
      sub: payload.sub || '',
    };
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
    __googleAuthCallback?: (response: { credential: string }) => void;
  }
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginStatus, setLoginStatus] = useState<'idle' | 'logging-in' | 'success' | 'error'>(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? 'success' : 'idle';
      } catch {
        return 'idle';
      }
    }
  );
  const [gsiReady, setGsiReady] = useState(false);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    const user = parseJwt(response.credential);
    if (user) {
      setGoogleUser(user);
      setLoginStatus('success');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      setLoginStatus('error');
    }
  }, []);

  useEffect(() => {
    window.__googleAuthCallback = handleCredentialResponse;

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    // Check immediately
    checkGsi();

    // Poll until GSI is loaded
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        checkGsi();
      }
    }, 100);

    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [handleCredentialResponse]);

  const login = useCallback(() => {
    if (!gsiReady || !window.google?.accounts?.id) {
      // GSI not loaded - show a fallback
      setLoginStatus('error');
      setTimeout(() => setLoginStatus('idle'), 2000);
      return;
    }
    setLoginStatus('logging-in');
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Popup was blocked or skipped - try rendering button flow
        setLoginStatus('idle');
      }
    });
  }, [gsiReady]);

  const logout = useCallback(() => {
    if (googleUser && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.revoke(googleUser.email, () => {});
    }
    setGoogleUser(null);
    setLoginStatus('idle');
    localStorage.removeItem(STORAGE_KEY);
  }, [googleUser]);

  const value: GoogleAuthContextValue = {
    googleUser,
    loginStatus,
    login,
    logout,
    isLoggingIn: loginStatus === 'logging-in',
    isLoginSuccess: loginStatus === 'success',
    isLoginError: loginStatus === 'error',
  };

  return React.createElement(GoogleAuthContext.Provider, { value }, children);
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  return ctx;
}
