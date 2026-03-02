import React, { useState, useEffect } from 'react';
import { CommunityPost } from '../backend';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useDeleteCommunityPost } from '../hooks/useDeleteCommunityPost';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { formatTimeAgo } from '../utils/formatters';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Trash2 } from 'lucide-react';

interface CommunityPostCardProps {
  post: CommunityPost;
  showDelete?: boolean;
}

export default function CommunityPostCard({ post, showDelete = false }: CommunityPostCardProps) {
  const { data: profile } = useGetUserProfile(post.author);
  const { mutate: deletePost, isPending } = useDeleteCommunityPost();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (profile?.avatar) {
        const url = await convertBlobToDataURL(profile.avatar);
        setAvatarUrl(url);
      }
    }
    load();
  }, [profile]);

  useEffect(() => {
    if (post.attachment) {
      setAttachmentUrl(post.attachment.getDirectURL());
    }
  }, [post.attachment]);

  const name = profile?.name || post.author.toString().slice(0, 8) + '...';
  const handle = profile?.handle || '';
  const initials = name.slice(0, 2).toUpperCase();
  const timestampMs = Number(post.timestamp) / 1_000_000;

  return (
    <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 shadow-card hover:border-mt-charcoal-700 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-mt-charcoal-700 text-mt-charcoal-300 text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-semibold text-foreground">{name}</span>
              {handle && (
                <span className="text-xs text-mt-charcoal-500 ml-1.5">@{handle}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-mt-charcoal-500">{formatTimeAgo(timestampMs)}</span>
              {showDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-mt-charcoal-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-mt-charcoal-800 border-mt-charcoal-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete Post</AlertDialogTitle>
                      <AlertDialogDescription className="text-mt-charcoal-400">
                        Are you sure you want to delete this post? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-mt-charcoal-700 border-mt-charcoal-600 text-foreground hover:bg-mt-charcoal-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePost(post.id)}
                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <p className="text-sm text-mt-charcoal-200 leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {attachmentUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-mt-charcoal-700">
              <img
                src={attachmentUrl}
                alt="Post attachment"
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
