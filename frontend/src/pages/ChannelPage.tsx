import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { VideoMetadata, PlaylistView } from '../backend';
import { Principal } from '@dfinity/principal';
import { useState } from 'react';
import VideoCard from '../components/VideoCard';
import SubscribeButton from '../components/SubscribeButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { Link } from '@tanstack/react-router';
import CommunityPostCard from '../components/CommunityPostCard';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';

function useChannelProfile(principalId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ['userProfile', principalId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const principal = Principal.fromText(principalId);
        return actor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

function useChannelVideos(principalId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ['channelVideos', principalId],
    queryFn: async () => {
      if (!actor) return [];
      const principal = Principal.fromText(principalId);
      return actor.getChannelVideos(principal);
    },
    enabled: !!actor && !actorFetching,
  });
}

function useChannelSubscribers(principalId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ['subscribers', principalId],
    queryFn: async () => {
      if (!actor) return [];
      const principal = Principal.fromText(principalId);
      return actor.getSubscribers(principal);
    },
    enabled: !!actor && !actorFetching,
  });
}

function useChannelPlaylists(principalId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', principalId],
    queryFn: async () => {
      if (!actor) return [];
      const principal = Principal.fromText(principalId);
      return actor.getPlaylistsByOwner(principal);
    },
    enabled: !!actor && !actorFetching,
  });
}

function useChannelCommunityPosts(principalId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ['communityPostsByChannel', principalId],
    queryFn: async () => {
      if (!actor) return [];
      const principal = Principal.fromText(principalId);
      return actor.getCommunityPostsByChannel(principal);
    },
    enabled: !!actor && !actorFetching,
  });
}

export default function ChannelPage() {
  const { principalId } = useParams({ from: '/channel/$principalId' });
  const { identity } = useInternetIdentity();
  const isOnline = useNetworkStatus();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useChannelProfile(principalId);
  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos } = useChannelVideos(principalId);
  const { data: subscribers = [] } = useChannelSubscribers(principalId);
  const { data: playlists = [] } = useChannelPlaylists(principalId);
  const { data: communityPosts = [] } = useChannelCommunityPosts(principalId);

  let channelPrincipal: Principal | null = null;
  try {
    channelPrincipal = Principal.fromText(principalId);
  } catch {
    channelPrincipal = null;
  }

  const channelName = profile?.name || 'Unknown Channel';
  const handle = profile?.handle ? `@${profile.handle}` : '';
  const description = profile?.channelDescription || '';
  const initials = getInitials(channelName);
  const avatarUrl = profile?.avatar ? convertBlobToDataURL(profile.avatar) : null;
  const longVideos = videos.filter((v) => !v.isShort);
  const shortVideos = videos.filter((v) => v.isShort);
  const isOwnChannel =
    identity && channelPrincipal
      ? identity.getPrincipal().toString() === principalId
      : false;

  const handleRetry = () => {
    refetchProfile();
    refetchVideos();
  };

  if (profileLoading && !isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <OfflineErrorState
          onRetry={handleRetry}
          message="Unable to load channel. Please check your internet connection."
        />
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-32 sm:h-48 bg-mt-charcoal-800" />
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-end gap-4 -mt-8 mb-6">
            <Skeleton className="w-20 h-20 rounded-full bg-mt-charcoal-800 shrink-0" />
            <div className="flex-1 space-y-2 pb-2">
              <Skeleton className="h-6 w-48 bg-mt-charcoal-800" />
              <Skeleton className="h-4 w-32 bg-mt-charcoal-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel Banner */}
      <div className="w-full h-32 sm:h-48 overflow-hidden bg-mt-charcoal-800">
        <img
          src="/assets/generated/default-channel-banner.dim_1280x200.png"
          alt="Channel banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Channel Header */}
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 py-4">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-mt-charcoal-800 flex items-center justify-center overflow-hidden shrink-0 border-4 border-background -mt-10 sm:-mt-12">
            {avatarUrl ? (
              <img src={avatarUrl} alt={channelName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{channelName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-mt-charcoal-400 mt-1">
              {handle && <span>{handle}</span>}
              <span>•</span>
              <span>{subscribers.length} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
            {description && (
              <p className="text-sm text-mt-charcoal-400 mt-2 line-clamp-2">{description}</p>
            )}
          </div>

          {/* Subscribe / Manage Button */}
          {channelPrincipal && !isOwnChannel && (
            <div className="shrink-0">
              <SubscribeButton channelPrincipal={channelPrincipal} />
            </div>
          )}
          {isOwnChannel && (
            <Link
              to="/profile"
              className="shrink-0 px-4 py-2 bg-mt-charcoal-800 text-foreground rounded-full text-sm font-medium hover:bg-mt-charcoal-700 transition-colors border border-mt-charcoal-700"
            >
              Manage Channel
            </Link>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="mt-2">
          <TabsList className="bg-transparent border-b border-mt-charcoal-800 w-full justify-start rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="videos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-mt-red-500 data-[state=active]:bg-transparent text-mt-charcoal-400 data-[state=active]:text-foreground px-4 py-3 text-sm font-medium"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="shorts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-mt-red-500 data-[state=active]:bg-transparent text-mt-charcoal-400 data-[state=active]:text-foreground px-4 py-3 text-sm font-medium"
            >
              Shorts
            </TabsTrigger>
            <TabsTrigger
              value="playlists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-mt-red-500 data-[state=active]:bg-transparent text-mt-charcoal-400 data-[state=active]:text-foreground px-4 py-3 text-sm font-medium"
            >
              Playlists
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-mt-red-500 data-[state=active]:bg-transparent text-mt-charcoal-400 data-[state=active]:text-foreground px-4 py-3 text-sm font-medium"
            >
              Community
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-video w-full rounded-xl bg-mt-charcoal-800" />
                    <Skeleton className="h-4 w-3/4 bg-mt-charcoal-800" />
                  </div>
                ))}
              </div>
            ) : longVideos.length === 0 ? (
              <p className="text-mt-charcoal-400 text-center py-12">No videos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {longVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Shorts Tab */}
          <TabsContent value="shorts" className="mt-6">
            {shortVideos.length === 0 ? (
              <p className="text-mt-charcoal-400 text-center py-12">No shorts uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {shortVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-6">
            {playlists.length === 0 ? (
              <p className="text-mt-charcoal-400 text-center py-12">No playlists created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to="/playlist/$playlistId"
                    params={{ playlistId: playlist.id }}
                    className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 hover:border-mt-red-500/50 transition-colors shadow-card"
                  >
                    <h3 className="font-semibold text-foreground mb-1">{playlist.title}</h3>
                    <p className="text-sm text-mt-charcoal-400">{playlist.videos.length} videos</p>
                    {playlist.description && (
                      <p className="text-xs text-mt-charcoal-500 mt-1 line-clamp-2">{playlist.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-6">
            {communityPosts.length === 0 ? (
              <p className="text-mt-charcoal-400 text-center py-12">No community posts yet.</p>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {communityPosts.map((post) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
