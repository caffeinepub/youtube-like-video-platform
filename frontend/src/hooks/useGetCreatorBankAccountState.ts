import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { AccountState } from '../backend';

export function useGetCreatorBankAccountState() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AccountState>({
    queryKey: ['creatorBankAccountState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCreatorBankAccountState();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
