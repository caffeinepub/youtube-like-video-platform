import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

export function useGetSubscribers(channel: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['subscribers', channel.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubscribers(channel);
    },
    enabled: !!actor && !isFetching,
  });
}
