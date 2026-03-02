import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AdOverlayProps {
  onClose: () => void;
}

export default function AdOverlay({ onClose }: AdOverlayProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoClose = setTimeout(onClose, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
        Advertisement
      </div>

      <img
        src="/assets/generated/ad-placeholder-banner.dim_800x150.png"
        alt="Advertisement"
        className="w-full h-full object-cover"
      />

      <div className="absolute bottom-3 right-3">
        {canSkip ? (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-mt-charcoal-800/90 hover:bg-mt-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border border-mt-charcoal-600"
          >
            <X className="w-3.5 h-3.5" />
            Skip Ad
          </button>
        ) : (
          <div className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg font-medium">
            Skip in {countdown}s
          </div>
        )}
      </div>
    </div>
  );
}
