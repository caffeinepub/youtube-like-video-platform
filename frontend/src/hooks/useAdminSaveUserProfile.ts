import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { UserProfile } from '../backend';
import type { Principal } from '@dfinity/principal';

export function useAdminSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profile, user }: { profile: UserProfile; user: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminSaveUserProfile(profile, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      toast.success('User profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save user profile: ${error.message}`);
    },
  });
}
