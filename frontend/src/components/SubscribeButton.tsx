import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSubscribeToChannel, useUnsubscribeFromChannel } from '../hooks/useSubscribeToChannel';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  channelPrincipal: Principal;
  compact?: boolean;
}

export default function SubscribeButton({ channelPrincipal, compact = false }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: subscribers = [] } = useGetSubscribers(channelPrincipal);
  const { mutate: subscribe, isPending: isSubscribing } = useSubscribeToChannel();
  const { mutate: unsubscribe, isPending: isUnsubscribing } = useUnsubscribeFromChannel();

  const isSubscribed =
    isAuthenticated && identity
      ? subscribers.some((s) => s.toString() === identity.getPrincipal().toString())
      : false;

  const isPending = isSubscribing || isUnsubscribing;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (isSubscribed) {
      unsubscribe(channelPrincipal, {
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.error('Failed to unsubscribe: ' + message);
        },
      });
    } else {
      subscribe(channelPrincipal, {
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.error('Failed to subscribe: ' + message);
        },
      });
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
          isSubscribed
            ? 'bg-yt-chip text-white hover:bg-yt-chip-hover'
            : 'bg-mt-magenta text-white hover:bg-mt-purple'
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isSubscribed ? (
          'Subscribed'
        ) : (
          'Subscribe'
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors disabled:opacity-50 ${
        isSubscribed
          ? 'bg-yt-chip text-white hover:bg-yt-chip-hover'
          : 'bg-mt-magenta text-white hover:bg-mt-purple'
      }`}
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      {isSubscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}
