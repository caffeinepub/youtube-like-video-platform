import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CommunityPost } from '../backend';

export function useGetCommunityPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<CommunityPost[]>({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getCommunityPosts();
      // Sort newest first
      return [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}
