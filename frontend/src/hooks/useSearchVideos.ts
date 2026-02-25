import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VideoMetadata } from '../backend';

export function useSearchVideos(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['searchVideos', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm.trim()) return [];
      return actor.searchVideos(searchTerm.trim());
    },
    enabled: !!actor && !actorFetching && searchTerm.trim().length > 0,
  });
}
