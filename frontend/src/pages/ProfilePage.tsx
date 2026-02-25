import { useParams } from '@tanstack/react-router';
import { Principal } from '@dfinity/principal';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useGetChannelVideos } from '../hooks/useGetChannelVideos';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import VideoCard from '../components/VideoCard';
import SubscribeButton from '../components/SubscribeButton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';
import { useMemo } from 'react';

export default function ProfilePage() {
  const { principalId } = useParams({ from: '/profile/$principalId' });
  
  const channelPrincipal = useMemo(() => {
    try {
      return Principal.fromText(principalId);
    } catch (error) {
      return null;
    }
  }, [principalId]);

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(channelPrincipal || undefined);
  const { data: videos, isLoading: videosLoading } = useGetChannelVideos(channelPrincipal || Principal.anonymous());
  const { data: subscribers } = useGetSubscribers(channelPrincipal || Principal.anonymous());

  if (!channelPrincipal) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Invalid profile ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-gradient-to-br from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] text-white text-3xl">
                {profile.name[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                {profile.channelDescription && (
                  <p className="text-muted-foreground">{profile.channelDescription}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold">{subscribers?.length || 0}</span>
                  <span className="text-muted-foreground"> subscribers</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{videos?.length || 0}</span>
                  <span className="text-muted-foreground"> videos</span>
                </div>
              </div>
              
              <SubscribeButton channelPrincipal={channelPrincipal} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Video className="w-6 h-6" />
          Uploaded Videos
        </h2>
        
        {videosLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No videos uploaded yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
