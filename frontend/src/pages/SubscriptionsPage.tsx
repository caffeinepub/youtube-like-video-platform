import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { Principal } from '@dfinity/principal';
import type { VideoMetadata } from '../backend';

export default function SubscriptionsPage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;
  const { actor } = useActor();

  const { data: subscriptionVideos = [], isLoading } = useQuery<VideoMetadata[]>({
    queryKey: ['subscriptionVideos', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal() as unknown as Principal;
      const subscriptions = await actor.getUserSubscriptions(principal);
      const videoArrays = await Promise.all(
        subscriptions.map((channel) => actor.getChannelVideos(channel as unknown as Principal))
      );
      return videoArrays.flat().sort((a, b) => Number(b.uploadDate - a.uploadDate));
    },
    enabled: !!actor && !!identity,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign in to see subscriptions</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Subscribe to channels to see their latest videos here.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (subscriptionVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No subscription videos yet</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Subscribe to channels to see their latest videos here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subscriptionVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
