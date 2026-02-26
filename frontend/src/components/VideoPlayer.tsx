import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ShareButton from './ShareButton';
import AdOverlay from './AdOverlay';
import type { VideoMetadata } from '../backend';

interface VideoPlayerProps {
  video: VideoMetadata;
  onPlay?: () => void;
}

export default function VideoPlayer({ video, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adDismissed, setAdDismissed] = useState(false);

  const videoUrl = video.videoFile.getDirectURL();
  const isLongForm = !video.isShort;

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const updateTime = () => setCurrentTime(vid.currentTime);
    const updateDuration = () => {
      if (isFinite(vid.duration)) {
        setDuration(vid.duration);
      }
    };

    vid.addEventListener('timeupdate', updateTime);
    vid.addEventListener('loadedmetadata', updateDuration);
    vid.addEventListener('durationchange', updateDuration);

    return () => {
      vid.removeEventListener('timeupdate', updateTime);
      vid.removeEventListener('loadedmetadata', updateDuration);
      vid.removeEventListener('durationchange', updateDuration);
    };
  }, []);

  // Listen for actual fullscreen change events to keep state in sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const startPlayback = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch((err) => {
      console.error('Playback error:', err);
    });
    setIsPlaying(true);
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
      onPlay?.();
    }
  }, [hasStartedPlaying, onPlay]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    try {
      if (isPlaying) {
        vid.pause();
        setIsPlaying(false);
      } else {
        // Show ad for long-form videos on first play
        if (isLongForm && !adDismissed && !hasStartedPlaying) {
          setShowAd(true);
          vid.pause();
          setIsPlaying(false);
          if (!hasStartedPlaying) {
            setHasStartedPlaying(true);
            onPlay?.();
          }
        } else {
          startPlayback();
        }
      }
    } catch (err) {
      console.error('Toggle play error:', err);
    }
  }, [isPlaying, isLongForm, adDismissed, hasStartedPlaying, onPlay, startPlayback]);

  const handleAdSkip = useCallback(() => {
    setShowAd(false);
    setAdDismissed(true);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
    }
    startPlayback();
  }, [startPlayback]);

  const handleAdComplete = useCallback(() => {
    setShowAd(false);
    setAdDismissed(true);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
    }
    startPlayback();
  }, [startPlayback]);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.muted = !isMuted;
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Toggle mute error:', err);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      const newVolume = value[0];
      setVolume(newVolume);
      vid.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
        vid.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        vid.muted = false;
      }
    } catch (err) {
      console.error('Volume change error:', err);
    }
  }, [isMuted]);

  const handleSeek = useCallback((value: number[]) => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.currentTime = value[0];
      setCurrentTime(value[0]);
    } catch (err) {
      console.error('Seek error:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
      // State is updated via the fullscreenchange event listener
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
      // Fallback: toggle state manually if API fails
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={togglePlay}
      />

      {/* Ad Overlay — only for long-form videos */}
      {showAd && isLongForm && (
        <AdOverlay onSkip={handleAdSkip} onComplete={handleAdComplete} />
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-3"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShareButton videoId={video.id} />
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
