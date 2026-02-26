import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

export function useSubscribeToChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.subscribeToChannel(channel);
      } catch (error: unknown) {
        const err = error as Error;
        // Re-throw with a cleaner message
        throw new Error(err?.message || 'Failed to subscribe');
      }
    },
    onSuccess: (_, channel) => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', channel.toString()] });
    },
    onError: (error: unknown) => {
      console.error('Subscribe error:', error);
    },
  });
}

export function useUnsubscribeFromChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.unsubscribeFromChannel(channel);
      } catch (error: unknown) {
        const err = error as Error;
        throw new Error(err?.message || 'Failed to unsubscribe');
      }
    },
    onSuccess: (_, channel) => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', channel.toString()] });
    },
    onError: (error: unknown) => {
      console.error('Unsubscribe error:', error);
    },
  });
}
