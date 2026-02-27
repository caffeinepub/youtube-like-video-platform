import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useGetCommentCount(videoId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<number>({
    queryKey: ['commentCount', videoId],
    queryFn: async () => {
      if (!actor || !videoId) return 0;
      const count = await actor.getCommentCount(videoId);
      return Number(count);
    },
    enabled: !!actor && !actorFetching && !!videoId,
  });
}
