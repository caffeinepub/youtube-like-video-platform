import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

export function useSubscribeToChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.subscribeToChannel(channel);
    },
    onSuccess: (_, channel) => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', channel.toString()] });
    },
  });
}
