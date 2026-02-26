import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetComments } from '../hooks/useGetComments';
import { useAddComment } from '../hooks/useAddComment';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetUserProfile } from '../hooks/useGetUserProfile';
import { formatTimeAgo } from '../utils/formatters';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import type { Comment } from '../backend';
import type { Principal } from '@dfinity/principal';

interface ReelCommentsDrawerProps {
  videoId: string;
  onClose: () => void;
}

function CommentItem({ comment }: { comment: Comment }) {
  const { data: authorProfile } = useGetUserProfile(comment.author as Principal);
  const authorName = authorProfile?.name || 'User';
  const avatarSrc =
    authorProfile?.avatar && authorProfile.avatar.length > 0
      ? convertBlobToDataURL(authorProfile.avatar)
      : undefined;

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="w-8 h-8 shrink-0">
        {avatarSrc && <AvatarImage src={avatarSrc} alt={authorName} />}
        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(Number(comment.timestamp))}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 break-words">{comment.content}</p>
      </div>
    </div>
  );
}

export default function ReelCommentsDrawer({ videoId, onClose }: ReelCommentsDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: comments = [], isLoading } = useGetComments(videoId);
  const { mutate: addComment, isPending } = useAddComment();

  // Sort comments newest first
  const sortedComments = [...comments].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isPending) return;
    addComment(
      { videoId, content: trimmed },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  // Stop touch events from propagating to the reel scroll container
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-2xl shadow-2xl"
        style={{ maxHeight: '70vh', height: '70vh' }}
        onTouchMove={handleTouchMove}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base text-foreground">
              Comments
              {comments.length > 0 && (
                <span className="ml-1.5 text-sm text-muted-foreground font-normal">
                  ({comments.length})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Comments list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 overscroll-contain"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading comments...</span>
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {sortedComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border px-4 py-3 pb-safe">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                disabled={isPending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isPending}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity shrink-0"
                aria-label="Post comment"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center py-2">
              <p className="text-sm text-muted-foreground">
                Sign in to comment
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
