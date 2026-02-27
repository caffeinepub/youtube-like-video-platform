import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, Video, Music, X, Camera } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useUploadVideo } from '../hooks/useUploadVideo';
import CameraRecordingModal from '../components/CameraRecordingModal';
import MusicPickerPanel from '../components/MusicPickerPanel';
import { useMusicMixer } from '../hooks/useMusicMixer';
import type { MusicTrack } from '../types/music';

export default function UploadVideoPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const [uploadProgress, setUploadProgress] = useState(0);
  const { mutateAsync: uploadVideo, isPending } = useUploadVideo((pct) => setUploadProgress(pct));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isShort, setIsShort] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mixAudio, isMixing, mixProgress } = useMusicMixer();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Video className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign in to upload videos</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          You need to be signed in to upload videos to Mediatube.
        </p>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setError('');
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    const file = new File([blob], 'recorded-video.webm', { type: blob.type || 'video/webm' });
    setVideoFile(file);
    setShowCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!videoFile) {
      setError('Please select or record a video.');
      return;
    }

    try {
      let finalFile: File = videoFile;

      // Mix audio if music selected — mixAudio returns a Blob, wrap it as File
      if (selectedMusic) {
        try {
          const mixedBlob = await mixAudio(videoFile, selectedMusic.url);
          if (mixedBlob) {
            finalFile = new File([mixedBlob], videoFile.name, { type: videoFile.type });
          }
        } catch {
          // If mixing fails, proceed with original file
        }
      }

      // Get video duration
      const duration = await getVideoDuration(finalFile);

      await uploadVideo({
        title: title.trim(),
        description: description.trim(),
        duration: Math.round(duration),
        file: finalFile,
        isShort,
      });

      navigate({ to: '/' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-6 w-6 text-mt-magenta" />
        <h1 className="text-2xl font-bold">Upload Video</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={isPending || isMixing}
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your video"
            className="min-h-[100px] resize-none"
            disabled={isPending || isMixing}
          />
        </div>

        {/* Video Source */}
        <div className="space-y-2">
          <Label>Video Source *</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || isMixing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {videoFile ? videoFile.name : 'Choose File'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCamera(true)}
              disabled={isPending || isMixing}
            >
              <Camera className="h-4 w-4 mr-1" />
              Record
            </Button>
          </div>
          {videoFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span className="truncate">{videoFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto"
                onClick={() => setVideoFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Music */}
        <div className="space-y-2">
          <Label>Background Music (optional)</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMusicPicker(true)}
            disabled={isPending || isMixing}
            className="w-full"
          >
            <Music className="h-4 w-4 mr-2" />
            {selectedMusic ? `${selectedMusic.name} – ${selectedMusic.artist}` : 'Add Music'}
          </Button>
        </div>

        {/* Shorts toggle */}
        <div className="flex items-center gap-3">
          <Switch
            id="isShort"
            checked={isShort}
            onCheckedChange={setIsShort}
            disabled={isPending || isMixing}
          />
          <Label htmlFor="isShort">Upload as Short</Label>
        </div>

        {/* Progress */}
        {(isPending || isMixing) && (
          <div className="space-y-1">
            <Progress value={isMixing ? mixProgress : uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {isMixing ? `Mixing audio... ${mixProgress}%` : `Uploading... ${uploadProgress}%`}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={isPending || isMixing || !title.trim() || !videoFile}
          className="w-full bg-mt-magenta hover:bg-mt-purple text-white"
        >
          {isPending || isMixing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isMixing ? 'Mixing...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </form>

      {/* Music Picker */}
      <MusicPickerPanel
        open={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        selectedTrack={selectedMusic}
        onSelect={(track) => {
          setSelectedMusic(track);
          setShowMusicPicker(false);
        }}
      />

      {/* Camera Modal */}
      {showCamera && (
        <CameraRecordingModal
          onClose={() => setShowCamera(false)}
          onRecordingComplete={handleCameraCapture}
        />
      )}
    </div>
  );
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
