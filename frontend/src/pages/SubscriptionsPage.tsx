import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { VideoMetadata } from '../backend';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';
import { Tv2 } from 'lucide-react';
import type { Principal } from '@dfinity/principal';

function useGetUserSubscriptions() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['userSubscriptions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserSubscriptions(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

function useGetChannelVideosLocal(channel: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['channelVideos', channel?.toString()],
    queryFn: async () => {
      if (!actor || !channel) return [];
      return actor.getChannelVideos(channel);
    },
    enabled: !!actor && !actorFetching && !!channel,
  });
}

function SubscriptionChannelVideos({ channel }: { channel: Principal }) {
  const { data: videos = [] } = useGetChannelVideosLocal(channel);
  return (
    <>
      {videos
        .filter((v) => !v.isShort)
        .map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
    </>
  );
}

export default function SubscriptionsPage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: subscriptions = [], isLoading } = useGetUserSubscriptions();

  if (!isAuthenticated) {
    return (
      <div className="bg-yt-bg min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Tv2 className="w-16 h-16 text-yt-text-secondary" />
        <h2 className="text-xl font-semibold text-white">Sign in to see your subscriptions</h2>
        <p className="text-yt-text-secondary text-sm text-center max-w-sm">
          Keep up with your favourite channels by signing in.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-yt-bg min-h-screen p-4">
        <h1 className="text-xl font-semibold text-white mb-6">Subscriptions</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="w-full aspect-video rounded-xl bg-yt-chip" />
              <div className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full bg-yt-chip shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full bg-yt-chip" />
                  <Skeleton className="h-3 w-3/4 bg-yt-chip" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-yt-bg min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Tv2 className="w-16 h-16 text-yt-text-secondary" />
        <h2 className="text-xl font-semibold text-white">No subscriptions yet</h2>
        <p className="text-yt-text-secondary text-sm text-center max-w-sm">
          Subscribe to channels to see their latest videos here.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Discover Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-yt-bg min-h-screen p-4">
      <h1 className="text-xl font-semibold text-white mb-6">Subscriptions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {subscriptions.map((channel) => (
          <SubscriptionChannelVideos key={channel.toString()} channel={channel} />
        ))}
      </div>
    </div>
  );
}
