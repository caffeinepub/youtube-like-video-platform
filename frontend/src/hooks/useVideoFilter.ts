import { useRef, useCallback, useEffect } from 'react';
import { FilterType, FILTERS } from '../types/filters';

interface UseVideoFilterReturn {
  /** Creates a canvas-based filtered MediaStream from the video element with optional zoom */
  applyFilterToStream: (
    videoEl: HTMLVideoElement,
    filterType: FilterType,
    width: number,
    height: number,
    zoom?: number
  ) => { stream: MediaStream; cleanup: () => void } | null;
}

/**
 * Hook that provides a utility to create a canvas-based filtered MediaStream.
 * Supports zoom (1.0–3.0) applied via drawImage cropping so the recorded output
 * reflects the zoom level.
 */
export function useVideoFilter(): UseVideoFilterReturn {
  const rafRef = useRef<number | null>(null);

  // Cancel any running animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const applyFilterToStream = useCallback(
    (
      videoEl: HTMLVideoElement,
      filterType: FilterType,
      width: number,
      height: number,
      zoom: number = 1.0
    ): { stream: MediaStream; cleanup: () => void } | null => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width || 1280;
        canvas.height = height || 720;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const cssFilter = FILTERS[filterType].cssFilter;

        // We use a ref-like object so the draw loop always reads the latest zoom
        const zoomRef = { current: zoom };

        let running = true;

        const draw = () => {
          if (!running) return;
          if (videoEl.readyState >= 2) {
            const z = Math.max(1.0, Math.min(3.0, zoomRef.current));
            const srcW = videoEl.videoWidth / z;
            const srcH = videoEl.videoHeight / z;
            const srcX = (videoEl.videoWidth - srcW) / 2;
            const srcY = (videoEl.videoHeight - srcH) / 2;

            ctx.filter = cssFilter === 'none' ? '' : cssFilter;
            ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
          }
          rafRef.current = requestAnimationFrame(draw);
        };

        draw();

        // Capture at ~30fps
        const stream = canvas.captureStream(30);

        const cleanup = () => {
          running = false;
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        };

        // Expose a way to update zoom without restarting the stream
        (stream as MediaStream & { _zoomRef?: { current: number } })._zoomRef = zoomRef;

        return { stream, cleanup };
      } catch {
        return null;
      }
    },
    []
  );

  return { applyFilterToStream };
}
