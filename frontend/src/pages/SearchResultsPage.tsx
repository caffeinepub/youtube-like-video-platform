import { useSearch } from '@tanstack/react-router';
import { useSearchVideos } from '../hooks/useSearchVideos';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function SearchResultsPage() {
  // Use strict: false to avoid route type issues with search params
  const searchParams = useSearch({ strict: false }) as { q?: string };
  const query = (searchParams.q ?? '').trim();
  const { data: results = [], isLoading } = useSearchVideos(query);

  if (!query) {
    return (
      <div className="bg-yt-bg min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Search className="w-16 h-16 text-yt-text-secondary" />
        <h2 className="text-xl font-semibold text-white">Search for videos</h2>
        <p className="text-yt-text-secondary text-sm">Enter a search term to find videos</p>
      </div>
    );
  }

  return (
    <div className="bg-yt-bg min-h-screen p-4 lg:p-6">
      {/* Results header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">
          Search results for{' '}
          <span className="text-mt-magenta">"{query}"</span>
        </h1>
        {!isLoading && (
          <p className="text-sm text-yt-text-secondary mt-1">
            {results.length === 0
              ? 'No results found'
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="w-full aspect-video rounded-xl bg-yt-chip" />
              <div className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full bg-yt-chip shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full bg-yt-chip" />
                  <Skeleton className="h-3 w-3/4 bg-yt-chip" />
                  <Skeleton className="h-3 w-1/2 bg-yt-chip" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="w-16 h-16 text-yt-text-secondary mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
          <p className="text-yt-text-secondary text-sm">
            No results found for "{query}". Try different keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {results.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
