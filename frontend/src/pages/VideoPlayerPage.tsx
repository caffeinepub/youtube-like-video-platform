import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetVideo } from '../hooks/useGetVideo';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useIncrementViewCount } from '../hooks/useIncrementViewCount';
import { useEffect, useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import CommentsSection from '../components/CommentsSection';
import RecommendedVideos from '../components/RecommendedVideos';
import SubscribeButton from '../components/SubscribeButton';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import ShareButton from '../components/ShareButton';
import { formatViewCount, formatTimeAgo } from '../utils/formatters';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { ThumbsUp, ThumbsDown, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';

export default function VideoPlayerPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const navigate = useNavigate();
  const { data: video, isLoading: videoLoading } = useGetVideo(videoId);
  const { data: allVideos = [], isLoading: videosLoading } = useGetAllVideos();
  const { data: uploaderProfile } = useGetUserProfile(video?.uploader);
  const { mutate: incrementViewCount } = useIncrementViewCount();
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (videoId) {
      incrementViewCount(videoId);
    }
  }, [videoId]);

  if (videoLoading) {
    return (
      <div className="bg-yt-bg min-h-screen p-4 lg:p-6">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <Skeleton className="w-full aspect-video rounded-xl bg-yt-chip mb-4" />
            <Skeleton className="h-6 w-3/4 bg-yt-chip mb-2" />
            <Skeleton className="h-4 w-1/2 bg-yt-chip" />
          </div>
          <div className="w-full lg:w-96 shrink-0 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="w-40 aspect-video rounded-lg bg-yt-chip shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full bg-yt-chip" />
                  <Skeleton className="h-3 w-3/4 bg-yt-chip" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-yt-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Video not found</h2>
          <button onClick={() => navigate({ to: '/' })} className="text-blue-400 hover:underline">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const channelName = uploaderProfile?.name || 'Unknown Channel';
  const handle = uploaderProfile?.handle ? `@${uploaderProfile.handle}` : '';
  const initials = getInitials(channelName);
  // convertBlobToDataURL is synchronous
  const avatarUrl = uploaderProfile?.avatar
    ? convertBlobToDataURL(uploaderProfile.avatar)
    : null;
  const viewCount = typeof video.viewCount === 'bigint' ? Number(video.viewCount) : video.viewCount;
  const uploadDate = typeof video.uploadDate === 'bigint' ? Number(video.uploadDate) : video.uploadDate;

  const channelLinkProps = {
    to: '/channel/$principalId' as const,
    params: { principalId: video.uploader.toString() },
  };

  return (
    <div className="bg-yt-bg min-h-screen">
      <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 lg:p-6">
        {/* Left Column: Player + Info */}
        <div className="flex-1 min-w-0">
          {/* Video Player — pass the full video object as required by VideoPlayer */}
          <div className="w-full aspect-video bg-black lg:rounded-xl overflow-hidden">
            <VideoPlayer video={video} />
          </div>

          {/* Video Info */}
          <div className="px-4 lg:px-0 py-4">
            <h1 className="text-lg font-semibold text-white leading-snug mb-2">{video.title}</h1>

            {/* Stats + Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-yt-text-secondary">
                {formatViewCount(viewCount)} views • {formatTimeAgo(uploadDate)}
              </p>
              <div className="flex items-center gap-2">
                {/* Like/Dislike */}
                <div className="flex items-center bg-yt-chip rounded-full overflow-hidden">
                  <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-yt-chip-hover transition-colors text-sm text-white">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Like</span>
                  </button>
                  <div className="w-px h-5 bg-yt-border" />
                  <button className="flex items-center px-3 py-2 hover:bg-yt-chip-hover transition-colors">
                    <ThumbsDown className="w-4 h-4 text-white" />
                  </button>
                </div>
                <ShareButton videoId={videoId} iconOnly={false} />
                <AddToPlaylistButton videoId={videoId} />
                <button className="flex items-center justify-center w-9 h-9 bg-yt-chip rounded-full hover:bg-yt-chip-hover transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between gap-4 p-3 bg-yt-chip rounded-xl mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Link {...channelLinkProps}>
                  <div className="w-10 h-10 rounded-full bg-yt-surface flex items-center justify-center overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={channelName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{initials}</span>
                    )}
                  </div>
                </Link>
                <div className="min-w-0">
                  <Link {...channelLinkProps}>
                    <p className="text-sm font-semibold text-white hover:text-yt-text-secondary transition-colors truncate">
                      {channelName}
                    </p>
                  </Link>
                  {handle && <p className="text-xs text-yt-text-secondary">{handle}</p>}
                </div>
              </div>
              <SubscribeButton channelPrincipal={video.uploader} />
            </div>

            {/* Description */}
            {video.description && (
              <div className="bg-yt-chip rounded-xl p-3 mb-4">
                <p
                  className={`text-sm text-white whitespace-pre-wrap ${
                    !descExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {video.description}
                </p>
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="flex items-center gap-1 text-xs text-yt-text-secondary mt-2 hover:text-white transition-colors"
                >
                  {descExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Show more
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Comments */}
            <CommentsSection videoId={videoId} />
          </div>
        </div>

        {/* Right Column: Recommended */}
        <div className="w-full lg:w-96 xl:w-[400px] shrink-0 px-4 lg:px-0 pb-6">
          <RecommendedVideos
            videos={allVideos}
            isLoading={videosLoading}
            currentVideoId={videoId}
          />
        </div>
      </div>
    </div>
  );
}
