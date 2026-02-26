import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { CommunityPost } from '../backend';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useDeleteCommunityPost } from '../hooks/useDeleteCommunityPost';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { formatTimeAgo } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface CommunityPostCardProps {
  post: CommunityPost;
  showDelete?: boolean;
}

export default function CommunityPostCard({ post, showDelete = false }: CommunityPostCardProps) {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const authorPrincipal = post.author as Principal;
  const { data: profile, isLoading: profileLoading } = useGetUserProfile(authorPrincipal);
  const { mutate: deletePost, isPending: isDeleting } = useDeleteCommunityPost();

  const [isHovered, setIsHovered] = useState(false);

  const displayName = profile?.name || 'Unknown User';
  const handle = profile?.name
    ? '@' + profile.name.toLowerCase().replace(/\s+/g, '')
    : '@unknown';
  const channelDescription = profile?.channelDescription || '';

  const avatarBytes = profile?.avatar;
  const avatarDataUrl = avatarBytes ? convertBlobToDataURL(avatarBytes) : undefined;

  const imageUrl = post.attachment ? post.attachment.getDirectURL() : null;
  const timestamp = formatTimeAgo(Number(post.timestamp));

  return (
    <div
      className="relative bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete button */}
      {showDelete && isHovered && (
        <div className="absolute top-3 right-3 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deletePost')}</AlertDialogTitle>
                <AlertDialogDescription>{t('confirmDeletePost')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePost(post.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('confirmDelete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Author info */}
      <div className="flex items-start gap-3 mb-3">
        {profileLoading ? (
          <>
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="h-10 w-10 shrink-0">
              {avatarDataUrl && <AvatarImage src={avatarDataUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{displayName}</span>
                <span className="text-xs text-muted-foreground truncate">{handle}</span>
              </div>
              {channelDescription && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{channelDescription}</p>
              )}
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
          </>
        )}
      </div>

      {/* Post body */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">{post.body}</p>

      {/* Attached image */}
      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Post attachment"
            className="w-full object-cover max-h-80"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
