import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { VideoMetadata } from '../backend';
import type { Principal } from '@dfinity/principal';
import ReelCommentsDrawer from './ReelCommentsDrawer';
import { useGetCommentCount } from '../hooks/useGetCommentCount';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSubscribeToChannel } from '../hooks/useSubscribeToChannel';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { useGetUserProfile } from '../hooks/useGetUserProfile';

interface ReelCardProps {
  video: VideoMetadata;
  isActive: boolean;
}

const MUTE_KEY = 'reelMuted';

export default function ReelCard({ video, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 9000) + 1000);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const { identity } = useInternetIdentity();

  // video.uploader is already a Principal — pass it directly
  const uploaderPrincipal = video.uploader as Principal;

  const { data: commentCount } = useGetCommentCount(video.id);
  const { data: uploaderProfile } = useGetUserProfile(uploaderPrincipal);
  const { data: subscribers } = useGetSubscribers(uploaderPrincipal);
  const { mutate: subscribe } = useSubscribeToChannel();

  const isSubscribed = subscribers?.some(
    (s) => s.toString() === identity?.getPrincipal().toString()
  );
  const isOwnChannel = identity?.getPrincipal().toString() === uploaderPrincipal.toString();

  // Load video source
  useEffect(() => {
    let objectUrl = '';
    const load = async () => {
      try {
        const url = video.videoFile.getDirectURL();
        setVideoSrc(url);
      } catch {
        try {
          const bytes = await video.videoFile.getBytes();
          const blob = new Blob([bytes], { type: 'video/mp4' });
          objectUrl = URL.createObjectURL(blob);
          setVideoSrc(objectUrl);
        } catch {
          // ignore
        }
      }
    };
    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video.videoFile]);

  // Load uploader avatar
  useEffect(() => {
    if (uploaderProfile?.avatar) {
      const url = convertBlobToDataURL(uploaderProfile.avatar);
      setAvatarUrl(url);
    }
  }, [uploaderProfile]);

  // Autoplay / pause based on isActive
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !videoSrc) return;
    if (isActive) {
      vid.muted = isMuted;
      vid.play().catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });
    } else {
      vid.pause();
    }
  }, [isActive, videoSrc, isMuted]);

  // Progress tracking
  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    setProgress((vid.currentTime / vid.duration) * 100);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      localStorage.setItem(MUTE_KEY, String(newMuted));
    } catch {}
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  }, [isMuted]);

  // Like handler
  const handleLike = useCallback(() => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
  }, []);

  // Share handler
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/video/${video.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Could not copy link'));
  }, [video.id]);

  // Subscribe handler — pass Principal directly
  const handleSubscribe = useCallback(() => {
    if (!identity) {
      toast.error('Sign in to subscribe');
      return;
    }
    subscribe(uploaderPrincipal);
  }, [identity, subscribe, uploaderPrincipal]);

  const uploaderName = uploaderProfile?.name || uploaderPrincipal.toString().slice(0, 8) + '...';
  const description = video.description || '';
  const isLongDesc = description.length > 80;

  return (
    <div className="relative w-full h-screen max-w-sm mx-auto bg-black overflow-hidden select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/20">
        <div
          className="h-full bg-white transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none z-10" />

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-8 right-4 z-20 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center transition-transform active:scale-90"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Right action sidebar */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* Uploader avatar + subscribe */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-neutral-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt={uploaderName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                  {uploaderName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!isOwnChannel && !isSubscribed && (
              <button
                onClick={handleSubscribe}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-mt-magenta flex items-center justify-center shadow-md"
                aria-label="Subscribe"
              >
                <span className="text-white text-xs font-bold leading-none">+</span>
              </button>
            )}
          </div>
        </div>

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <div
            className={`w-10 h-10 rounded-full bg-black/30 flex items-center justify-center transition-transform ${
              likeAnimating ? 'scale-125' : 'scale-100'
            }`}
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </div>
          <span className="text-white text-xs font-medium">
            {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
          aria-label="Comments"
        >
          <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">
            {commentCount !== undefined
              ? commentCount >= 1000
                ? `${(commentCount / 1000).toFixed(1)}K`
                : commentCount
              : '—'}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Bottom overlay: uploader info + description */}
      <div className="absolute bottom-0 left-0 right-14 z-20 p-4 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold text-sm">
            @{uploaderProfile?.handle || uploaderName}
          </span>
          {!isOwnChannel && !isSubscribed && (
            <button
              onClick={handleSubscribe}
              className="flex items-center gap-1 text-xs text-white/80 border border-white/40 rounded-full px-2 py-0.5 hover:bg-white/10 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Follow
            </button>
          )}
        </div>
        <h3 className="text-white font-bold text-base leading-tight mb-1">{video.title}</h3>
        {description && (
          <div>
            <p
              className={`text-white/80 text-xs leading-relaxed ${
                !showMore && isLongDesc ? 'line-clamp-2' : ''
              }`}
            >
              {description}
            </p>
            {isLongDesc && (
              <button
                onClick={() => setShowMore((v) => !v)}
                className="text-white/60 text-xs mt-0.5 hover:text-white transition-colors"
              >
                {showMore ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <ReelCommentsDrawer
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}
