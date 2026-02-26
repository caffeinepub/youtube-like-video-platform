import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

interface CreatePostParams {
  body: string;
  attachment: ExternalBlob | null;
}

export function useCreateCommunityPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ body, attachment }: CreatePostParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCommunityPost(body, attachment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      toast.success('Post created!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}
