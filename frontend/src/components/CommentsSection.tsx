import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { formatTimeAgo } from '../utils/formatters';
import { toast } from 'sonner';

interface CommentsSectionProps {
  videoId: string;
}

function CommentItem({ comment }: { comment: any }) {
  const { data: profile } = useGetUserProfile(comment.author);
  const authorName = profile?.name || 'Anonymous';

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-gradient-to-br from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] text-white">
          {authorName[0]?.toUpperCase() || 'A'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(Number(comment.timestamp))}
          </span>
        </div>
        <p className="text-sm text-foreground/90">{comment.content}</p>
      </div>
    </div>
  );
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const { identity } = useInternetIdentity();
  const { data: comments, isLoading } = useGetComments(videoId);
  const { mutate: addComment, isPending } = useAddComment();

  const isAuthenticated = !!identity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    addComment(
      { videoId, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          toast.success('Comment posted!');
        },
        onError: (error) => {
          toast.error('Failed to post comment: ' + error.message);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{comments?.length || 0} Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated && (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.28_340)] text-white">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} size="sm" className="gap-2">
                  <Send className="w-4 h-4" />
                  {isPending ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Please log in to leave a comment
          </p>
        )}

        <div className="divide-y divide-border">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
