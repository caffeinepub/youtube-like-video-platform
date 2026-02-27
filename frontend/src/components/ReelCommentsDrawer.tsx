import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Send } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { formatTimeAgo } from '../utils/formatters';
import type { Principal } from '@dfinity/principal';
import type { Comment } from '../backend';

interface ReelCommentsDrawerProps {
  videoId: string;
  onClose: () => void;
}

function CommentRow({ comment }: { comment: Comment }) {
  const { data: profile } = useGetUserProfile(comment.author as unknown as Principal);
  const avatarUrl = profile?.avatar ? convertBlobToDataURL(profile.avatar) : null;
  return (
    <div className="flex gap-2 py-2">
      <Avatar className="h-7 w-7 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-xs bg-muted">{getInitials(profile?.name || '?')}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">{profile?.name || 'Anonymous'}</span>
          <span className="text-xs text-white/50">{formatTimeAgo(Number(comment.timestamp))}</span>
        </div>
        <p className="text-sm text-white/90 break-words">{comment.content}</p>
      </div>
    </div>
  );
}

export default function ReelCommentsDrawer({ videoId, onClose }: ReelCommentsDrawerProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: comments = [], isLoading } = useGetComments(videoId);
  const { mutateAsync: addComment, isPending } = useAddComment();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isAuthenticated) return;
    try {
      await addComment({ videoId, content: text.trim() });
      setText('');
    } catch {
      // handled by mutation
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm rounded-t-2xl max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">
            {comments.length} Comments
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/50" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-8">No comments yet</p>
          ) : (
            comments.map((c) => <CommentRow key={c.id} comment={c} />)
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9"
                disabled={isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || isPending}
                className="h-9 w-9 bg-mt-magenta hover:bg-mt-purple"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <p className="text-white/50 text-sm text-center">Sign in to comment</p>
          )}
        </div>
      </div>
    </>
  );
}
