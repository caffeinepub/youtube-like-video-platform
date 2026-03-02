import React, { useRef, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useSetProfileImage } from '../hooks/useSetProfileImage';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useGetChannelVideos } from '../hooks/useGetChannelVideos';
import EditProfileModal from '../components/EditProfileModal';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { Camera, Edit2, Users, Video, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from '@tanstack/react-router';
import { Principal } from '@dfinity/principal';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isAuthenticated = !!identity || !!googleUser;
  const callerPrincipal: Principal | undefined = identity?.getPrincipal();

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { mutate: setProfileImage, isPending: uploadingImage } = useSetProfileImage();

  const { data: subscribers } = useGetSubscribers(
    callerPrincipal ?? Principal.anonymous()
  );
  const { data: channelVideos } = useGetChannelVideos(
    callerPrincipal ?? Principal.anonymous()
  );

  const handleAvatarClick = () => {
    if (!isAuthenticated) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    setProfileImage(uint8Array);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarUrl = userProfile?.avatar
    ? convertBlobToDataURL(userProfile.avatar)
    : null;

  const displayName = userProfile?.name || googleUser?.name || 'Your Channel';
  const handle = userProfile?.handle
    ? `@${userProfile.handle}`
    : (googleUser?.email ? `@${googleUser.email.split('@')[0]}` : '@handle');

  const subscriberCount = callerPrincipal ? (subscribers?.length ?? 0) : 0;
  const videoCount = callerPrincipal ? (channelVideos?.length ?? 0) : 0;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-mt-charcoal-800 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-mt-charcoal-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-mt-charcoal-400 mb-6">
            Create and manage your channel, upload videos, and connect with your audience.
          </p>
          <Button
            onClick={() => navigate({ to: '/login' })}
            className="gap-2 bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading || !isFetched) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="w-32 h-32 rounded-full bg-mt-charcoal-800" />
          <Skeleton className="h-8 w-48 bg-mt-charcoal-800" />
          <Skeleton className="h-4 w-32 bg-mt-charcoal-800" />
          <div className="flex gap-8">
            <Skeleton className="h-16 w-24 bg-mt-charcoal-800" />
            <Skeleton className="h-16 w-24 bg-mt-charcoal-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="w-full h-40 rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-mt-red-900 via-mt-charcoal-800 to-mt-charcoal-900">
        <img
          src="/assets/generated/default-channel-banner.dim_1280x200.png"
          alt="Channel banner"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 px-4 mb-8">
        {/* Avatar */}
        <div className="relative group">
          <button
            onClick={handleAvatarClick}
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg focus:outline-none focus:ring-2 focus:ring-mt-red-500"
            title="Change profile picture"
            disabled={uploadingImage}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-mt-red-500 flex items-center justify-center text-white text-4xl font-bold">
                {getInitials(displayName)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingImage ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Channel Info */}
        <div className="flex-1 text-center sm:text-left pb-2">
          <h1 className="text-3xl font-display font-bold text-foreground">{displayName}</h1>
          <p className="text-mt-charcoal-400 text-lg">{handle}</p>
          {userProfile?.channelDescription && (
            <p className="text-sm text-mt-charcoal-400 mt-1 max-w-md line-clamp-2">
              {userProfile.channelDescription}
            </p>
          )}
        </div>

        {/* Edit Button */}
        {identity && userProfile && (
          <div className="pb-2">
            <Button
              onClick={() => setEditModalOpen(true)}
              variant="outline"
              className="gap-2 border-mt-charcoal-700 text-mt-charcoal-200 hover:bg-mt-charcoal-800 hover:border-mt-red-500 rounded-full"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 text-center shadow-card">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-5 h-5 text-mt-red-500" />
            <span className="text-2xl font-display font-bold text-foreground">{subscriberCount.toLocaleString()}</span>
          </div>
          <p className="text-sm text-mt-charcoal-400">Subscribers</p>
        </div>
        <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 text-center shadow-card">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Video className="w-5 h-5 text-mt-red-500" />
            <span className="text-2xl font-display font-bold text-foreground">{videoCount.toLocaleString()}</span>
          </div>
          <p className="text-sm text-mt-charcoal-400">Videos</p>
        </div>
      </div>

      {/* Principal ID */}
      {callerPrincipal && (
        <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 mb-8">
          <p className="text-xs text-mt-charcoal-500 mb-1 font-medium uppercase tracking-wide">Principal ID</p>
          <p className="text-sm font-mono break-all text-mt-charcoal-300">{callerPrincipal.toString()}</p>
        </div>
      )}

      {/* Google User Info */}
      {googleUser && !identity && (
        <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 mb-8">
          <p className="text-xs text-mt-charcoal-500 mb-1 font-medium uppercase tracking-wide">Google Account</p>
          <p className="text-sm font-medium text-foreground">{googleUser.name}</p>
          <p className="text-sm text-mt-charcoal-400">{googleUser.email}</p>
        </div>
      )}

      {/* Edit Profile Modal */}
      {identity && userProfile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}
