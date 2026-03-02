import React, { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetTrendingVideos } from '../hooks/useGetTrendingVideos';
import { formatViewCount, formatDuration } from '../utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react';

export default function TrendingVideos() {
  const { data: videos, isLoading } = useGetTrendingVideos();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const nonShorts = videos?.filter(v => !v.isShort).slice(0, 10) ?? [];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 w-48 space-y-2">
            <Skeleton className="aspect-video w-full rounded-xl bg-mt-charcoal-800" />
            <Skeleton className="h-3 w-full bg-mt-charcoal-800" />
            <Skeleton className="h-3 w-2/3 bg-mt-charcoal-800" />
          </div>
        ))}
      </div>
    );
  }

  if (nonShorts.length === 0) return null;

  return (
    <div className="relative group">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-mt-charcoal-900/90 border border-mt-charcoal-700 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg -translate-x-3 hover:bg-mt-red-500 hover:border-mt-red-500"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
      >
        {nonShorts.map((video, index) => (
          <Link
            key={video.id}
            to="/video/$videoId"
            params={{ videoId: video.id }}
            className="shrink-0 w-48 group/card"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-mt-charcoal-800 mb-2 shadow-card group-hover/card:shadow-card-hover transition-shadow">
              <video
                src={video.videoFile.getDirectURL()}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                muted
                preload="metadata"
              />
              {/* Rank Badge */}
              <div className={`
                absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-mt-charcoal-400 text-black' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-mt-charcoal-800/80 text-mt-charcoal-300'}
              `}>
                {index + 1}
              </div>
              {/* Duration */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatDuration(Number(video.duration))}
              </div>
            </div>
            <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover/card:text-mt-red-400 transition-colors">
              {video.title}
            </h4>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-mt-charcoal-500">
              <Eye className="w-3 h-3" />
              <span>{formatViewCount(Number(video.viewCount))}</span>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-mt-charcoal-900/90 border border-mt-charcoal-700 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg translate-x-3 hover:bg-mt-red-500 hover:border-mt-red-500"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
