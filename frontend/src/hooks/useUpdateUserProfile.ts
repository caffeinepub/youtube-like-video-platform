import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

interface UpdateProfileParams {
  name: string;
  channelDescription: string;
  handle: string;
  avatar: Uint8Array | null;
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, channelDescription, handle, avatar }: UpdateProfileParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserProfile(name, channelDescription, handle, avatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
