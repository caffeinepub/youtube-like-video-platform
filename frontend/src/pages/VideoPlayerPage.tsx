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
  const { data: video, isLoading } = useGetVideo(videoId);
  const { data: allVideos = [], isLoading: videosLoading } = useGetAllVideos();
  const { mutate: incrementViewCount } = useIncrementViewCount();

  // video.uploader is a Principal — pass it directly (undefined-safe)
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="w-full aspect-video rounded-xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Video not found.</p>
      </div>
    );
  }

  const uploaderName = uploaderProfile?.name || video.uploader.toString().slice(0, 8) + '...';
  const uploaderHandle = uploaderProfile?.handle || '';

  // Use the correct route param name: principalId (matches /channel/$principalId in App.tsx)
  const channelLinkProps = {
    to: '/channel/$principalId' as const,
    params: { principalId: video.uploader.toString() },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className={`flex gap-6 ${theatreMode ? 'flex-col' : 'flex-col lg:flex-row'}`}>
        {/* Main content */}
        <div className={theatreMode ? 'w-full' : 'flex-1 min-w-0'}>
          {/* Video Player */}
          <div className="relative">
            <VideoPlayer video={video} chapters={chapters} />
            {/* Theatre mode toggle */}
            <button
              onClick={() => setTheatreMode((v) => !v)}
              className="absolute bottom-14 right-14 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 rounded flex items-center justify-center transition-colors"
              title={theatreMode ? 'Exit theatre mode' : 'Theatre mode'}
            >
              {theatreMode ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl font-bold text-foreground leading-tight">{video.title}</h1>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-3">
                {/* Uploader avatar */}
                <Link {...channelLinkProps} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border border-border">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={uploaderName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {uploaderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{uploaderName}</p>
                    {uploaderHandle && (
                      <p className="text-xs text-muted-foreground">@{uploaderHandle}</p>
                    )}
                  </div>
                </Link>
                {/* SubscribeButton expects channelPrincipal: Principal */}
                <SubscribeButton channelPrincipal={video.uploader as Principal} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ThumbsDown className="w-4 h-4" />
                </Button>
                <ShareButton videoId={video.id} iconOnly={false} />
                <AddToPlaylistButton videoId={video.id} />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 text-sm text-muted-foreground flex gap-3">
              <span>{formatViewCount(Number(video.viewCount))} views</span>
              <span>•</span>
              <span>{formatTimeAgo(Number(video.uploadDate))}</span>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="mt-6">
            <CommentsSection videoId={video.id} />
          </div>
        </div>

        {/* Sidebar - hidden in theatre mode; pass required videos prop */}
        {!theatreMode && (
          <div className="w-full lg:w-80 shrink-0">
            <RecommendedVideos
              videos={allVideos}
              isLoading={videosLoading}
              currentVideoId={video.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
