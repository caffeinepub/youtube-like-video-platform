import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface GoogleAuthContextType {
  googleUser: GoogleUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  googleUser: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

const STORAGE_KEY = 'google_user_session';
const CLIENT_ID = ''; // Will be populated from index.html GSI script

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
    return JSON.parse(jsonPayload) as GoogleUser;
  } catch {
    return null;
  }
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GoogleUser;
        setGoogleUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    const user = parseJwt(response.credential);
    if (user) {
      setGoogleUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, []);

  useEffect(() => {
    // Initialize Google Identity Services
    const initGSI = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        const metaClientId = document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content') || CLIENT_ID;
        if (!metaClientId) return;
        (window as any).google.accounts.id.initialize({
          client_id: metaClientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });
      }
    };

    // Try immediately, then wait for script load
    initGSI();
    const timer = setTimeout(initGSI, 1000);
    return () => clearTimeout(timer);
  }, [handleCredentialResponse]);

  const login = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    }
  }, []);

  const logout = useCallback(() => {
    setGoogleUser(null);
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }, []);

  return React.createElement(
    GoogleAuthContext.Provider,
    { value: { googleUser, isLoading, login, logout } },
    children
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
