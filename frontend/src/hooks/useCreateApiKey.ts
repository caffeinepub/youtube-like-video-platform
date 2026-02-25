import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useCreateApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (apiLabel: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createApiKey(apiLabel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
}
