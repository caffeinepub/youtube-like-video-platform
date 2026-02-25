import { useParams, Link } from '@tanstack/react-router';
import { useGetVideo } from '../hooks/useGetVideo';
import { useIncrementViewCount } from '../hooks/useIncrementViewCount';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import VideoPlayer from '../components/VideoPlayer';
import CommentsSection from '../components/CommentsSection';
import RecommendedVideos from '../components/RecommendedVideos';
import SubscribeButton from '../components/SubscribeButton';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Calendar } from 'lucide-react';
import { formatViewCount, formatTimeAgo } from '../utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import type { Principal } from '@dfinity/principal';

export default function VideoPlayerPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const { data: video, isLoading } = useGetVideo(videoId);
  const { data: uploaderProfile } = useGetUserProfile(video?.uploader as Principal | undefined);
  const { mutate: incrementView } = useIncrementViewCount();

  const handlePlay = () => {
    incrementView(videoId);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uploaderName = uploaderProfile?.name || 'Unknown';

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer video={video} onPlay={handlePlay} />

          <div>
            <h1 className="text-2xl font-bold mb-3">{video.title}</h1>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border flex-wrap gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg">
                    {uploaderName[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{uploaderName}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(Number(video.viewCount))} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatTimeAgo(Number(video.uploadDate))}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <AddToPlaylistButton videoId={video.id} />
                <SubscribeButton channelPrincipal={video.uploader as Principal} />
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm whitespace-pre-wrap">{video.description}</p>
              </CardContent>
            </Card>
          </div>

          <CommentsSection videoId={video.id} />
        </div>

        <div className="space-y-6">
          <RecommendedVideos currentVideoId={video.id} limit={6} />
        </div>
      </div>
    </div>
  );
}
