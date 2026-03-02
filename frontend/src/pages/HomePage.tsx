import React, { useState } from 'react';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import VideoCard from '../components/VideoCard';
import TrendingVideos from '../components/TrendingVideos';
import FilterSelector from '../components/FilterSelector';
import OfflineErrorState from '../components/OfflineErrorState';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';

const CATEGORIES = [
  'All', 'Music', 'Gaming', 'News', 'Sports', 'Education',
  'Technology', 'Entertainment', 'Travel', 'Food', 'Fashion',
  'Science', 'Comedy', 'Film', 'Anime',
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: videos, isLoading, error, refetch } = useGetAllVideos();
  const isOnline = useNetworkStatus();

  const filteredVideos = videos?.filter(v => !v.isShort) ?? [];

  const categoryFiltered = selectedCategory === 'All'
    ? filteredVideos
    : filteredVideos.filter(v =>
        v.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        v.description.toLowerCase().includes(selectedCategory.toLowerCase())
      );

  if (!isOnline && error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OfflineErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Category Filter */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-mt-charcoal-800 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${selectedCategory === cat
                  ? cat === 'All'
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-mt-red-500 text-white shadow-glow-red-sm'
                  : 'bg-mt-charcoal-800 text-mt-charcoal-300 hover:bg-mt-charcoal-700 hover:text-foreground'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-screen-2xl mx-auto">
        {/* Trending Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-mt-red-500" />
            <h2 className="text-lg font-display font-bold text-foreground">Trending Now</h2>
          </div>
          <TrendingVideos />
        </section>

        {/* Filter Selector */}
        <div className="mb-6">
          <FilterSelector />
        </div>

        {/* Video Grid */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-4">
            {selectedCategory === 'All' ? 'All Videos' : selectedCategory}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-xl bg-mt-charcoal-800" />
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-full bg-mt-charcoal-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full bg-mt-charcoal-800" />
                      <Skeleton className="h-3 w-2/3 bg-mt-charcoal-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 text-mt-charcoal-400">
              <p className="text-lg font-medium mb-2">Failed to load videos</p>
              <button
                onClick={() => refetch()}
                className="text-mt-red-400 hover:text-mt-red-300 underline text-sm"
              >
                Try again
              </button>
            </div>
          ) : categoryFiltered.length === 0 ? (
            <div className="text-center py-16 text-mt-charcoal-400">
              <p className="text-lg font-medium">No videos found</p>
              <p className="text-sm mt-1">Try a different category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryFiltered.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
