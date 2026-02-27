import { Link } from '@tanstack/react-router';
import { VideoMetadata } from '../backend';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import SubscribeButton from './SubscribeButton';
import type { Principal } from '@dfinity/principal';

interface VideoCardProps {
  video: VideoMetadata;
  linkToReels?: boolean;
  showSubscribe?: boolean;
  hideChannelInfo?: boolean;
}

function ChannelAvatar({ uploader }: { uploader: Principal }) {
  const { data: profile } = useGetUserProfile(uploader);

  const avatarUrl = profile?.avatar ? convertBlobToDataURL(profile.avatar) : null;
  const initials = getInitials(profile?.name || '?');

  return (
    <div className="w-9 h-9 rounded-full bg-yt-chip flex items-center justify-center shrink-0 overflow-hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-white">{initials}</span>
      )}
    </div>
  );
}

export default function VideoCard({
  video,
  linkToReels = false,
  showSubscribe = false,
  hideChannelInfo = false,
}: VideoCardProps) {
  const { data: uploaderProfile } = useGetUserProfile(video.uploader);
  const channelName = uploaderProfile?.name || 'Unknown Channel';

  const thumbnailUrl = video.videoFile?.getDirectURL?.() || '';
  const duration = typeof video.duration === 'bigint' ? Number(video.duration) : video.duration;
  const viewCount = typeof video.viewCount === 'bigint' ? Number(video.viewCount) : video.viewCount;
  const uploadDate = typeof video.uploadDate === 'bigint' ? Number(video.uploadDate) : video.uploadDate;

  const videoLinkProps = linkToReels
    ? { to: '/reels' as const }
    : { to: '/video/$videoId' as const, params: { videoId: video.id } };

  const channelLinkProps = {
    to: '/channel/$principalId' as const,
    params: { principalId: video.uploader.toString() },
  };

  return (
    <div className="group cursor-pointer">
      <Link {...videoLinkProps} className="block">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-yt-chip rounded-xl overflow-hidden mb-3">
          {thumbnailUrl ? (
            <video
              src={thumbnailUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full bg-yt-chip flex items-center justify-center">
              <span className="text-yt-text-secondary text-sm">No preview</span>
            </div>
          )}
          {/* Duration badge */}
          {duration > 0 && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {formatDuration(duration)}
            </div>
          )}
          {/* Short badge */}
          {video.isShort && (
            <div className="absolute top-1 left-1 bg-yt-red text-white text-xs px-1.5 py-0.5 rounded font-medium">
              Short
            </div>
          )}
        </div>
      </Link>

      {/* Metadata */}
      {!hideChannelInfo ? (
        <div className="flex gap-3">
          <Link {...channelLinkProps} onClick={(e) => e.stopPropagation()}>
            <ChannelAvatar uploader={video.uploader} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link {...videoLinkProps}>
              <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug mb-1 group-hover:text-yt-text-secondary transition-colors">
                {video.title}
              </h3>
            </Link>
            <Link {...channelLinkProps} onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-yt-text-secondary hover:text-white transition-colors">
                {channelName}
              </p>
            </Link>
            <p className="text-xs text-yt-text-secondary">
              {formatViewCount(viewCount)} views • {formatTimeAgo(uploadDate)}
            </p>
            {showSubscribe && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <SubscribeButton channelPrincipal={video.uploader} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <Link {...videoLinkProps}>
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug mb-1 group-hover:text-yt-text-secondary transition-colors">
              {video.title}
            </h3>
          </Link>
          <p className="text-xs text-yt-text-secondary">
            {formatViewCount(viewCount)} views • {formatTimeAgo(uploadDate)}
          </p>
        </div>
      )}
    </div>
  );
}
