import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useNavigate } from '@tanstack/react-router';
import { useUploadVideo } from '../hooks/useUploadVideo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, Loader2, Camera, LogIn, Music, Music2, X, CheckCircle2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { toast } from 'sonner';
import CameraRecordingModal from '../components/CameraRecordingModal';
import MusicPickerPanel from '../components/MusicPickerPanel';
import { MusicTrack } from '../types/music';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

const MAX_SHORT_DURATION = 60;

export default function UploadVideoPage() {
  const { identity, login } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = useMemo(() => (key: string) => getTranslation(currentLanguage, key), [currentLanguage]);

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;
  const isAuthenticated = isIIAuthenticated || isGoogleAuthenticated;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [isShort, setIsShort] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [fromCamera, setFromCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadVideo, isPending: isUploading } = useUploadVideo(setUploadProgress);

  const extractDuration = useCallback((file: File): Promise<number> =>
    new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        resolve(Math.round(videoEl.duration));
        URL.revokeObjectURL(videoEl.src);
      };
      videoEl.onerror = () => resolve(0);
      videoEl.src = URL.createObjectURL(file);
    }), []);

  // Check for pre-loaded blob from ReelsPage (stored in sessionStorage)
  useEffect(() => {
    const blobUrl = sessionStorage.getItem('recordedBlobUrl');
    const blobIsShort = sessionStorage.getItem('recordedIsShort');

    if (blobUrl) {
      // Clean up sessionStorage immediately
      sessionStorage.removeItem('recordedBlobUrl');
      sessionStorage.removeItem('recordedIsShort');

      fetch(blobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'recorded-reel.webm', { type: blob.type || 'video/webm' });
          setVideoFile(file);
          setFromCamera(true);
          setTitle((prev) => prev || 'My Recording');
          if (blobIsShort === 'true') {
            setIsShort(true);
          }
          extractDuration(file).then((d) => setDuration(d));
        })
        .catch(() => {
          // Blob URL may have expired, ignore
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setVideoFile(file);
    setFromCamera(false);
    const d = await extractDuration(file);
    setDuration(d);
  }, [extractDuration]);

  // Called when user confirms a camera recording in the modal
  const handleCameraRecording = useCallback((blob: Blob) => {
    const file = new File([blob], 'recording.webm', { type: blob.type || 'video/webm' });
    setVideoFile(file);
    setFromCamera(true);
    setShowCameraModal(false);

    // Auto-populate title with a sensible default only if the field is empty
    setTitle((prev) => (prev.trim() === '' ? 'My Recording' : prev));

    extractDuration(file).then((d) => {
      setDuration(d);
      if (d <= MAX_SHORT_DURATION) {
        setIsShort(true);
        toast.success('Recording ready! Marked as Short — fill in the details and upload.');
      } else {
        setIsShort(false);
        toast.success(
          `Recording ready! ${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')} — fill in the details and upload.`,
          { duration: 5000 }
        );
      }
    });
  }, [extractDuration]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (!videoFile) { toast.error('Please select a video file'); return; }

    uploadVideo(
      { title: title.trim(), description: description.trim(), duration, file: videoFile, isShort },
      {
        onSuccess: () => {
          toast.success('Video uploaded successfully!');
          navigate({ to: '/' });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Upload failed';
          toast.error(message);
          setUploadProgress(0);
        },
      }
    );
  }, [title, description, duration, videoFile, isShort, uploadVideo, navigate]);

  const handleOpenCamera = useCallback(() => setShowCameraModal(true), []);
  const handleCloseCamera = useCallback(() => setShowCameraModal(false), []);
  const handleOpenMusicPicker = useCallback(() => setShowMusicPicker(true), []);
  const handleCloseMusicPicker = useCallback(() => setShowMusicPicker(false), []);
  const handleClearMusic = useCallback(() => setSelectedMusic(null), []);
  const handleFilePickerClick = useCallback(() => fileInputRef.current?.click(), []);

  // Not authenticated at all
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <LogIn className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to upload</h2>
        <p className="text-muted-foreground mb-6">
          You need to sign in to upload videos to Mediatube.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2"
          >
            <SiGoogle className="h-4 w-4" /> Sign in with Google
          </Button>
          <Button onClick={() => login()}>Sign in with Internet Identity</Button>
        </div>
      </div>
    );
  }

  // Google-only user — II required for uploads
  if (isGoogleAuthenticated && !isIIAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Internet Identity Required</h2>
        <p className="text-muted-foreground mb-2">
          Hi, <strong>{googleUser?.name}</strong>! To upload videos, you need to connect with
          Internet Identity.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Internet Identity provides a secure, decentralized identity for storing your content on
          the blockchain.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => login()} size="lg">
            Connect Internet Identity
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="h-6 w-6 text-primary" /> Upload Video
      </h1>

      {/* Camera recording ready banner */}
      {fromCamera && videoFile && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Recording ready to upload</p>
            <p className="text-xs text-muted-foreground">
              Review the details below and tap "Upload Video" when ready.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-title">Title *</Label>
          <Input
            id="upload-title"
            name="upload-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter video title"
            required
            disabled={isUploading}
            autoComplete="off"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-description">Description</Label>
          <Textarea
            id="upload-description"
            name="upload-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe your video..."
            rows={4}
            disabled={isUploading}
            autoComplete="off"
          />
        </div>

        {/* Video Source — single unified label for both file upload and camera */}
        <div className="space-y-1.5">
          <Label>Video Source *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 truncate"
              onClick={handleFilePickerClick}
              disabled={isUploading}
            >
              <Video className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">
                {videoFile && !fromCamera ? videoFile.name : fromCamera ? 'Camera Recording' : 'Select File'}
              </span>
            </Button>
            <Button
              type="button"
              variant={fromCamera && videoFile ? 'default' : 'outline'}
              onClick={handleOpenCamera}
              title="Record with Camera"
              disabled={isUploading}
              className={fromCamera && videoFile ? 'bg-primary text-primary-foreground' : ''}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {videoFile && (
            <p className="text-xs text-muted-foreground">
              {fromCamera ? 'Camera recording' : videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              {duration > 0 &&
                ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
            </p>
          )}
        </div>

        {/* Mark as Short */}
        <div className="flex items-center gap-3">
          <Switch
            id="is-short"
            checked={isShort}
            onCheckedChange={setIsShort}
            disabled={isUploading}
          />
          <Label htmlFor="is-short" className="cursor-pointer">
            Mark as Short (≤60 seconds)
          </Label>
        </div>

        {/* Add Music (shown when isShort is enabled) */}
        {isShort && (
          <div className="space-y-1.5">
            <Label>Background Music</Label>
            {selectedMusic ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/50 bg-primary/5">
                <Music className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedMusic.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedMusic.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleOpenMusicPicker}
                    disabled={isUploading}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleClearMusic}
                    disabled={isUploading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleOpenMusicPicker}
                disabled={isUploading}
              >
                <Music2 className="w-4 h-4" />
                {t('addMusic')}
              </Button>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={isUploading || !title.trim() || !videoFile}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </form>

      {/* Camera Recording Modal — rendered outside the form to avoid focus interference */}
      {showCameraModal && (
        <CameraRecordingModal
          open={showCameraModal}
          onClose={handleCloseCamera}
          onRecordingComplete={handleCameraRecording}
        />
      )}

      {/* Music Picker Panel */}
      <MusicPickerPanel
        open={showMusicPicker}
        onClose={handleCloseMusicPicker}
        selectedTrack={selectedMusic}
        onSelect={setSelectedMusic}
      />
    </div>
  );
}
