import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import { useGetSubscribedReels } from '../hooks/useGetSubscribedReels';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import ReelCard from '../components/ReelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { VideoMetadata } from '../backend';

type Tab = 'forYou' | 'following';

export default function ReelsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('forYou');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const navigate = useNavigate();

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: allVideos, isLoading: allLoading } = useGetAllVideos();
  const { data: subscribedReels, isLoading: subscribedLoading } = useGetSubscribedReels();

  const forYouReels = (allVideos || []).filter((v) => v.isShort);
  const followingReels = subscribedReels || [];

  const activeReels: VideoMetadata[] =
    activeTab === 'forYou' ? forYouReels : followingReels;

  const isLoading = activeTab === 'forYou' ? allLoading : subscribedLoading;

  // Intersection Observer to track active reel
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    const items = containerRef.current?.querySelectorAll('[data-index]');
    items?.forEach((item) => observerRef.current?.observe(item));
  }, []);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [activeReels.length, setupObserver]);

  // Reset active index when tab changes
  useEffect(() => {
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const showFollowingLoginPrompt = activeTab === 'following' && !isAuthenticated;
  const showFollowingEmptyPrompt =
    activeTab === 'following' && isAuthenticated && !subscribedLoading && followingReels.length === 0;

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col">
      {/* Tab Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center gap-6 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex gap-6 pointer-events-auto">
          <button
            onClick={() => setActiveTab('forYou')}
            className={`text-sm font-semibold pb-1 transition-all ${
              activeTab === 'forYou'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`text-sm font-semibold pb-1 transition-all ${
              activeTab === 'following'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto space-y-3 px-4">
            <Skeleton className="w-full aspect-[9/16] rounded-xl bg-white/10" />
          </div>
        </div>
      ) : showFollowingLoginPrompt ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white text-xl font-bold">Sign in to see your feed</h2>
            <p className="text-white/60 text-sm">
              Log in to see reels from channels you follow.
            </p>
            <Button
              onClick={() => navigate({ to: '/' })}
              className="bg-white text-black hover:bg-white/90 font-semibold px-6"
            >
              Sign In
            </Button>
          </div>
        </div>
      ) : showFollowingEmptyPrompt ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white text-xl font-bold">No reels yet</h2>
            <p className="text-white/60 text-sm">
              Subscribe to channels to see their short videos here.
            </p>
            <Button
              onClick={() => navigate({ to: '/' })}
              className="bg-white text-black hover:bg-white/90 font-semibold px-6"
            >
              Discover Channels
            </Button>
          </div>
        </div>
      ) : activeReels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/60 text-sm">No reels available yet.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeReels.map((video, index) => (
            <div
              key={video.id}
              data-index={index}
              className="h-screen w-full snap-start snap-always flex items-center justify-center"
            >
              <ReelCard
                video={video}
                isActive={index === activeIndex}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
