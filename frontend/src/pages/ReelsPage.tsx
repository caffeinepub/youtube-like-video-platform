import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import ReelCard from '../components/ReelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Film } from 'lucide-react';

export default function ReelsPage() {
  const search = useSearch({ strict: false }) as { videoId?: string };
  const targetVideoId = search?.videoId;

  const { data: allVideos = [], isLoading } = useGetAllVideos();
  const shorts = allVideos.filter((v) => v.isShort);

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrolledToTarget = useRef(false);

  // Scroll to target video on load
  useEffect(() => {
    if (!targetVideoId || scrolledToTarget.current || shorts.length === 0) return;
    const idx = shorts.findIndex((v) => v.id === targetVideoId);
    if (idx >= 0) {
      scrolledToTarget.current = true;
      setActiveIndex(idx);
      setTimeout(() => {
        itemRefs.current[idx]?.scrollIntoView({ behavior: 'instant' });
      }, 100);
    }
  }, [targetVideoId, shorts]);

  // IntersectionObserver to track which reel is active
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.findIndex((el) => el === entry.target);
            if (idx >= 0) {
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });
  }, []);

  useEffect(() => {
    if (shorts.length > 0) {
      setupObserver();
    }
    return () => {
      observerRef.current?.disconnect();
    };
  }, [shorts.length, setupObserver]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-64 h-96 rounded-xl bg-white/10" />
          <p className="text-white/60 text-sm">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-4">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Film className="w-8 h-8 text-white/60" />
        </div>
        <h2 className="text-white text-xl font-bold">No Reels Yet</h2>
        <p className="text-white/60 text-sm text-center max-w-xs">
          Upload short videos to see them here in the Reels feed.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {shorts.map((video, idx) => (
        <div
          key={video.id}
          ref={(el) => { itemRefs.current[idx] = el; }}
          className="snap-start snap-always"
        >
          <ReelCard video={video} isActive={activeIndex === idx} />
        </div>
      ))}
    </div>
  );
}
