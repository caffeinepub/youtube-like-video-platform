import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscribeToChannel } from '../hooks/useSubscribeToChannel';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface SubscribeButtonProps {
  channelPrincipal: Principal;
}

export default function SubscribeButton({ channelPrincipal }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const { data: subscribers } = useGetSubscribers(channelPrincipal);
  const { mutate: subscribe, isPending } = useSubscribeToChannel();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isAuthenticated = !!identity;
  const isOwnChannel = isAuthenticated && identity.getPrincipal().toString() === channelPrincipal.toString();

  useEffect(() => {
    if (subscribers && identity) {
      const userPrincipal = identity.getPrincipal().toString();
      setIsSubscribed(subscribers.some(sub => sub.toString() === userPrincipal));
    }
  }, [subscribers, identity]);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to subscribe');
      return;
    }

    subscribe(channelPrincipal, {
      onSuccess: () => {
        setIsSubscribed(true);
        toast.success('Subscribed successfully!');
      },
      onError: (error) => {
        toast.error('Failed to subscribe: ' + error.message);
      },
    });
  };

  if (isOwnChannel) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleSubscribe}
        disabled={isPending || isSubscribed || !isAuthenticated}
        className="gap-2"
        variant={isSubscribed ? 'outline' : 'default'}
      >
        {isSubscribed ? (
          <>
            <UserCheck className="w-4 h-4" />
            Subscribed
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Subscribe
          </>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {subscribers?.length || 0} subscribers
      </span>
    </div>
  );
}
