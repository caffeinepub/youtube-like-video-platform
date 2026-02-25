import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VideoMetadata } from '../backend';

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['trendingVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingVideos();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: false,
  });
}
