import { Link } from '@tanstack/react-router';
import { VideoMetadata } from '../backend';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedVideoItemProps {
  video: VideoMetadata;
}

function RecommendedVideoItem({ video }: RecommendedVideoItemProps) {
  const { data: uploaderProfile } = useGetUserProfile(video.uploader);
  const channelName = uploaderProfile?.name || 'Unknown Channel';
  const thumbnailUrl = video.videoFile?.getDirectURL?.() || '';
  const duration = typeof video.duration === 'bigint' ? Number(video.duration) : video.duration;
  const viewCount = typeof video.viewCount === 'bigint' ? Number(video.viewCount) : video.viewCount;
  const uploadDate = typeof video.uploadDate === 'bigint' ? Number(video.uploadDate) : video.uploadDate;

  return (
    <Link
      to="/video/$videoId"
      params={{ videoId: video.id }}
      className="flex gap-2 group hover:bg-yt-chip rounded-xl p-1 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative w-40 aspect-video bg-yt-chip rounded-lg overflow-hidden shrink-0">
        {thumbnailUrl ? (
          <video
            src={thumbnailUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full bg-yt-chip" />
        )}
        {duration > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-medium">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium text-white line-clamp-2 leading-snug mb-1">
          {video.title}
        </h4>
        <p className="text-[11px] text-yt-text-secondary">{channelName}</p>
        <p className="text-[11px] text-yt-text-secondary">
          {formatViewCount(viewCount)} views • {formatTimeAgo(uploadDate)}
        </p>
      </div>
    </Link>
  );
}

interface RecommendedVideosProps {
  videos: VideoMetadata[];
  isLoading?: boolean;
  currentVideoId?: string;
}

export default function RecommendedVideos({ videos, isLoading, currentVideoId }: RecommendedVideosProps) {
  const filtered = videos.filter((v) => v.id !== currentVideoId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="w-40 aspect-video rounded-lg bg-yt-chip shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full bg-yt-chip" />
              <Skeleton className="h-3 w-3/4 bg-yt-chip" />
              <Skeleton className="h-3 w-1/2 bg-yt-chip" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-yt-text-secondary text-sm">
        No recommended videos
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-3">Up next</h3>
      {filtered.map((video) => (
        <RecommendedVideoItem key={video.id} video={video} />
      ))}
    </div>
  );
}
