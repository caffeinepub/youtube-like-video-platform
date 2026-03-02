import React, { useState } from 'react';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { formatTimeAgo } from '../utils/formatters';
import { convertBlobToDataURL } from '../utils/avatarHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MessageSquare, Send } from 'lucide-react';

interface CommentItemProps {
  comment: {
    id: string;
    author: import('@dfinity/principal').Principal;
    content: string;
    timestamp: bigint;
  };
}

function CommentItem({ comment }: CommentItemProps) {
  const { data: profile } = useGetUserProfile(comment.author);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      if (profile?.avatar) {
        const url = await convertBlobToDataURL(profile.avatar);
        setAvatarUrl(url);
      }
    }
    load();
  }, [profile]);

  const name = profile?.name || comment.author.toString().slice(0, 8) + '...';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 py-3 border-b border-mt-charcoal-800 last:border-0">
      <Avatar className="w-8 h-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="bg-mt-charcoal-700 text-mt-charcoal-300 text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs text-mt-charcoal-500">
            {formatTimeAgo(Number(comment.timestamp) / 1_000_000)}
          </span>
        </div>
        <p className="text-sm text-mt-charcoal-200 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useGetComments(videoId);
  const { mutate: addComment, isPending } = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment({ videoId, content: newComment.trim() }, {
      onSuccess: () => setNewComment(''),
    });
  };

  return (
    <div className="bg-mt-charcoal-900 rounded-xl p-4 border border-mt-charcoal-800">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-mt-red-500" />
        <h3 className="text-base font-display font-bold text-foreground">
          Comments {comments && <span className="text-mt-charcoal-400 font-normal text-sm">({comments.length})</span>}
        </h3>
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 h-10 px-4 bg-mt-charcoal-800 border border-mt-charcoal-700 rounded-full text-sm text-foreground placeholder:text-mt-charcoal-500 focus:outline-none focus:border-mt-red-500 focus:ring-1 focus:ring-mt-red-500 transition-colors"
          />
          <Button
            type="submit"
            disabled={isPending || !newComment.trim()}
            size="sm"
            className="bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full px-4"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-mt-charcoal-400 mb-4 italic">Sign in to leave a comment</p>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-mt-charcoal-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/4 bg-mt-charcoal-800" />
                <Skeleton className="h-4 w-3/4 bg-mt-charcoal-800" />
              </div>
            </div>
          ))}
        </div>
      ) : comments?.length === 0 ? (
        <p className="text-sm text-mt-charcoal-500 text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div>
          {comments?.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
