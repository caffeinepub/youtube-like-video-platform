import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { VideoMetadata } from '../backend';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AddToPlaylistButton from './AddToPlaylistButton';
import { Clock, Eye } from 'lucide-react';

interface VideoCardProps {
  video: VideoMetadata;
  showSubscribe?: boolean;
}

export default function VideoCard({ video, showSubscribe = false }: VideoCardProps) {
  const { data: uploaderProfile } = useGetUserProfile(video.uploader);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    if (uploaderProfile?.avatar) {
      const url = convertBlobToDataURL(uploaderProfile.avatar);
      setAvatarUrl(url);
    }
  }, [uploaderProfile]);

  const channelName = uploaderProfile?.name || video.uploader.toString().slice(0, 8) + '...';
  const channelInitials = channelName.slice(0, 2).toUpperCase();
  const videoUrl = video.videoFile.getDirectURL();
  const uploadDateMs = Number(video.uploadDate) / 1_000_000;

  return (
    <div className="group flex flex-col gap-2">
      {/* Thumbnail */}
      <Link to="/video/$videoId" params={{ videoId: video.id }} className="block">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-mt-charcoal-800 shadow-card group-hover:shadow-card-hover transition-shadow duration-300">
          {!thumbnailError ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              muted
              preload="metadata"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-mt-charcoal-800">
              <div className="text-mt-charcoal-600 text-4xl font-display font-bold">
                {channelInitials}
              </div>
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatDuration(Number(video.duration))}
          </div>

          {/* Short Badge */}
          {video.isShort && (
            <div className="absolute top-2 left-2 bg-mt-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              SHORT
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
      </Link>

      {/* Metadata */}
      <div className="flex gap-2.5 px-0.5">
        <Link
          to="/channel/$principalId"
          params={{ principalId: video.uploader.toString() }}
          className="shrink-0 mt-0.5"
        >
          <Avatar className="w-8 h-8 ring-1 ring-mt-charcoal-700 hover:ring-mt-red-500 transition-all">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={channelName} />}
            <AvatarFallback className="bg-mt-charcoal-700 text-mt-charcoal-300 text-xs font-bold">
              {channelInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link to="/video/$videoId" params={{ videoId: video.id }}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug hover:text-mt-red-400 transition-colors">
              {video.title}
            </h3>
          </Link>
          <Link
            to="/channel/$principalId"
            params={{ principalId: video.uploader.toString() }}
          >
            <p className="text-xs text-mt-charcoal-400 hover:text-mt-charcoal-300 transition-colors mt-0.5">
              {channelName}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-mt-charcoal-500">
            <Eye className="w-3 h-3" />
            <span>{formatViewCount(Number(video.viewCount))}</span>
            <span>•</span>
            <span>{formatTimeAgo(uploadDateMs)}</span>
          </div>
        </div>

        <div className="shrink-0">
          <AddToPlaylistButton videoId={video.id} />
        </div>
      </div>
    </div>
  );
}
