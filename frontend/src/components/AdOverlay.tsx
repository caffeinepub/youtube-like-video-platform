import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdOverlayProps {
  onSkip: () => void;
  onComplete: () => void;
}

const AD_SKIP_DELAY = 5;   // seconds before skip button appears
const AD_TOTAL_DURATION = 15; // seconds before auto-dismiss

export default function AdOverlay({ onSkip, onComplete }: AdOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(AD_TOTAL_DURATION);
  const [canSkip, setCanSkip] = useState(false);

  const dismiss = useCallback(
    (skipped: boolean) => {
      if (skipped) {
        onSkip();
      } else {
        onComplete();
      }
    },
    [onSkip, onComplete]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= AD_TOTAL_DURATION - AD_SKIP_DELAY) {
          setCanSkip(true);
        }
        if (next <= 0) {
          clearInterval(interval);
          dismiss(false);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dismiss]);

  const skipCountdown = Math.max(0, AD_SKIP_DELAY - (AD_TOTAL_DURATION - secondsLeft));

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none">
      {/* Semi-transparent backdrop at bottom */}
      <div className="pointer-events-auto w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-12 pb-4">
        {/* Ad banner */}
        <div className="relative rounded-lg overflow-hidden border border-white/20 shadow-2xl mb-3 bg-black">
          {/* Ad label */}
          <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-white/30">
            Ad
          </div>
          {/* Ad image */}
          <img
            src="/assets/generated/ad-placeholder-banner.dim_800x150.png"
            alt="Advertisement"
            className="w-full h-auto object-cover max-h-[100px]"
            draggable={false}
          />
          {/* Visit link indicator */}
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded cursor-pointer transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span>Learn more</span>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <p className="text-white/70 text-xs">
            Ad ends in <span className="text-white font-semibold">{secondsLeft}s</span>
          </p>

          {canSkip ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismiss(true)}
              className="bg-white/10 border-white/40 text-white hover:bg-white/25 hover:text-white text-xs h-8 px-3 gap-1"
            >
              <X className="w-3 h-3" />
              Skip Ad
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white/80 text-xs h-8 px-3 rounded-md">
              Skip in <span className="font-bold text-white">{skipCountdown}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
