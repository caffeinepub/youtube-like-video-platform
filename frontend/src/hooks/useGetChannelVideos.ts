import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';
import type { VideoMetadata } from '../backend';

export function useGetChannelVideos(channel: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['channelVideos', channel.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChannelVideos(channel);
    },
    enabled: !!actor && !isFetching,
  });
}
