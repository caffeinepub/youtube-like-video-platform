import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCameraRecorder } from '../hooks/useCameraRecorder';
import { useVideoFilter } from '../hooks/useVideoFilter';
import { FilterType, FILTERS, FILTER_ORDER } from '../types/filters';
import {
  X,
  Music,
  RotateCcw,
  Timer,
  Sparkles,
  Gauge,
  PersonStanding,
  ChevronDown,
  AlertCircle,
  Loader2,
  Camera,
  Mic,
  FlipHorizontal2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MusicPickerPanel from './MusicPickerPanel';
import { MusicTrack } from '../types/music';
import { getTranslation } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';

interface CameraRecordingModalProps {
  open?: boolean;
  onClose: () => void;
  onRecordingComplete: (blob: Blob) => void;
}

const DURATION_OPTIONS = [
  { label: '15 s', ms: 15000 },
  { label: '30 s', ms: 30000 },
  { label: '60 s', ms: 60000 },
];

export default function CameraRecordingModal({
  open = true,
  onClose,
  onRecordingComplete,
}: CameraRecordingModalProps) {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const {
    recordingState,
    error,
    recordedBlob,
    recordedUrl,
    isInitializing,
    isRecording,
    isStopped,
    videoRef,
    audioDevices,
    selectedAudioDeviceId,
    facingMode,
    elapsedMs,
    startCamera,
    startRecording: startRawRecording,
    stopRecording,
    resetRecording,
    stopCamera,
    reinitializeWithAudioDevice,
    switchCameraFacingMode,
  } = useCameraRecorder();

  const { applyFilterToStream } = useVideoFilter();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');
  const filterCleanupRef = useRef<(() => void) | null>(null);
  const filteredStreamRef = useRef<MediaStream | null>(null);

  const filteredRecorderRef = useRef<MediaRecorder | null>(null);
  const filteredChunksRef = useRef<Blob[]>([]);
  const [filteredBlob, setFilteredBlob] = useState<Blob | null>(null);
  const [filteredUrl, setFilteredUrl] = useState<string | null>(null);
  const [isFilteredRecording, setIsFilteredRecording] = useState(false);
  const [isFilteredStopped, setIsFilteredStopped] = useState(false);
  const filteredAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredElapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filteredStartTimeRef = useRef<number>(0);
  const [filteredElapsedMs, setFilteredElapsedMs] = useState(0);

  // Zoom state (1.0 – 3.0)
  const [zoom, setZoom] = useState(1.0);
  const zoomRef = useRef(1.0);

  // Pinch-to-zoom state
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);

  // Mic selector visibility
  const [showMicSelector, setShowMicSelector] = useState(false);

  // Music state
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Duration selector
  const [durationIndex, setDurationIndex] = useState(0);
  const selectedDuration = DURATION_OPTIONS[durationIndex];

  // Suggestion chip
  const [showSuggestionChip, setShowSuggestionChip] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<'Video' | 'Short' | 'Live' | 'Post'>('Short');

  // Show filter strip
  const [showFilterStrip, setShowFilterStrip] = useState(false);

  // Toolbar collapsed
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  // Start camera when modal opens
  useEffect(() => {
    if (open) {
      startCamera(undefined, 'user');
      setSelectedFilter('normal');
      setFilteredBlob(null);
      setFilteredUrl(null);
      setIsFilteredRecording(false);
      setIsFilteredStopped(false);
      setZoom(1.0);
      zoomRef.current = 1.0;
      setShowMicSelector(false);
      setSelectedMusic(null);
      setShowSuggestionChip(true);
      setDurationIndex(0);
      setShowFilterStrip(false);
      setToolbarCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup filtered stream/url on unmount
  useEffect(() => {
    return () => {
      cleanupFilteredStream();
      if (filteredUrl) URL.revokeObjectURL(filteredUrl);
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      if (filteredAutoStopRef.current) clearTimeout(filteredAutoStopRef.current);
      if (filteredElapsedIntervalRef.current) clearInterval(filteredElapsedIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep zoomRef in sync
  useEffect(() => {
    zoomRef.current = zoom;
    const stream = filteredStreamRef.current as (MediaStream & { _zoomRef?: { current: number } }) | null;
    if (stream && stream._zoomRef) {
      stream._zoomRef.current = zoom;
    }
  }, [zoom]);

  const cleanupFilteredStream = useCallback(() => {
    if (filteredAutoStopRef.current) {
      clearTimeout(filteredAutoStopRef.current);
      filteredAutoStopRef.current = null;
    }
    if (filteredElapsedIntervalRef.current) {
      clearInterval(filteredElapsedIntervalRef.current);
      filteredElapsedIntervalRef.current = null;
    }
    if (filterCleanupRef.current) {
      filterCleanupRef.current();
      filterCleanupRef.current = null;
    }
    if (filteredStreamRef.current) {
      filteredStreamRef.current.getTracks().forEach((t) => t.stop());
      filteredStreamRef.current = null;
    }
    if (filteredRecorderRef.current) {
      filteredRecorderRef.current = null;
    }
  }, []);

  const stopMusicPlayback = useCallback(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
      musicAudioRef.current = null;
    }
  }, []);

  const handleClose = () => {
    cleanupFilteredStream();
    stopMusicPlayback();
    stopCamera();
    resetRecording();
    if (filteredUrl) URL.revokeObjectURL(filteredUrl);
    setFilteredBlob(null);
    setFilteredUrl(null);
    setIsFilteredRecording(false);
    setIsFilteredStopped(false);
    setShowMicSelector(false);
    setSelectedMusic(null);
    onClose();
  };

  const handleUseRecording = () => {
    const blobToUse = filteredBlob || recordedBlob;
    if (blobToUse) {
      onRecordingComplete(blobToUse);
      cleanupFilteredStream();
      stopMusicPlayback();
      stopCamera();
      resetRecording();
      if (filteredUrl) URL.revokeObjectURL(filteredUrl);
      setFilteredBlob(null);
      setFilteredUrl(null);
      setIsFilteredRecording(false);
      setIsFilteredStopped(false);
      setShowMicSelector(false);
      setSelectedMusic(null);
      onClose();
    }
  };

  const handleRetry = () => {
    cleanupFilteredStream();
    stopMusicPlayback();
    if (filteredUrl) URL.revokeObjectURL(filteredUrl);
    setFilteredBlob(null);
    setFilteredUrl(null);
    setIsFilteredRecording(false);
    setIsFilteredStopped(false);
    setFilteredElapsedMs(0);
    setZoom(1.0);
    zoomRef.current = 1.0;
    resetRecording();
    startCamera(undefined, facingMode);
  };

  const handleMicChange = useCallback(
    async (deviceId: string) => {
      setShowMicSelector(false);
      await reinitializeWithAudioDevice(deviceId);
    },
    [reinitializeWithAudioDevice]
  );

  const handleFlipCamera = useCallback(async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    // Reset filtered recording state
    cleanupFilteredStream();
    setFilteredBlob(null);
    setFilteredUrl(null);
    setIsFilteredRecording(false);
    setIsFilteredStopped(false);
    setFilteredElapsedMs(0);
    await switchCameraFacingMode(newFacing);
  }, [facingMode, switchCameraFacingMode, cleanupFilteredStream]);

  const handleCycleDuration = useCallback(() => {
    setDurationIndex((prev) => (prev + 1) % DURATION_OPTIONS.length);
  }, []);

  const startMusicPlayback = useCallback(async () => {
    if (!selectedMusic) return;
    try {
      const audio = new Audio(selectedMusic.url);
      audio.loop = true;
      audio.volume = 0.6;
      await audio.play();
      musicAudioRef.current = audio;
    } catch {
      // Music playback failed silently
    }
  }, [selectedMusic]);

  const isNormalFilter = selectedFilter === 'normal';
  const effectiveIsRecording = isNormalFilter && zoom <= 1.01 ? isRecording : isFilteredRecording;
  const effectiveIsStopped = isNormalFilter && zoom <= 1.01 ? isStopped : isFilteredStopped;

  // Elapsed time for display
  const displayElapsedMs = isNormalFilter && zoom <= 1.01 ? elapsedMs : filteredElapsedMs;
  const remainingMs = Math.max(0, selectedDuration.ms - displayElapsedMs);
  const progressPct = Math.min(100, (displayElapsedMs / selectedDuration.ms) * 100);

  const startRecording = useCallback(() => {
    if (recordingState !== 'ready') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const currentZoom = zoomRef.current;
    startMusicPlayback();

    if (isNormalFilter && currentZoom <= 1.01) {
      startRawRecording(selectedDuration.ms);
      return;
    }

    const width = videoEl.videoWidth || 1280;
    const height = videoEl.videoHeight || 720;

    const result = applyFilterToStream(videoEl, selectedFilter, width, height, currentZoom);
    if (!result) {
      startRawRecording(selectedDuration.ms);
      return;
    }

    filterCleanupRef.current = result.cleanup;
    filteredStreamRef.current = result.stream;

    const originalStream = videoEl.srcObject as MediaStream | null;
    if (originalStream) {
      const audioTracks = originalStream.getAudioTracks();
      audioTracks.forEach((track) => {
        filteredStreamRef.current!.addTrack(track);
      });
    }

    filteredChunksRef.current = [];
    filteredStartTimeRef.current = Date.now();
    setFilteredElapsedMs(0);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : '';

    const options = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(filteredStreamRef.current, options);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        filteredChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      if (filteredAutoStopRef.current) {
        clearTimeout(filteredAutoStopRef.current);
        filteredAutoStopRef.current = null;
      }
      if (filteredElapsedIntervalRef.current) {
        clearInterval(filteredElapsedIntervalRef.current);
        filteredElapsedIntervalRef.current = null;
      }
      const blob = new Blob(filteredChunksRef.current, {
        type: mimeType || 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      setFilteredBlob(blob);
      setFilteredUrl(url);
      setIsFilteredRecording(false);
      setIsFilteredStopped(true);

      if (filterCleanupRef.current) {
        filterCleanupRef.current();
        filterCleanupRef.current = null;
      }

      if (videoEl) {
        videoEl.srcObject = null;
        videoEl.src = url;
        videoEl.muted = false;
        videoEl.controls = true;
      }
    };

    filteredRecorderRef.current = recorder;
    recorder.start(100);
    setIsFilteredRecording(true);

    // Elapsed interval
    filteredElapsedIntervalRef.current = setInterval(() => {
      setFilteredElapsedMs(Date.now() - filteredStartTimeRef.current);
    }, 100);

    // Auto-stop
    filteredAutoStopRef.current = setTimeout(() => {
      if (filteredRecorderRef.current && filteredRecorderRef.current.state === 'recording') {
        filteredRecorderRef.current.stop();
        stopMusicPlayback();
      }
    }, selectedDuration.ms);
  }, [
    recordingState,
    selectedFilter,
    videoRef,
    applyFilterToStream,
    startRawRecording,
    startMusicPlayback,
    isNormalFilter,
    selectedDuration.ms,
    stopMusicPlayback,
  ]);

  const stopFilteredRecording = useCallback(() => {
    if (filteredAutoStopRef.current) {
      clearTimeout(filteredAutoStopRef.current);
      filteredAutoStopRef.current = null;
    }
    if (filteredElapsedIntervalRef.current) {
      clearInterval(filteredElapsedIntervalRef.current);
      filteredElapsedIntervalRef.current = null;
    }
    if (filteredRecorderRef.current && isFilteredRecording) {
      filteredRecorderRef.current.stop();
    }
    stopMusicPlayback();
  }, [isFilteredRecording, stopMusicPlayback]);

  const handleStopRecording = useCallback(() => {
    const currentZoom = zoomRef.current;
    if (isNormalFilter && currentZoom <= 1.01) {
      stopRecording();
    } else {
      stopFilteredRecording();
    }
    stopMusicPlayback();
  }, [isNormalFilter, stopRecording, stopFilteredRecording, stopMusicPlayback]);

  // Pinch-to-zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoomRef.current;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.max(1.0, Math.min(3.0, pinchStartZoomRef.current * scale));
      setZoom(newZoom);
      zoomRef.current = newZoom;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  const previewFilter = FILTERS[selectedFilter].cssFilter;

  const formatRemaining = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${s}s`;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ width: '100vw', height: '100dvh' }}
    >
      {/* Full-screen video preview */}
      <div
        className="relative flex-1 overflow-hidden bg-black"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading overlay */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
            <p className="text-sm text-white/80">Starting camera…</p>
          </div>
        )}

        {/* Error overlay */}
        {recordingState === 'error' && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 px-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-base font-semibold text-white mb-2">Camera Error</p>
            <p className="text-sm text-white/70 mb-6">{error.message}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Idle state */}
        {recordingState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <Camera className="w-12 h-12 text-white/40 mb-3" />
            <p className="text-sm text-white/60">Camera not started</p>
          </div>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={!effectiveIsStopped && !isStopped}
          style={{
            display: recordingState === 'error' || recordingState === 'idle' ? 'none' : 'block',
            filter: !effectiveIsStopped && !isStopped ? previewFilter : 'none',
            transform: !effectiveIsStopped && !isStopped ? `scale(${zoom})` : 'none',
            transformOrigin: 'center center',
            transition: 'filter 0.3s ease',
          }}
        />

        {/* ── TOP BAR ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-3 pb-2">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Add sound pill */}
          <button
            onClick={() => setShowMusicPicker(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              selectedMusic
                ? 'bg-white text-black'
                : 'bg-black/60 text-white border border-white/30 hover:bg-black/80'
            )}
          >
            <Music className="w-4 h-4" />
            {selectedMusic ? selectedMusic.name : 'Add sound'}
          </button>

          {/* AI / Sparkle gradient button */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
            }}
            aria-label="AI effects"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── SUGGESTION CHIP ── */}
        {showSuggestionChip && !effectiveIsRecording && !effectiveIsStopped && (
          <div className="absolute top-16 left-0 right-0 z-30 flex justify-center px-4">
            <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 max-w-xs">
              <span className="text-white text-sm font-medium truncate">Try this sound</span>
              <button
                onClick={() => setShowSuggestionChip(false)}
                className="text-white/60 hover:text-white flex-shrink-0"
                aria-label="Dismiss suggestion"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── REC INDICATOR ── */}
        {effectiveIsRecording && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white font-semibold tracking-wide">
              REC · {formatRemaining(remainingMs)}
            </span>
          </div>
        )}

        {/* ── PROGRESS BAR (during recording) ── */}
        {effectiveIsRecording && (
          <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* ── RIGHT SIDE TOOLBAR ── */}
        {!effectiveIsStopped && !toolbarCollapsed && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1">
            <div className="flex flex-col items-center gap-1 bg-black/50 rounded-2xl px-1 py-2">
              {/* Flip camera */}
              <ToolbarButton
                onClick={handleFlipCamera}
                disabled={effectiveIsRecording}
                label="Flip camera"
              >
                <FlipHorizontal2 className="w-5 h-5 text-white" />
              </ToolbarButton>

              {/* Timer */}
              <ToolbarButton label="Timer">
                <Timer className="w-5 h-5 text-white" />
              </ToolbarButton>

              {/* Duration selector */}
              <ToolbarButton
                onClick={handleCycleDuration}
                disabled={effectiveIsRecording}
                label="Duration"
              >
                <span className="text-white text-xs font-bold leading-none">
                  {selectedDuration.label}
                </span>
              </ToolbarButton>

              {/* Effects / Filters */}
              <ToolbarButton
                onClick={() => setShowFilterStrip((v) => !v)}
                disabled={effectiveIsRecording}
                label="Filters"
                active={selectedFilter !== 'normal'}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </ToolbarButton>

              {/* Speed */}
              <ToolbarButton label="Speed">
                <span className="text-white text-xs font-bold leading-none">1×</span>
              </ToolbarButton>

              {/* Green screen / person cutout */}
              <ToolbarButton label="Person cutout">
                <PersonStanding className="w-5 h-5 text-white" />
              </ToolbarButton>

              {/* Mic selector */}
              {audioDevices.length > 1 && !effectiveIsRecording && (
                <ToolbarButton
                  onClick={() => setShowMicSelector((v) => !v)}
                  label="Microphone"
                  active={showMicSelector}
                >
                  <Mic className="w-5 h-5 text-white" />
                </ToolbarButton>
              )}

              {/* Collapse */}
              <ToolbarButton
                onClick={() => setToolbarCollapsed(true)}
                label="Collapse toolbar"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </ToolbarButton>
            </div>
          </div>
        )}

        {/* Collapsed toolbar expand button */}
        {!effectiveIsStopped && toolbarCollapsed && (
          <button
            onClick={() => setToolbarCollapsed(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
            aria-label="Expand toolbar"
          >
            <ChevronDown className="w-5 h-5 text-white rotate-180" />
          </button>
        )}

        {/* ── MIC SELECTOR POPUP ── */}
        {showMicSelector && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 z-40 bg-black/90 rounded-xl p-3 min-w-[180px] shadow-xl">
            <p className="text-xs text-white/60 mb-2 font-medium">Select Microphone</p>
            {audioDevices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => handleMicChange(device.deviceId)}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                  selectedAudioDeviceId === device.deviceId
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10'
                )}
              >
                {device.label}
              </button>
            ))}
          </div>
        )}

        {/* ── FILTER STRIP ── */}
        {showFilterStrip && !effectiveIsRecording && !effectiveIsStopped && (
          <div className="absolute bottom-32 left-0 right-0 z-30 flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_ORDER.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  selectedFilter === filter
                    ? 'bg-white/30 ring-2 ring-white'
                    : 'bg-black/40 hover:bg-black/60'
                )}
              >
                <span className="text-lg">{FILTERS[filter].icon}</span>
                <span className="text-xs text-white font-medium">{FILTERS[filter].displayName}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── BOTTOM AREA: Add button + Record button ── */}
        <div className="absolute bottom-20 left-0 right-0 z-30 flex items-center justify-center px-6">
          {/* Gallery / Add button (bottom left) */}
          <div className="absolute left-6 flex flex-col items-center gap-1">
            {!effectiveIsStopped ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/30 flex items-center justify-center overflow-hidden">
                  <Camera className="w-6 h-6 text-white/60" />
                </div>
                <span className="text-white text-xs font-semibold">Add</span>
              </>
            ) : null}
          </div>

          {/* Center: Record / Stop / Use button */}
          {!effectiveIsStopped ? (
            <button
              onClick={effectiveIsRecording ? handleStopRecording : startRecording}
              disabled={recordingState !== 'ready' && !effectiveIsRecording}
              className="relative flex items-center justify-center"
              aria-label={effectiveIsRecording ? 'Stop recording' : 'Start recording'}
            >
              {/* Outer white ring */}
              <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                {effectiveIsRecording ? (
                  /* Stop square */
                  <div className="w-8 h-8 rounded-md bg-red-500" />
                ) : (
                  /* Record circle */
                  <div className="w-14 h-14 rounded-full bg-red-500" />
                )}
              </div>
            </button>
          ) : (
            /* Post-recording actions */
            <div className="flex items-center gap-4">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleUseRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Use Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM TAB SWITCHER ── */}
      <div className="bg-black flex items-center justify-center gap-6 py-3 pb-safe">
        {(['Video', 'Short', 'Live', 'Post'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-sm font-semibold px-4 py-1.5 rounded-full transition-all',
              activeTab === tab
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Music Picker Panel */}
      <MusicPickerPanel
        open={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        selectedTrack={selectedMusic}
        onSelect={(track) => setSelectedMusic(track)}
      />
    </div>
  );
}

// ── Toolbar button helper ──
interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, disabled, label, active, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
        active ? 'bg-white/30' : 'hover:bg-white/10',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}
