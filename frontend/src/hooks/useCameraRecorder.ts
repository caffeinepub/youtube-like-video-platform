import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'initializing' | 'ready' | 'recording' | 'stopped' | 'error';

export interface CameraRecorderError {
  type: 'permission' | 'not-supported' | 'not-found' | 'unknown';
  message: string;
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
  startCamera: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  stopCamera: () => void;
}

export function useCameraRecorder(): UseCameraRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<CameraRecorderError | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup recorded URL on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      stopStreamTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    chunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({ type: 'not-supported', message: 'Camera is not supported in this browser.' });
      setRecordingState('error');
      return;
    }

    setRecordingState('initializing');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

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
  }, [recordedUrl]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || recordingState !== 'ready') return;

    chunksRef.current = [];

    // Pick a supported MIME type
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
      const blob = new Blob(chunksRef.current, {
        type: mimeType || 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setRecordingState('stopped');

      // Stop the live stream after recording
      stopStreamTracks();

      // Show recorded video in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100); // collect data every 100ms
    setRecordingState('recording');
  }, [recordingState, stopStreamTracks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const resetRecording = useCallback(() => {
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
    chunksRef.current = [];

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.controls = false;
      videoRef.current.muted = true;
    }

    setRecordingState('idle');
  }, [recordedUrl, stopStreamTracks]);

  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopStreamTracks();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRecordingState('idle');
  }, [recordingState, stopStreamTracks]);

  return {
    recordingState,
    error,
    recordedBlob,
    recordedUrl,
    isInitializing: recordingState === 'initializing',
    isRecording: recordingState === 'recording',
    isStopped: recordingState === 'stopped',
    videoRef,
    startCamera,
    startRecording,
    stopRecording,
    resetRecording,
    stopCamera,
  };
}
