import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'initializing' | 'ready' | 'recording' | 'stopped' | 'error';

export interface CameraRecorderError {
  type: 'permission' | 'not-supported' | 'not-found' | 'unknown';
  message: string;
}

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export interface UseCameraRecorderReturn {
  recordingState: RecordingState;
  error: CameraRecorderError | null;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  isInitializing: boolean;
  isRecording: boolean;
  isStopped: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioDevices: AudioInputDevice[];
  selectedAudioDeviceId: string;
  facingMode: 'user' | 'environment';
  elapsedMs: number;
  setSelectedAudioDeviceId: (deviceId: string) => void;
  startCamera: (audioDeviceId?: string, facing?: 'user' | 'environment') => Promise<void>;
  startRecording: (maxDurationMs?: number) => void;
  stopRecording: () => void;
  resetRecording: () => void;
  stopCamera: () => void;
  reinitializeWithAudioDevice: (deviceId: string) => Promise<void>;
  switchCameraFacingMode: (newFacing: 'user' | 'environment') => Promise<void>;
}

export function useCameraRecorder(): UseCameraRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<CameraRecorderError | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<AudioInputDevice[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [elapsedMs, setElapsedMs] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Cleanup recorded URL on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      stopStreamTracks();
      clearAutoStopTimer();
      clearElapsedInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimerRef.current !== null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const clearElapsedInterval = useCallback(() => {
    if (elapsedIntervalRef.current !== null) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const enumerateAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${idx + 1}`,
        }));
      setAudioDevices(audioInputs);
      if (audioInputs.length > 0) {
        setSelectedAudioDeviceId((prev) => prev || audioInputs[0].deviceId);
      }
    } catch {
      // Silently fail — device enumeration is best-effort
    }
  }, []);

  const startCamera = useCallback(
    async (audioDeviceId?: string, facing: 'user' | 'environment' = 'user') => {
      setError(null);
      setRecordedBlob(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
      chunksRef.current = [];
      setElapsedMs(0);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError({ type: 'not-supported', message: 'Camera is not supported in this browser.' });
        setRecordingState('error');
        return;
      }

      setRecordingState('initializing');

      try {
        const audioConstraint: MediaTrackConstraints =
          audioDeviceId && audioDeviceId !== ''
            ? { deviceId: { exact: audioDeviceId } }
            : (true as unknown as MediaTrackConstraints);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: facing },
          audio: audioConstraint,
        });

        streamRef.current = stream;
        setFacingMode(facing);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play();
        }

        await enumerateAudioDevices();
        setRecordingState('ready');
      } catch (err: unknown) {
        const domError = err as DOMException;
        if (domError.name === 'NotAllowedError' || domError.name === 'PermissionDeniedError') {
          setError({
            type: 'permission',
            message: 'Camera permission was denied. Please allow camera access and try again.',
          });
        } else if (domError.name === 'NotFoundError' || domError.name === 'DevicesNotFoundError') {
          setError({
            type: 'not-found',
            message: 'No camera found. Please connect a camera and try again.',
          });
        } else {
          setError({
            type: 'unknown',
            message: `Could not access camera: ${domError.message || 'Unknown error'}`,
          });
        }
        setRecordingState('error');
      }
    },
    [recordedUrl, enumerateAudioDevices]
  );

  const reinitializeWithAudioDevice = useCallback(
    async (deviceId: string) => {
      setSelectedAudioDeviceId(deviceId);
      stopStreamTracks();
      await startCamera(deviceId, facingMode);
    },
    [startCamera, stopStreamTracks, facingMode]
  );

  const switchCameraFacingMode = useCallback(
    async (newFacing: 'user' | 'environment') => {
      // Stop any active recording first
      clearAutoStopTimer();
      clearElapsedInterval();
      if (mediaRecorderRef.current && recordingState === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      stopStreamTracks();
      setElapsedMs(0);
      // Restart camera with new facing mode
      await startCamera(selectedAudioDeviceId || undefined, newFacing);
    },
    [recordingState, stopStreamTracks, startCamera, selectedAudioDeviceId, clearAutoStopTimer, clearElapsedInterval]
  );

  const startRecording = useCallback(
    (maxDurationMs?: number) => {
      if (!streamRef.current || recordingState !== 'ready') return;

      chunksRef.current = [];
      setElapsedMs(0);
      recordingStartTimeRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : '';

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        clearAutoStopTimer();
        clearElapsedInterval();
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecordingState('stopped');

        stopStreamTracks();

        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.muted = false;
          videoRef.current.controls = true;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecordingState('recording');

      // Elapsed time interval
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - recordingStartTimeRef.current);
      }, 100);

      // Auto-stop timer
      if (maxDurationMs && maxDurationMs > 0) {
        autoStopTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, maxDurationMs);
      }
    },
    [recordingState, stopStreamTracks, clearAutoStopTimer, clearElapsedInterval]
  );

  const stopRecording = useCallback(() => {
    clearAutoStopTimer();
    clearElapsedInterval();
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState, clearAutoStopTimer, clearElapsedInterval]);

  const resetRecording = useCallback(() => {
    clearAutoStopTimer();
    clearElapsedInterval();
    stopStreamTracks();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
    setElapsedMs(0);
    chunksRef.current = [];

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.controls = false;
      videoRef.current.muted = true;
    }

    setRecordingState('idle');
  }, [recordedUrl, stopStreamTracks, clearAutoStopTimer, clearElapsedInterval]);

  const stopCamera = useCallback(() => {
    clearAutoStopTimer();
    clearElapsedInterval();
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopStreamTracks();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRecordingState('idle');
    setElapsedMs(0);
  }, [recordingState, stopStreamTracks, clearAutoStopTimer, clearElapsedInterval]);

  return {
    recordingState,
    error,
    recordedBlob,
    recordedUrl,
    isInitializing: recordingState === 'initializing',
    isRecording: recordingState === 'recording',
    isStopped: recordingState === 'stopped',
    videoRef,
    audioDevices,
    selectedAudioDeviceId,
    facingMode,
    elapsedMs,
    setSelectedAudioDeviceId,
    startCamera,
    startRecording,
    stopRecording,
    resetRecording,
    stopCamera,
    reinitializeWithAudioDevice,
    switchCameraFacingMode,
  };
}
