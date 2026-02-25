import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPlaylistsByOwner } from '../hooks/useGetPlaylistsByOwner';
import { useCreatePlaylist } from '../hooks/useCreatePlaylist';
import { useGetVideo } from '../hooks/useGetVideo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ListVideo, Plus, Lock, Loader2, PlaySquare } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

// Playlist card with first-video thumbnail
function PlaylistCard({ playlist }: { playlist: { id: string; title: string; description: string; videos: string[]; createdAt: bigint } }) {
  const firstVideoId = playlist.videos[0];
  const { data: firstVideo } = useGetVideo(firstVideoId);
  const thumbnailUrl = firstVideo?.videoFile.getDirectURL();

  return (
    <Link to="/playlists/$playlistId" params={{ playlistId: playlist.id }} className="group">
      <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <video
              src={thumbnailUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlaySquare className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
          {/* Video count badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
            {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {playlist.title}
          </h3>
          {playlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatTimeAgo(Number(playlist.createdAt))}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PlaylistsPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: playlists = [], isLoading } = useGetPlaylistsByOwner();
  const { mutate: createPlaylist, isPending: creating } = useCreatePlaylist();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createPlaylist(
      { title: newTitle.trim(), description: newDescription.trim() },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewTitle('');
          setNewDescription('');
        },
      }
    );
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
            <p className="text-muted-foreground">
              Create and manage your video playlists after signing in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ListVideo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Playlists</h1>
            <p className="text-sm text-muted-foreground">Organize your favorite videos</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Playlist
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ListVideo className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No Playlists Yet</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Create your first playlist to start organizing your favorite videos.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Playlist
          </Button>
        </div>
      )}

      {/* Playlists grid */}
      {!isLoading && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                placeholder="My Playlist"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="What's this playlist about?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Playlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
