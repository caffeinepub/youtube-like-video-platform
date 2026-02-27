import { useState } from 'react';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';

const CATEGORIES = [
  'All', 'Trending', 'Gaming', 'Music', 'Sports', 'News',
  'Learning', 'Fashion', 'Comedy', 'Tech', 'Travel', 'Food',
  'Fitness', 'Science', 'Movies', 'Live',
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const isOnline = useNetworkStatus();
  const { data: videos = [], isLoading, refetch } = useGetAllVideos();

  const filteredVideos = activeCategory === 'All'
    ? videos.filter((v) => !v.isShort)
    : videos.filter((v) => !v.isShort);

  return (
    <div className="bg-yt-bg min-h-screen">
      {/* Category Filter Chips */}
      <div className="sticky top-14 z-30 bg-yt-bg border-b border-yt-border">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide snap-x">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 snap-start px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-yt-chip text-white hover:bg-yt-chip-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-4 py-6">
        {!isOnline && isLoading ? (
          <OfflineErrorState
            onRetry={() => refetch()}
            message="Unable to load videos. Please check your internet connection."
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-xl bg-yt-chip" />
                <div className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full bg-yt-chip shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full bg-yt-chip" />
                    <Skeleton className="h-3 w-3/4 bg-yt-chip" />
                    <Skeleton className="h-3 w-1/2 bg-yt-chip" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isOnline && filteredVideos.length === 0 ? (
          <OfflineErrorState
            onRetry={() => refetch()}
            message="Unable to load videos. Please check your internet connection."
          />
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-yt-chip flex items-center justify-center mb-4">
              <span className="text-3xl">🎬</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
            <p className="text-yt-text-secondary text-sm max-w-sm">
              Be the first to upload a video and share it with the world!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
