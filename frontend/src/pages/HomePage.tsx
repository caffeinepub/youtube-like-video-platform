import { useGetAllVideos } from '../hooks/useGetAllVideos';
import VideoCard from '../components/VideoCard';
import RecommendedVideos from '../components/RecommendedVideos';
import TrendingVideos from '../components/TrendingVideos';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const { data: videos, isLoading } = useGetAllVideos();

  return (
    <div className="container py-8 space-y-10">
      {/* Trending Section */}
      <TrendingVideos />

      <Separator className="opacity-40" />

      {/* All Videos Section */}
      <section>
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] bg-clip-text text-transparent">
          All Videos
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos yet. Be the first to upload!</p>
          </div>
        )}
      </section>

      {videos && videos.length > 0 && (
        <section>
          <RecommendedVideos limit={4} />
        </section>
      )}
    </div>
  );
}
