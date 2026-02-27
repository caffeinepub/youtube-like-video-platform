import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { VideoMetadata } from '../backend';

export function useGetSubscribedReels() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<VideoMetadata[]>({
    queryKey: ['subscribedReels'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getSubscribedShorts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}
