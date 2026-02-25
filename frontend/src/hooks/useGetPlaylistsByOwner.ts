import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { PlaylistView } from '../backend';

export function useGetPlaylistsByOwner() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', 'owner', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getPlaylistsByOwner(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
