import { useRef, useState, useEffect } from 'react';
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
    const updateDuration = () => setDuration(vid.duration);

    vid.addEventListener('timeupdate', updateTime);
    vid.addEventListener('loadedmetadata', updateDuration);

    return () => {
      vid.removeEventListener('timeupdate', updateTime);
      vid.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const startPlayback = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play();
    setIsPlaying(true);
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
      onPlay?.();
    }
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      // Show ad for long-form videos on first play
      if (isLongForm && !adDismissed && !hasStartedPlaying) {
        setShowAd(true);
        // Pause the video while ad is showing
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
  };

  const handleAdSkip = () => {
    setShowAd(false);
    setAdDismissed(true);
    // Restart video from beginning
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
    }
    startPlayback();
  };

  const handleAdComplete = () => {
    setShowAd(false);
    setAdDismissed(true);
    // Start video from beginning
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
    }
    startPlayback();
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const vid = videoRef.current;
    if (!vid) return;
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
  };

  const handleSeek = (value: number[]) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
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
