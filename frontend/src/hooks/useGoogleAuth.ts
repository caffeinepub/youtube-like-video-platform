import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import type { ReactNode } from 'react';

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
  isGoogleLoading: boolean;
  handleGoogleLogin: (onSuccess?: (user: GoogleUser) => void) => void;
  handleGoogleLogout: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  googleUser: null,
  isGoogleLoading: false,
  handleGoogleLogin: () => {},
  handleGoogleLogout: () => {},
});

const GOOGLE_CLIENT_ID = '648897073537-oj0ggbqjqjqjqjqjqjqjqjqjqjqjqjq.apps.googleusercontent.com';
const STORAGE_KEY = 'google_auth_user';

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

interface GsiNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
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
          prompt: (notification?: (n: GsiNotification) => void) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
          renderButton: (element: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  // Store pending onSuccess callback ref
  const [pendingCallback, setPendingCallback] = useState<((user: GoogleUser) => void) | null>(null);

  // Load persisted session
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setGoogleUser(JSON.parse(stored) as GoogleUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Initialize GSI
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            const user = parseJwt(response.credential);
            if (user) {
              setGoogleUser(user);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
              // Fire pending callback if any
              setPendingCallback((cb) => {
                if (cb) cb(user);
                return null;
              });
            }
            setIsGoogleLoading(false);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setGsiReady(true);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initGsi);
      return () => script.removeEventListener('load', initGsi);
    }

    // Dynamically add the script if not present
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = initGsi;
    document.head.appendChild(s);
  }, []);

  const handleGoogleLogin = useCallback(
    (onSuccess?: (user: GoogleUser) => void) => {
      if (!window.google?.accounts?.id) return;

      if (onSuccess) {
        setPendingCallback(() => onSuccess);
      }

      if (!gsiReady) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            const user = parseJwt(response.credential);
            if (user) {
              setGoogleUser(user);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
              setPendingCallback((cb) => {
                if (cb) cb(user);
                return null;
              });
            }
            setIsGoogleLoading(false);
          },
        });
        setGsiReady(true);
      }

      setIsGoogleLoading(true);
      window.google.accounts.id.prompt((notification: GsiNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsGoogleLoading(false);
          setPendingCallback(null);
        }
      });
    },
    [gsiReady]
  );

  const handleGoogleLogout = useCallback(() => {
    if (googleUser && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.revoke(googleUser.email, () => {});
    }
    setGoogleUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [googleUser]);

  return createElement(
    GoogleAuthContext.Provider,
    { value: { googleUser, isGoogleLoading, handleGoogleLogin, handleGoogleLogout } },
    children
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
