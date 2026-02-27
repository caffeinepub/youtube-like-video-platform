import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CommunityPostComposer from '../components/CommunityPostComposer';
import CommunityPostCard from '../components/CommunityPostCard';
import { useGetCommunityPosts } from '../hooks/useGetCommunityPosts';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';

export default function CommunityPage() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);
  const isOnline = useNetworkStatus();

  const { data: posts, isLoading, refetch } = useGetCommunityPosts();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('community')}</h1>
      </div>

      {/* Composer */}
      <CommunityPostComposer />

      {/* Feed */}
      <div className="space-y-4">
        {!isOnline && isLoading ? (
          <OfflineErrorState
            onRetry={() => refetch()}
            message="Unable to load community posts. Please check your internet connection."
          />
        ) : isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </>
        ) : !isOnline && (!posts || posts.length === 0) ? (
          <OfflineErrorState
            onRetry={() => refetch()}
            message="Unable to load community posts. Please check your internet connection."
          />
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('noCommunityPosts')}</p>
            <p className="text-sm mt-1">Be the first to share something with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
