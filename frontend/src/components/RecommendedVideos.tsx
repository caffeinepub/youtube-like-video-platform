import { useGetAllVideos } from '../hooks/useGetAllVideos';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import VideoCard from './VideoCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedVideosProps {
  currentVideoId?: string;
  limit?: number;
}

export default function RecommendedVideos({ currentVideoId, limit = 8 }: RecommendedVideosProps) {
  const { identity } = useInternetIdentity();
  const { data: videos, isLoading } = useGetAllVideos();

  const isAuthenticated = !!identity;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  // Filter out current video and sort
  let filteredVideos = videos.filter(v => v.id !== currentVideoId);
  
  // Sort by view count for popular videos
  const sortedVideos = [...filteredVideos].sort((a, b) => Number(b.viewCount) - Number(a.viewCount));
  
  const displayVideos = sortedVideos.slice(0, limit);

  if (displayVideos.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {isAuthenticated ? 'Recommended for you' : 'Popular videos'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
