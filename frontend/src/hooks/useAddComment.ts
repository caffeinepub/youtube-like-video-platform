import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

interface AddCommentParams {
  videoId: string;
  content: string;
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, content }: AddCommentParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(videoId, content);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
    },
  });
}
