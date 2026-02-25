import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VideoMetadata } from '../backend';

export function useGetVideo(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<VideoMetadata | null>({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}
