import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useSetProfileImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageBytes: Uint8Array): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      // Fetch current profile and update with new avatar
      const currentProfile = await actor.getCallerUserProfile();
      if (!currentProfile) throw new Error('Profile not found. Please set up your profile first.');
      const updatedProfile = {
        ...currentProfile,
        avatar: imageBytes,
      };
      return actor.saveCallerUserProfile(updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile image updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile image');
    },
  });
}
