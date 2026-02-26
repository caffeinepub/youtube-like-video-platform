import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { MonetizationStats } from '../backend';

export function useGetMonetizationStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MonetizationStats>({
    queryKey: ['monetizationStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMonetizationStats();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
