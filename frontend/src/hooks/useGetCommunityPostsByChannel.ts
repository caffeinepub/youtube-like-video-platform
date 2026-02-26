import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';
import type { CommunityPost } from '../backend';

export function useGetCommunityPostsByChannel(channel: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<CommunityPost[]>({
    queryKey: ['communityPostsByChannel', channel?.toString()],
    queryFn: async () => {
      if (!actor || !channel) return [];
      const posts = await actor.getCommunityPostsByChannel(channel);
      return [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching && !!channel,
  });
}
