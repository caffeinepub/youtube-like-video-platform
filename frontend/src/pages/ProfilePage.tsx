import React, { useRef, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useGetChannelVideos } from '../hooks/useGetChannelVideos';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useSetProfileImage } from '../hooks/useSetProfileImage';
import VideoCard from '../components/VideoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Video, Users, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';

const MAX_IMAGE_SIZE = 512 * 1024; // 512 KB

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;

  const callerPrincipal: Principal | undefined = identity
    ? identity.getPrincipal()
    : undefined;

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: channelVideos = [], isLoading: videosLoading } = useGetChannelVideos(
    callerPrincipal ?? Principal.anonymous()
  );
  const { data: subscribers = [], isLoading: subscribersLoading } = useGetSubscribers(
    callerPrincipal ?? Principal.anonymous()
  );

  const { mutate: setProfileImage, isPending: imageUploading } = useSetProfileImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be 512 KB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        setPreviewUrl(URL.createObjectURL(file));
        setProfileImage(bytes);
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Not authenticated at all
  if (!isIIAuthenticated && !isGoogleAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Sign in to view your profile</h1>
        <p className="text-muted-foreground">
          Connect your wallet or sign in with Google to access your profile.
        </p>
      </div>
    );
  }

  // Google authenticated but no wallet - show Google profile info
  if (!isIIAuthenticated && isGoogleAuthenticated) {
    const storedProfile = (() => {
      try {
        const raw = localStorage.getItem(`google_profile_${googleUser?.sub}`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    const displayName = storedProfile?.name || googleUser?.name || 'Google User';

    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          <Avatar className="w-20 h-20">
            <AvatarImage src={googleUser?.picture} alt={displayName} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">{displayName}</h1>
            <p className="text-muted-foreground text-sm mb-3">{googleUser?.email}</p>
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Connect your wallet to upload videos and manage your channel</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // II authenticated - full profile
  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-6 mb-10">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || 'My Channel';

  // Determine avatar source: preview > stored avatar > google picture > initials
  const avatarSrc = previewUrl
    ? previewUrl
    : userProfile?.avatar && userProfile.avatar.length > 0
    ? convertBlobToDataURL(userProfile.avatar)
    : googleUser?.picture || undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        {/* Avatar with upload control */}
        <div className="relative group/avatar">
          <Avatar className="w-20 h-20">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {/* Upload overlay */}
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={imageUploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            title="Change profile photo"
          >
            {imageUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-1">{displayName}</h1>
          {userProfile?.channelDescription && (
            <p className="text-muted-foreground text-sm mb-3">{userProfile.channelDescription}</p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {subscribersLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span>
                  {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              {videosLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span>
                  {channelVideos.length} video{channelVideos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <Camera className="w-3 h-3 inline mr-1" />
            Hover over your avatar to change your profile photo (max 512 KB)
          </p>
        </div>
      </div>

      {/* Videos section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Uploaded Videos</h2>
        {videosLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : channelVideos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Video className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No videos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
