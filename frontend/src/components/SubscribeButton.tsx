import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Bell } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useSubscribeToChannel, useUnsubscribeFromChannel } from '../hooks/useSubscribeToChannel';
import type { Principal } from '@dfinity/principal';

interface SubscribeButtonProps {
  channelPrincipal: Principal;
  className?: string;
}

export default function SubscribeButton({ channelPrincipal, className }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: subscribers = [] } = useGetSubscribers(channelPrincipal);
  const { mutate: subscribe, isPending: isSubscribing } = useSubscribeToChannel();
  const { mutate: unsubscribe, isPending: isUnsubscribing } = useUnsubscribeFromChannel();

  const isSubscribed = identity
    ? subscribers.some((s) => s.toString() === identity.getPrincipal().toString())
    : false;

  const isPending = isSubscribing || isUnsubscribing;

  const handleClick = () => {
    if (!isAuthenticated) return;
    if (isSubscribed) {
      unsubscribe(channelPrincipal);
    } else {
      subscribe(channelPrincipal);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full ${className}`}
        disabled
      >
        <Bell className="h-4 w-4 mr-1" />
        Subscribe
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? 'secondary' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-full ${
        isSubscribed
          ? 'bg-muted text-foreground hover:bg-muted/80'
          : 'bg-mt-magenta hover:bg-mt-purple text-white'
      } ${className}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Bell className="h-4 w-4 mr-1" />
          {isSubscribed ? 'Subscribed' : 'Subscribe'}
        </>
      )}
    </Button>
  );
}
