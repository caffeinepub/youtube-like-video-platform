import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VideoMetadata } from '../backend';

export function useGetPlaylistVideos(playlistId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['playlistVideos', playlistId],
    queryFn: async () => {
      if (!actor || !playlistId) return [];
      return actor.getPlaylistVideos(playlistId);
    },
    enabled: !!actor && !isFetching && !!playlistId,
  });
}
