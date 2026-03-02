import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();
  const [showOnline, setShowOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnline(false);
    } else if (wasOffline) {
      setShowOnline(true);
      const timer = setTimeout(() => {
        setShowOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300
        ${!isOnline
          ? 'bg-red-900/80 text-red-200 border-b border-red-800'
          : 'bg-green-900/80 text-green-200 border-b border-green-800'
        }
      `}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be unavailable.</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online!</span>
        </>
      )}
    </div>
  );
}
