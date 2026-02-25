import React from 'react';
import { useSubscribeToChannel } from '../hooks/useSubscribeToChannel';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Loader2, Bell } from 'lucide-react';
import type { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface SubscribeButtonProps {
  channelPrincipal: Principal;
}

export default function SubscribeButton({ channelPrincipal }: SubscribeButtonProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;

  const { data: subscribers = [] } = useGetSubscribers(channelPrincipal);
  const { mutate: subscribe, isPending } = useSubscribeToChannel();

  // Don't show subscribe button for own channel (II users)
  const isOwnChannel =
    isIIAuthenticated && identity?.getPrincipal().toString() === channelPrincipal.toString();

  const isSubscribed = isIIAuthenticated
    ? subscribers.some((sub) => sub.toString() === identity?.getPrincipal().toString())
    : false;

  const subscriberCount = subscribers.length;

  if (isOwnChannel) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="w-4 h-4" />
        <span>
          {subscriberCount} {subscriberCount !== 1 ? t('subscribers') : t('subscriber')}
        </span>
      </div>
    );
  }

  const handleSubscribe = () => {
    if (!isIIAuthenticated) {
      if (isGoogleAuthenticated) {
        toast.info(t('connectToSubscribe'));
      } else {
        toast.info(t('loginToSubscribe'));
      }
      return;
    }

    if (isSubscribed) {
      toast.info(t('alreadySubscribed'));
      return;
    }

    subscribe(channelPrincipal, {
      onSuccess: () => {
        toast.success(t('subscribedSuccess'));
      },
      onError: (error: unknown) => {
        const err = error as Error;
        if (err?.message?.includes('Already subscribed')) {
          toast.info(t('alreadySubscribedError'));
        } else {
          toast.error(t('failedToSubscribe'));
        }
      },
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSubscribe}
        disabled={isPending || isSubscribed}
        className={[
          'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed',
          isSubscribed
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
        ].join(' ')}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('subscribing')}
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            {isSubscribed ? t('subscribed') : t('subscribe')}
          </>
        )}
      </button>
      <span className="text-sm text-muted-foreground">
        {subscriberCount} {subscriberCount !== 1 ? t('subscribers') : t('subscriber')}
      </span>
    </div>
  );
}
