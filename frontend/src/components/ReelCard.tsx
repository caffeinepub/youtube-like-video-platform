import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Volume2, VolumeX, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SubscribeButton from './SubscribeButton';
import ShareButton from './ShareButton';
import { useIncrementViewCount } from '../hooks/useIncrementViewCount';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { formatViewCount } from '../utils/formatters';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import type { VideoMetadata } from '../backend';
import type { Principal } from '@dfinity/principal';

interface ReelCardProps {
  video: VideoMetadata;
  isActive: boolean;
}

export default function ReelCard({ video, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const viewIncrementedRef = useRef(false);

  const { mutate: incrementView } = useIncrementViewCount();
  const { data: uploaderProfile } = useGetUserProfile(video.uploader as Principal);

  const uploaderName = uploaderProfile?.name || 'Unknown';
  const uploaderAvatarSrc =
    uploaderProfile?.avatar && uploaderProfile.avatar.length > 0
      ? convertBlobToDataURL(uploaderProfile.avatar)
      : undefined;

  // Autoplay/pause based on isActive
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      videoEl.play().catch(() => {
        // Autoplay blocked, keep muted and try again
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      });
      // Increment view count once per activation
      if (!viewIncrementedRef.current) {
        viewIncrementedRef.current = true;
        incrementView(video.id);
      }
    } else {
      videoEl.pause();
    }
  }, [isActive, video.id, incrementView]);

  const toggleMute = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    setMuted(videoEl.muted);
  }, []);

  const videoUrl = video.videoFile.getDirectURL();

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black snap-start snap-always">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        preload="metadata"
      />

      {/* Gradient overlay bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-10">
        {/* Like button (UI only) */}
        <button
          onClick={() => setLiked((l) => !l)}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Like"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm transition-colors ${liked ? 'bg-primary/30' : 'hover:bg-white/20'}`}>
            <Heart className={`w-6 h-6 ${liked ? 'fill-primary text-primary' : 'text-white'}`} />
          </div>
          <span className="text-xs font-medium">{liked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Share button */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20">
            <ShareButton videoId={video.id} />
          </div>
          <span className="text-xs font-medium text-white">Share</span>
        </div>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="flex flex-col items-center gap-1 text-white"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20">
            {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
          </div>
          <span className="text-xs font-medium">{muted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        {/* Uploader info + subscribe */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-white/50">
            {uploaderAvatarSrc && <AvatarImage src={uploaderAvatarSrc} alt={uploaderName} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {getInitials(uploaderName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{uploaderName}</p>
          </div>
          <div className="shrink-0">
            <SubscribeButton channelPrincipal={video.uploader as Principal} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-base mb-2 line-clamp-2">{video.title}</h3>

        {/* View count */}
        <div className="flex items-center gap-1.5 text-white/70 text-sm">
          <Eye className="w-4 h-4" />
          <span>{formatViewCount(Number(video.viewCount))} views</span>
        </div>
      </div>
    </div>
  );
}
