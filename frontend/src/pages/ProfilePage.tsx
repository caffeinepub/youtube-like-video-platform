import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useGetChannelVideos } from '../hooks/useGetChannelVideos';
import { useGetSubscribers } from '../hooks/useGetSubscribers';
import { useSetProfileImage } from '../hooks/useSetProfileImage';
import { useGetCommunityPostsByChannel } from '../hooks/useGetCommunityPostsByChannel';
import { useNavigate } from '@tanstack/react-router';
import { useRef } from 'react';
import { Principal } from '@dfinity/principal';
import VideoCard from '../components/VideoCard';
import CommunityPostCard from '../components/CommunityPostCard';
import ProfileSetupModal from '../components/ProfileSetupModal';
import EditProfileModal from '../components/EditProfileModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Users, Video, LogIn, MessageSquare, Pencil } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

export default function ProfilePage() {
  const { identity, login } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;
  const isAuthenticated = isIIAuthenticated || isGoogleAuthenticated;

  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { mutate: setProfileImage, isPending: isUploadingAvatar } = useSetProfileImage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if Google user needs profile setup
  const googleProfileSetupKey = googleUser ? `google_profile_setup_${googleUser.sub}` : null;
  const googleNeedsSetup =
    isGoogleAuthenticated &&
    !isIIAuthenticated &&
    !!googleProfileSetupKey &&
    !localStorage.getItem(googleProfileSetupKey);

  // Resolve the caller's Principal for II users
  const callerPrincipal: Principal | undefined = isIIAuthenticated
    ? identity?.getPrincipal()
    : undefined;

  // Always call hooks at top level; pass anonymous principal as fallback (queries disabled when undefined)
  const { data: channelVideos, isLoading: videosLoading } = useGetChannelVideos(
    callerPrincipal ?? Principal.anonymous()
  );
  const { data: subscribers } = useGetSubscribers(
    callerPrincipal ?? Principal.anonymous()
  );
  const { data: communityPosts, isLoading: postsLoading } = useGetCommunityPostsByChannel(
    callerPrincipal
  );

  // Determine display info
  const googleProfileName = googleUser
    ? localStorage.getItem(`google_profile_name_${googleUser.sub}`) || googleUser.name
    : null;
  const googleProfileDesc = googleUser
    ? localStorage.getItem(`google_profile_desc_${googleUser.sub}`) || ''
    : null;

  const displayName = isIIAuthenticated
    ? userProfile?.name || 'User'
    : googleProfileName || googleUser?.name || 'User';

  const displayDescription = isIIAuthenticated
    ? userProfile?.channelDescription || ''
    : googleProfileDesc || '';

  const displayHandle = isIIAuthenticated && userProfile?.handle
    ? userProfile.handle
    : null;

  const avatarBytes = isIIAuthenticated && userProfile?.avatar ? userProfile.avatar : undefined;
  const avatarDataUrl = avatarBytes ? convertBlobToDataURL(avatarBytes) : undefined;
  const googleAvatarUrl = isGoogleAuthenticated ? googleUser?.picture : undefined;
  const finalAvatarUrl = avatarDataUrl || googleAvatarUrl;

  const handleAvatarClick = () => {
    if (isIIAuthenticated) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error('Avatar must be under 512 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (result instanceof ArrayBuffer) {
        setProfileImage(new Uint8Array(result));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <LogIn className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-muted-foreground mb-6">
          Sign in with Google or Internet Identity to access your channel.
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

  if (isIIAuthenticated && profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup for II users without a profile
  if (isIIAuthenticated && profileFetched && userProfile === null) {
    return <ProfileSetupModal onComplete={() => {}} />;
  }

  // Show profile setup for Google users who haven't completed setup
  if (googleNeedsSetup) {
    return (
      <ProfileSetupModal
        onComplete={() => {
          if (googleProfileSetupKey) {
            localStorage.setItem(googleProfileSetupKey, 'true');
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <Avatar className="h-24 w-24">
            {finalAvatarUrl && <AvatarImage src={finalAvatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {isIIAuthenticated && (
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isUploadingAvatar ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {isGoogleAuthenticated && !isIIAuthenticated && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <SiGoogle className="h-3 w-3" /> Google
              </span>
            )}
            {/* Edit Profile button — only for II users */}
            {isIIAuthenticated && userProfile && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 ml-1"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Handle */}
          {isIIAuthenticated && displayHandle && (
            <p className="text-sm text-muted-foreground mb-1">@{displayHandle}</p>
          )}
          {isIIAuthenticated && !displayHandle && (
            <p className="text-sm text-muted-foreground mb-1">
              @{(userProfile?.name || 'user').toLowerCase().replace(/\s+/g, '')}
            </p>
          )}

          {displayDescription && (
            <p className="text-muted-foreground text-sm mb-3 max-w-lg">{displayDescription}</p>
          )}

          {isIIAuthenticated && (
            <div className="flex items-center gap-4 justify-center sm:justify-start text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {subscribers?.length ?? 0} subscribers
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {channelVideos?.length ?? 0} videos
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {communityPosts?.length ?? 0} posts
              </span>
            </div>
          )}

          {isGoogleAuthenticated && !isIIAuthenticated && (
            <div className="mt-3 p-3 bg-muted rounded-lg text-sm max-w-md">
              <p className="font-medium mb-1">Want full channel features?</p>
              <p className="text-muted-foreground text-xs mb-2">
                Connect with Internet Identity to upload videos, manage playlists, and track
                subscribers.
              </p>
              <Button size="sm" onClick={() => login()}>
                Connect Internet Identity
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isIIAuthenticated && userProfile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          currentProfile={userProfile}
        />
      )}

      {/* Tabs — only for II users */}
      {isIIAuthenticated && (
        <Tabs defaultValue="videos">
          <TabsList className="mb-6">
            <TabsTrigger value="videos" className="flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              {t('videos') || 'Videos'}
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {t('community')}
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="aspect-video rounded-lg" />
                ))}
              </div>
            ) : channelVideos && channelVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No videos uploaded yet.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate({ to: '/upload' })}
                >
                  Upload your first video
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community">
            {postsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : communityPosts && communityPosts.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {communityPosts.map((post) => (
                  <CommunityPostCard key={post.id} post={post} showDelete={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t('noCommunityPosts')}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate({ to: '/community' })}
                >
                  Create your first post
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
