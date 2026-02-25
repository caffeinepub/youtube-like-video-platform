import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { TrendingUp, Eye, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetTrendingVideos } from '../hooks/useGetTrendingVideos';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';

export default function TrendingVideos() {
  const { data: videos, isLoading } = useGetTrendingVideos();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  // Only show non-short videos in trending
  const trendingVideos = videos?.filter((v) => !v.isShort).slice(0, 10) ?? [];

  if (!isLoading && trendingVideos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary">
            <Flame className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Trending</h2>
          <Badge variant="secondary" className="text-xs font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            This Week
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-64 space-y-2">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : trendingVideos.map((video, index) => {
              const videoUrl = video.videoFile.getDirectURL();
              return (
                <Link
                  key={video.id}
                  to="/video/$videoId"
                  params={{ videoId: video.id }}
                  className="flex-none w-64 group"
                >
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                    />
                    {/* Rank badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(Number(video.duration))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span>{formatViewCount(Number(video.viewCount))} views</span>
                      <span>•</span>
                      <span>{formatTimeAgo(Number(video.uploadDate))}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
