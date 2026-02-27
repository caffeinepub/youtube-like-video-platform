import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amountCents: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestWithdrawal(amountCents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatorBankAccountState'] });
      toast.success('Withdrawal request submitted successfully!');
    },
    onError: (error: Error) => {
      const msg = error.message || 'Failed to submit withdrawal request.';
      if (msg.includes('Invalid withdrawal amount')) {
        toast.error('Invalid amount. Please check your balance.');
      } else if (msg.includes('Existing pending withdrawal')) {
        toast.error('You already have a pending withdrawal request.');
      } else {
        toast.error(msg);
      }
    },
  });
}
