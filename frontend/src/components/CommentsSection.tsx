import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Loader2, LogIn } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { formatTimeAgo } from '../utils/formatters';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { toast } from 'sonner';
import type { Comment } from '../backend';
import type { Principal } from '@dfinity/principal';

interface CommentsSectionProps {
  videoId: string;
}

function CommentItem({ comment }: { comment: Comment }) {
  const { data: authorProfile } = useGetUserProfile(comment.author as Principal);

  const avatarUrl = authorProfile?.avatar ? convertBlobToDataURL(authorProfile.avatar) : undefined;
  const displayName = authorProfile?.name || (comment.author.toString().slice(0, 8) + '...');

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(Number(comment.timestamp))}</span>
        </div>
        <p className="text-sm text-foreground/90">{comment.content}</p>
      </div>
    </div>
  );
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const { identity, login } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const { data: userProfile } = useGetCallerUserProfile();

  const isIIAuthenticated = !!identity;
  const isGoogleAuthenticated = !!googleUser;
  const isAuthenticated = isIIAuthenticated || isGoogleAuthenticated;

  const { data: comments, isLoading } = useGetComments(videoId);
  const { mutate: addComment, isPending: isSubmitting } = useAddComment();

  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isIIAuthenticated) {
      toast.error('Please sign in with Internet Identity to post comments.');
      return;
    }

    addComment(
      { videoId, content: commentText.trim() },
      {
        onSuccess: () => setCommentText(''),
        onError: (err: any) => toast.error(err?.message || 'Failed to post comment'),
      }
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments {comments ? `(${comments.length})` : ''}
      </h3>

      {/* Comment Input Area */}
      {isIIAuthenticated && userProfile ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            {userProfile.avatar && (
              <AvatarImage src={convertBlobToDataURL(userProfile.avatar)} alt={userProfile.name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting || !commentText.trim()}>
                {isSubmitting ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Posting...</>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : isGoogleAuthenticated && !isIIAuthenticated ? (
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
          <Avatar className="h-8 w-8 shrink-0">
            {googleUser?.picture && <AvatarImage src={googleUser.picture} alt={googleUser.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(googleUser?.name || 'G')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Hi, {googleUser?.name}!</p>
            <p className="text-xs text-muted-foreground mb-2">
              To post comments, connect with Internet Identity — a secure, decentralized identity.
            </p>
            <Button size="sm" onClick={() => login()}>
              Connect Internet Identity
            </Button>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <LogIn className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Sign in to join the conversation.</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={() => {}}>
                <SiGoogle className="h-3.5 w-3.5" /> Google
              </Button>
              <Button size="sm" onClick={() => login()}>
                Internet Identity
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
