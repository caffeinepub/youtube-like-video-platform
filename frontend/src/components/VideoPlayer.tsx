import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { VideoMetadata } from '../backend';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllVideos } from '../hooks/useGetAllVideos';

interface Chapter {
  time: number;
  title: string;
}

interface VideoPlayerProps {
  video: VideoMetadata;
  chapters?: Chapter[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ video, chapters = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  const [hoveredChapterX, setHoveredChapterX] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [endCountdown, setEndCountdown] = useState(5);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const navigate = useNavigate();
  const { data: allVideos } = useGetAllVideos();

  const recommendedVideos = (allVideos || [])
    .filter((v) => v.id !== video.id && !v.isShort)
    .slice(0, 4);

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
        } catch {}
      }
    };
    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video.videoFile]);

  // Controls hide timer
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    const vid = videoRef.current;
    if (!bar || !vid) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = ratio * vid.duration;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      }
    } catch {}
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowEndScreen(true);
    setEndCountdown(5);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setEndCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          // Auto-navigate to first recommended
          if (recommendedVideos.length > 0) {
            navigate({ to: '/video/$videoId', params: { videoId: recommendedVideos[0].id } });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [recommendedVideos, navigate]);

  const dismissEndScreen = useCallback(() => {
    setShowEndScreen(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handlePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
    >
      {/* Video element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full aspect-video"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            const vid = videoRef.current;
            if (vid) setCurrentTime(vid.currentTime);
          }}
          onLoadedMetadata={() => {
            const vid = videoRef.current;
            if (vid) setDuration(vid.duration);
          }}
          onEnded={handleEnded}
        />
      ) : (
        <div className="w-full aspect-video bg-neutral-900 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* End Screen Overlay */}
      {showEndScreen && (
        <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-6">
          <button
            onClick={dismissEndScreen}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm"
          >
            ✕
          </button>
          <p className="text-white/70 text-sm mb-4">
            Next video in <span className="text-white font-bold">{endCountdown}</span>s
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            {recommendedVideos.map((rec, i) => (
              <button
                key={rec.id}
                onClick={() => {
                  dismissEndScreen();
                  navigate({ to: '/video/$videoId', params: { videoId: rec.id } });
                }}
                className={`relative rounded-lg overflow-hidden bg-neutral-800 text-left hover:ring-2 hover:ring-white/50 transition-all ${
                  i === 0 ? 'ring-2 ring-white' : ''
                }`}
              >
                <div className="aspect-video bg-neutral-700 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white/60" />
                </div>
                <div className="p-2">
                  <p className="text-white text-xs font-medium line-clamp-2">{rec.title}</p>
                </div>
                {i === 0 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    Up next
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
          {/* Seek bar with chapter markers */}
          <div className="relative mb-2">
            <div
              ref={seekBarRef}
              className="relative h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2.5 transition-all group/seek"
              onClick={handleSeek}
            >
              {/* Progress fill */}
              <div
                className="absolute left-0 top-0 h-full bg-mt-magenta rounded-full pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Chapter markers */}
              {chapters.map((chapter, idx) => {
                const pct = duration > 0 ? (chapter.time / duration) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/80 rounded-sm cursor-pointer z-10"
                    style={{ left: `${pct}%` }}
                    onMouseEnter={(e) => {
                      setHoveredChapter(chapter.title);
                      const bar = seekBarRef.current;
                      if (bar) {
                        const rect = bar.getBoundingClientRect();
                        setHoveredChapterX(e.clientX - rect.left);
                      }
                    }}
                    onMouseLeave={() => setHoveredChapter(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) videoRef.current.currentTime = chapter.time;
                    }}
                  />
                );
              })}
              {/* Chapter tooltip */}
              {hoveredChapter && (
                <div
                  className="absolute bottom-5 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20 -translate-x-1/2"
                  style={{ left: hoveredChapterX }}
                >
                  {hoveredChapter}
                </div>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Volume */}
            <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-mt-magenta"
            />

            {/* Time */}
            <span className="text-white text-xs ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Settings (playback speed) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute bottom-8 right-0 bg-black/90 rounded-lg overflow-hidden z-30 min-w-[120px]">
                  <p className="text-white/60 text-xs px-3 py-1.5 border-b border-white/10">Speed</p>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRate(rate)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        playbackRate === rate
                          ? 'text-mt-magenta font-semibold'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}×`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
