import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useDeleteCommunityPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCommunityPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['communityPostsByChannel'] });
      toast.success('Post deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}
