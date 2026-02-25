import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useUploadVideo } from '../hooks/useUploadVideo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, AlertCircle, Loader2, CheckCircle, Zap, Camera } from 'lucide-react';
import { toast } from 'sonner';
import CameraRecordingModal from '../components/CameraRecordingModal';

const MAX_SHORT_DURATION = 60; // seconds

export default function UploadVideoPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShort, setIsShort] = useState(false);
  const [shortDurationWarning, setShortDurationWarning] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadVideo, isPending, isSuccess } = useUploadVideo(setUploadProgress);

  const extractDurationFromFile = (file: File, onDuration: (d: number) => void) => {
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      const detectedDuration = Math.round(videoEl.duration);
      onDuration(detectedDuration);
      URL.revokeObjectURL(videoEl.src);
    };
    videoEl.src = URL.createObjectURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    setVideoFile(file);
    setShortDurationWarning(false);

    extractDurationFromFile(file, (detectedDuration) => {
      setDuration(detectedDuration);
      if (isShort && detectedDuration > MAX_SHORT_DURATION) {
        setShortDurationWarning(true);
      }
    });
  };

  const handleCameraRecordingComplete = (blob: Blob) => {
    // Convert blob to File with a proper name and MIME type
    const mimeType = blob.type || 'video/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `camera-recording-${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: mimeType });

    setVideoFile(file);
    setShortDurationWarning(false);

    extractDurationFromFile(file, (detectedDuration) => {
      setDuration(detectedDuration);

      if (detectedDuration > MAX_SHORT_DURATION) {
        // Duration exceeds 60s — cannot be a Short
        setIsShort(false);
        setShortDurationWarning(false);
        toast.warning(
          `Recording is ${Math.floor(detectedDuration / 60)}:${String(detectedDuration % 60).padStart(2, '0')} long — too long for a Short (max 60s). "Mark as Short" has been unchecked.`,
          { duration: 5000 }
        );
      } else {
        // Auto-enable Short for camera recordings within the limit
        setIsShort(true);
        setShortDurationWarning(false);
        toast.success('Recording ready! Marked as Short — fill in the details and upload.');
      }
    });
  };

  const handleIsShortChange = (checked: boolean) => {
    setIsShort(checked);
    if (checked && duration > MAX_SHORT_DURATION) {
      setShortDurationWarning(true);
    } else {
      setShortDurationWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIIAuthenticated) {
      toast.error('Please connect your wallet to upload videos');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a video title');
      return;
    }

    if (!videoFile) {
      toast.error('Please select or record a video');
      return;
    }

    uploadVideo(
      {
        title: title.trim(),
        description: description.trim(),
        duration,
        file: videoFile,
        isShort,
      },
      {
        onSuccess: (videoId) => {
          toast.success('Video uploaded successfully!');
          setTimeout(() => navigate({ to: '/video/$videoId', params: { videoId } }), 1500);
        },
        onError: () => {
          toast.error('Failed to upload video. Please try again.');
          setUploadProgress(0);
        },
      }
    );
  };

  // Not authenticated at all
  if (!isIIAuthenticated && !isGoogleAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Sign in to Upload</h1>
        <p className="text-muted-foreground">
          You need to sign in to upload videos to Mediatube.
        </p>
      </div>
    );
  }

  // Google authenticated but no wallet
  if (!isIIAuthenticated && isGoogleAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Wallet Connection Required</h1>
        <p className="text-muted-foreground mb-6">
          Hi {googleUser?.name}! To upload videos, you need to connect your wallet (Internet Identity).
          This ensures your videos are securely stored on the blockchain.
        </p>
        <p className="text-sm text-muted-foreground">
          Use the <strong>Connect Wallet</strong> button in the header to get started.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Upload Complete!</h1>
        <p className="text-muted-foreground">Redirecting to your video...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Video</h1>
        <p className="text-muted-foreground">Share your content with the Mediatube community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video file upload */}
        <div className="space-y-2">
          <Label>Video File *</Label>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              videoFile
                ? 'border-primary/50 bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            {videoFile ? (
              <div className="flex items-center justify-center gap-3">
                <Video className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    {duration > 0 &&
                      ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Click to select a video</p>
                <p className="text-xs text-muted-foreground">MP4, WebM, MOV supported</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Divider with OR */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Record & Upload Short button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60"
            onClick={() => setShowCameraModal(true)}
            disabled={isPending}
          >
            <Camera className="w-4 h-4" />
            Record &amp; Upload Short
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Record directly from your camera — automatically marked as a Short (≤60s)
          </p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={isPending}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your video (optional)"
            rows={4}
            className="resize-none"
            disabled={isPending}
          />
        </div>

        {/* Mark as Short toggle */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="is-short" className="text-sm font-medium cursor-pointer">
                  Mark as Short
                </Label>
                <p className="text-xs text-muted-foreground">
                  Shorts are vertical videos up to 60 seconds
                </p>
              </div>
            </div>
            <Switch
              id="is-short"
              checked={isShort}
              onCheckedChange={handleIsShortChange}
              disabled={isPending}
            />
          </div>

          {/* Duration warning */}
          {isShort && shortDurationWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This video is longer than 60 seconds ({Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}).
                Shorts should be 60 seconds or less. You can still upload, but it may not display correctly as a Short.
              </p>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {isPending && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="text-foreground font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !title.trim() || !videoFile}
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </form>

      {/* Camera Recording Modal */}
      <CameraRecordingModal
        open={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onRecordingComplete={handleCameraRecordingComplete}
      />
    </div>
  );
}
