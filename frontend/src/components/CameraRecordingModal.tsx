import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCameraRecorder } from '../hooks/useCameraRecorder';
import {
  Camera,
  Circle,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';

interface CameraRecordingModalProps {
  open: boolean;
  onClose: () => void;
  onRecordingComplete: (blob: Blob) => void;
}

export default function CameraRecordingModal({
  open,
  onClose,
  onRecordingComplete,
}: CameraRecordingModalProps) {
  const {
    recordingState,
    error,
    recordedBlob,
    recordedUrl,
    isInitializing,
    isRecording,
    isStopped,
    videoRef,
    startCamera,
    startRecording,
    stopRecording,
    resetRecording,
    stopCamera,
  } = useCameraRecorder();

  // Start camera when modal opens
  useEffect(() => {
    if (open) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    stopCamera();
    resetRecording();
    onClose();
  };

  const handleUseRecording = () => {
    if (recordedBlob) {
      // Capture blob reference before resetting
      const blobToUse = recordedBlob;
      onRecordingComplete(blobToUse);
      stopCamera();
      resetRecording();
      onClose();
    }
  };

  const handleRetry = () => {
    resetRecording();
    startCamera();
  };

  const isReady = recordingState === 'ready';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Record from Camera</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record a video directly from your camera
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full w-8 h-8 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Video preview area */}
          <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {/* Loading overlay */}
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-white/80">Starting camera…</p>
              </div>
            )}

            {/* Error overlay */}
            {recordingState === 'error' && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <p className="text-sm font-medium text-white mb-1">Camera Error</p>
                <p className="text-xs text-white/70 mb-4">{error.message}</p>
                <Button size="sm" variant="outline" onClick={handleRetry} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Idle state (before camera starts) */}
            {recordingState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                <Camera className="w-10 h-10 text-white/40 mb-3" />
                <p className="text-sm text-white/60">Camera not started</p>
              </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs text-white font-medium">REC</span>
              </div>
            )}

            {/* Video element — used for both live preview and playback */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted={!isStopped}
              style={{ display: recordingState === 'error' || recordingState === 'idle' ? 'none' : 'block' }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {/* Ready state: Start Recording */}
            {isReady && (
              <Button
                onClick={startRecording}
                className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Circle className="w-4 h-4 fill-current" />
                Start Recording
              </Button>
            )}

            {/* Recording state: Stop Recording */}
            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="outline"
                className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </Button>
            )}

            {/* Stopped state: Use or Re-record */}
            {isStopped && (
              <>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-record
                </Button>
                <Button
                  onClick={handleUseRecording}
                  className="gap-2"
                  disabled={!recordedBlob}
                >
                  <CheckCircle className="w-4 h-4" />
                  Use This Recording
                </Button>
              </>
            )}

            {/* Initializing state */}
            {isInitializing && (
              <Button disabled className="gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting Camera…
              </Button>
            )}
          </div>

          {/* Recorded blob info */}
          {isStopped && recordedBlob && (
            <p className="text-center text-xs text-muted-foreground">
              Recording ready · {(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
