import React from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineErrorStateProps {
  onRetry: () => void;
  message?: string;
  className?: string;
}

export default function OfflineErrorState({
  onRetry,
  message = 'Unable to load content. Please check your internet connection.',
  className = '',
}: OfflineErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-24 gap-4 text-center px-6 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">No Internet Connection</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-2"
        aria-label="Retry loading content"
      >
        Retry
      </Button>
    </div>
  );
}
