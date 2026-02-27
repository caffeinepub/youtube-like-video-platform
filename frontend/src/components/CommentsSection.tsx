import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { formatTimeAgo } from '../utils/formatters';
import type { Principal } from '@dfinity/principal';
import type { Comment } from '../backend';

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const { data: authorProfile } = useGetUserProfile(comment.author as unknown as Principal);
  const avatarUrl = authorProfile?.avatar ? convertBlobToDataURL(authorProfile.avatar) : null;

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-xs bg-muted">
          {getInitials(authorProfile?.name || '?')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{authorProfile?.name || 'Anonymous'}</span>
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
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: comments = [], isLoading } = useGetComments(videoId);
  const { mutateAsync: addComment, isPending } = useAddComment();
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    try {
      await addComment({ videoId, content: commentText.trim() });
      setCommentText('');
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        {comments.length} Comments
      </h3>

      {/* Comment Input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {googleUser?.picture && <AvatarImage src={googleUser.picture} />}
            <AvatarFallback className="text-xs bg-primary/20">
              {googleUser ? getInitials(googleUser.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px] resize-none"
              disabled={isPending}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCommentText('')}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Comment'
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No comments yet. Be the first to comment!
        </p>
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
