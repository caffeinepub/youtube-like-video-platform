import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowBackOnline(false);
    } else if (wasOffline && isOnline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showBackOnline) return null;

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="w-full bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium z-[60]"
      >
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>You are offline. Check your internet connection.</span>
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="w-full bg-green-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium z-[60]"
      >
        <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Back online</span>
      </div>
    );
  }

  return null;
}
