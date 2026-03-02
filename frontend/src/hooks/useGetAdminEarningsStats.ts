import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { PlatformEarningsStats } from '../backend';

export function useGetAdminEarningsStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlatformEarningsStats>({
    queryKey: ['adminEarningsStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminGetEarningsStats();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}
