import React from 'react';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';

export default function ShortsPage() {
  const isOnline = useNetworkStatus();
  const { data: allVideos = [], isLoading, refetch } = useGetAllVideos();
  const shorts = allVideos.filter((v) => v.isShort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shorts</h1>
          <p className="text-sm text-muted-foreground">Quick videos under 60 seconds</p>
        </div>
      </div>

      {/* Offline + loading state */}
      {!isOnline && isLoading && (
        <OfflineErrorState
          onRetry={() => refetch()}
          message="Unable to load shorts. Please check your internet connection."
        />
      )}

      {/* Loading state */}
      {isOnline && isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[9/16] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Offline + no data */}
      {!isOnline && !isLoading && shorts.length === 0 && (
        <OfflineErrorState
          onRetry={() => refetch()}
          message="Unable to load shorts. Please check your internet connection."
        />
      )}

      {/* Empty state */}
      {isOnline && !isLoading && shorts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No Shorts Available Yet</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Short videos will appear here once creators start uploading them.
          </p>
        </div>
      )}

      {/* Shorts grid */}
      {!isLoading && shorts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {shorts.map((video) => (
            <VideoCard key={video.id} video={video} linkToReels={true} />
          ))}
        </div>
      )}
    </div>
  );
}
