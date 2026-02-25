import React from 'react';
import { useSearch } from '@tanstack/react-router';
import { useSearchVideos } from '../hooks/useSearchVideos';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

export default function SearchResultsPage() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  // Read query param
  const search = useSearch({ strict: false }) as { q?: string };
  const query = (search.q ?? '').trim();

  const { data: videos = [], isLoading } = useSearchVideos(query);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">{t('searchResults')}</h1>
        </div>
        {query && (
          <p className="text-muted-foreground text-sm">
            {t('searchResultsFor')}{' '}
            <span className="font-semibold text-foreground">"{query}"</span>
          </p>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && videos.length === 0 && query && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <SearchX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('noResultsFound')}</h2>
          <p className="text-muted-foreground max-w-sm">{t('noResultsMessage')}</p>
        </div>
      )}

      {/* No query state */}
      {!isLoading && !query && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('search')}</h2>
          <p className="text-muted-foreground max-w-sm">{t('searchPlaceholder')}</p>
        </div>
      )}
    </div>
  );
}
