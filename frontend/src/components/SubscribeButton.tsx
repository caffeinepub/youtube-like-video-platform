import React from 'react';
import { Principal } from '@dfinity/principal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useSubscribeToChannel, useUnsubscribeFromChannel } from '../hooks/useSubscribeToChannel';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';

interface SubscribeButtonProps {
  channelPrincipal: Principal;
  size?: 'sm' | 'default' | 'lg';
}

export default function SubscribeButton({ channelPrincipal, size = 'sm' }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: subscribers } = useGetSubscribers(channelPrincipal);
  const { mutate: subscribe, isPending: subscribing } = useSubscribeToChannel();
  const { mutate: unsubscribe, isPending: unsubscribing } = useUnsubscribeFromChannel();

  const isSubscribed = subscribers?.some(
    sub => identity && sub.toString() === identity.getPrincipal().toString()
  ) ?? false;

  const isPending = subscribing || unsubscribing;

  if (!isAuthenticated) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubscribed) {
      unsubscribe(channelPrincipal);
    } else {
      subscribe(channelPrincipal);
    }
  };

  return (
    <Button
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={`
        rounded-full font-semibold transition-all duration-200 text-xs
        ${isSubscribed
          ? 'bg-mt-charcoal-700 text-mt-charcoal-200 hover:bg-mt-red-500/20 hover:text-mt-red-400 border border-mt-charcoal-600'
          : 'bg-mt-red-500 hover:bg-mt-red-600 text-white shadow-glow-red-sm border-0'
        }
      `}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isSubscribed ? (
        <><UserCheck className="w-3 h-3 mr-1" />Subscribed</>
      ) : (
        <><UserPlus className="w-3 h-3 mr-1" />Subscribe</>
      )}
    </Button>
  );
}
