import React, { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPlaylistById } from '../hooks/useGetPlaylistById';
import { useGetPlaylistVideos } from '../hooks/useGetPlaylistVideos';
import { useRemoveVideoFromPlaylist } from '../hooks/useRemoveVideoFromPlaylist';
import { useDeletePlaylist } from '../hooks/useDeletePlaylist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Trash2, ArrowLeft, ListVideo, Loader2, Lock, Zap } from 'lucide-react';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import type { VideoMetadata } from '../backend';

function PlaylistVideoItem({
  video,
  isOwner,
  playlistId,
}: {
  video: VideoMetadata;
  isOwner: boolean;
  playlistId: string;
}) {
  const { mutate: removeVideo, isPending } = useRemoveVideoFromPlaylist();
  const videoUrl = video.videoFile.getDirectURL();

  return (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
      {/* Thumbnail */}
      <Link
        to="/video/$videoId"
        params={{ videoId: video.id }}
        className="shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-muted relative"
      >
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          preload="metadata"
        />
        {video.isShort && (
          <div className="absolute top-1 left-1">
            <Badge variant="default" className="flex items-center gap-0.5 text-xs px-1 py-0 bg-primary text-primary-foreground">
              <Zap className="w-2.5 h-2.5 fill-current" />
              Short
            </Badge>
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
          {formatDuration(Number(video.duration))}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <Link to="/video/$videoId" params={{ videoId: video.id }}>
            <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors mb-1">
              {video.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{formatViewCount(Number(video.viewCount))} views</span>
            <span>•</span>
            <span>{formatTimeAgo(Number(video.uploadDate))}</span>
          </div>
        </div>
        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{video.description}</p>
        )}
      </div>

      {/* Remove button (owner only) */}
      {isOwner && (
        <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-8 h-8"
            onClick={() => removeVideo({ playlistId, videoId: video.id })}
            disabled={isPending}
            title="Remove from playlist"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlaylistDetailPage() {
  const { playlistId } = useParams({ from: '/playlists/$playlistId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: playlist, isLoading: playlistLoading } = useGetPlaylistById(playlistId);
  const { data: videos = [], isLoading: videosLoading } = useGetPlaylistVideos(playlistId);
  const { mutate: deletePlaylist, isPending: deleting } = useDeletePlaylist();

  const isOwner =
    isAuthenticated &&
    playlist?.owner.toString() === identity?.getPrincipal().toString();

  const handleDelete = () => {
    deletePlaylist(playlistId, {
      onSuccess: () => {
        navigate({ to: '/playlists' });
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view playlists</h2>
            <p className="text-muted-foreground">You need to be signed in to view playlist details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (playlistLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-40 aspect-video rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <ListVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Playlist not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/playlists' })}>
              Back to Playlists
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: '/playlists' })}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Playlists
      </Button>

      {/* Playlist header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ListVideo className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-muted-foreground text-sm mb-2">{playlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {videos.length} video{videos.length !== 1 ? 's' : ''} • Created {formatTimeAgo(Number(playlist.createdAt))}
            </p>
          </div>
        </div>

        {/* Delete button (owner only) */}
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{playlist.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Playlist'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Videos list */}
      {videosLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3">
              <Skeleton className="w-40 aspect-video rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No videos in this playlist</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add videos using the "Save" button on any video page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {videos.map((video) => (
            <PlaylistVideoItem
              key={video.id}
              video={video}
              isOwner={!!isOwner}
              playlistId={playlistId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
