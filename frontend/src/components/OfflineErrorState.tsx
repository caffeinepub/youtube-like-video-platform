import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineErrorStateProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export default function OfflineErrorState({
  onRetry,
  message = "You're offline. Please check your connection and try again.",
  className = '',
}: OfflineErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 px-6 text-center ${className}`}>
      <div className="p-4 bg-mt-charcoal-800 rounded-full">
        <WifiOff className="w-10 h-10 text-mt-charcoal-400" />
      </div>
      <div>
        <h3 className="text-lg font-display font-bold text-foreground mb-1">No Connection</h3>
        <p className="text-sm text-mt-charcoal-400 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
