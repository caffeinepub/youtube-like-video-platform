import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ApiKey } from '../backend';

export function useGetApiKeys() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApiKeys();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}
