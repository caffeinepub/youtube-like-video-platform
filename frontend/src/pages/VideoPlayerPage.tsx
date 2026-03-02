import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetVideo } from '../hooks/useGetVideo';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import { useIncrementViewCount } from '../hooks/useIncrementViewCount';
import VideoPlayer from '../components/VideoPlayer';
import CommentsSection from '../components/CommentsSection';
import RecommendedVideos from '../components/RecommendedVideos';
import SubscribeButton from '../components/SubscribeButton';
import ShareButton from '../components/ShareButton';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { formatViewCount, formatTimeAgo } from '../utils/formatters';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';
import { ThumbsUp, ThumbsDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Principal } from '@dfinity/principal';

interface Chapter {
  time: number;
  title: string;
}

function parseChapters(description: string): Chapter[] {
  const lines = description.split('\n');
  const chapters: Chapter[] = [];
  const pattern = /^(\d{1,2}):(\d{2})\s+(.+)$/;
  for (const line of lines) {
    const match = line.trim().match(pattern);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const title = match[3].trim();
      chapters.push({ time: minutes * 60 + seconds, title });
    }
  }
  return chapters;
}

export default function VideoPlayerPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const isOnline = useNetworkStatus();
  const { data: video, isLoading, refetch: refetchVideo } = useGetVideo(videoId);
  const { data: allVideos = [], isLoading: videosLoading, refetch: refetchAllVideos } = useGetAllVideos();
  const { mutate: incrementViewCount } = useIncrementViewCount();

  const uploaderPrincipal = video?.uploader as Principal | undefined;
  const { data: uploaderProfile } = useGetUserProfile(uploaderPrincipal);

  const [theatreMode, setTheatreMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (video) {
      incrementViewCount(video.id);
    }
  }, [video?.id]);

  useEffect(() => {
    if (uploaderProfile?.avatar) {
      const url = convertBlobToDataURL(uploaderProfile.avatar);
      setAvatarUrl(url);
    }
  }, [uploaderProfile]);

  const chapters = useMemo(() => {
    if (!video?.description) return [];
    return parseChapters(video.description);
  }, [video?.description]);

  const handleRetry = () => {
    refetchVideo();
    refetchAllVideos();
  };

  if (isLoading && !isOnline) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <OfflineErrorState
          onRetry={handleRetry}
          message="Unable to load video. Please check your internet connection."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="w-full aspect-video rounded-xl mb-4 bg-mt-charcoal-800" />
        <Skeleton className="h-8 w-3/4 mb-2 bg-mt-charcoal-800" />
        <Skeleton className="h-4 w-1/2 bg-mt-charcoal-800" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        {!isOnline ? (
          <OfflineErrorState
            onRetry={handleRetry}
            message="Unable to load video. Please check your internet connection."
          />
        ) : (
          <p className="text-mt-charcoal-400">Video not found.</p>
        )}
      </div>
    );
  }

  const uploaderName = uploaderProfile?.name || video.uploader.toString().slice(0, 8) + '...';
  const uploaderHandle = uploaderProfile?.handle || '';

  const channelLinkProps = {
    to: '/channel/$principalId' as const,
    params: { principalId: video.uploader.toString() },
  };

  const viewCount = Number(video.viewCount);
  const uploadDate = Number(video.uploadDate) / 1_000_000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className={`flex gap-6 ${theatreMode ? 'flex-col' : 'flex-col xl:flex-row'}`}>
        {/* Main content */}
        <div className={theatreMode ? 'w-full' : 'flex-1 min-w-0'}>
          {/* Video Player — pass video object and chapters as expected by VideoPlayer */}
          <div className="rounded-xl overflow-hidden mb-4 bg-black">
            <VideoPlayer video={video} chapters={chapters} />
          </div>

          {/* Video Info */}
          <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 mb-4 shadow-card">
            <h1 className="text-xl font-display font-bold text-foreground mb-3">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Channel info */}
              <div className="flex items-center gap-3">
                <Link {...channelLinkProps}>
                  <div className="w-10 h-10 rounded-full bg-mt-charcoal-700 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={uploaderName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {uploaderName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link {...channelLinkProps}>
                    <p className="font-semibold text-foreground hover:text-mt-red-400 transition-colors">
                      {uploaderName}
                    </p>
                  </Link>
                  {uploaderHandle && (
                    <p className="text-xs text-mt-charcoal-400">@{uploaderHandle}</p>
                  )}
                </div>
                {uploaderPrincipal && (
                  <SubscribeButton channelPrincipal={uploaderPrincipal} />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 rounded-full"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 rounded-full"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
                <ShareButton videoId={video.id} />
                <AddToPlaylistButton videoId={video.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheatreMode(!theatreMode)}
                  className="text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800 rounded-full"
                  title={theatreMode ? 'Exit theatre mode' : 'Theatre mode'}
                >
                  {theatreMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-mt-charcoal-800 text-sm text-mt-charcoal-400">
              <span>{formatViewCount(viewCount)} views</span>
              <span>•</span>
              <span>{formatTimeAgo(uploadDate)}</span>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-3 pt-3 border-t border-mt-charcoal-800">
                <p className="text-sm text-mt-charcoal-300 whitespace-pre-wrap leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </div>

          {/* Comments */}
          <CommentsSection videoId={video.id} />
        </div>

        {/* Sidebar: Recommended */}
        {!theatreMode && (
          <div className="xl:w-80 shrink-0">
            <h3 className="text-sm font-display font-bold text-foreground mb-3">Up Next</h3>
            <RecommendedVideos currentVideoId={video.id} />
          </div>
        )}
      </div>
    </div>
  );
}
