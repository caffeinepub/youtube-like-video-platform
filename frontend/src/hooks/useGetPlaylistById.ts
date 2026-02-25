import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PlaylistView } from '../backend';

export function useGetPlaylistById(playlistId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView | null>({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      if (!actor || !playlistId) return null;
      return actor.getPlaylistById(playlistId);
    },
    enabled: !!actor && !isFetching && !!playlistId,
  });
}
