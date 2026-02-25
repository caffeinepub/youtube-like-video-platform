import React, { useState } from 'react';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, LogIn } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';
import type { Comment } from '../backend';
import type { Principal } from '@dfinity/principal';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const { data: authorProfile } = useGetUserProfile(comment.author as Principal);

  const avatarSrc =
    authorProfile?.avatar && authorProfile.avatar.length > 0
      ? convertBlobToDataURL(authorProfile.avatar)
      : undefined;

  const displayName = authorProfile?.name || 'Anonymous';

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(Number(comment.timestamp))}
          </span>
        </div>
        <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
      </div>
    </div>
  );
}

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;

  const { data: comments = [], isLoading } = useGetComments(videoId);
  const { mutate: addComment, isPending } = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isIIAuthenticated) return;

    addComment(
      { videoId, content: commentText.trim() },
      {
        onSuccess: () => setCommentText(''),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment form */}
      {isIIAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="resize-none"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        </form>
      ) : isGoogleAuthenticated ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <LogIn className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Connect your wallet to post comments
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <LogIn className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Sign in to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
