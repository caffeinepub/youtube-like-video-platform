import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, ListVideo, Loader2, Lock } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetPlaylistsByOwner } from '../hooks/useGetPlaylistsByOwner';
import { useCreatePlaylist } from '../hooks/useCreatePlaylist';

export default function PlaylistsPage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: playlists = [], isLoading } = useGetPlaylistsByOwner();
  const { mutateAsync: createPlaylist, isPending } = useCreatePlaylist();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createPlaylist({ title: newTitle.trim(), description: newDescription.trim() });
    setNewTitle('');
    setNewDescription('');
    setShowCreate(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign in to view playlists</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Create and manage your video playlists after signing in.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-mt-magenta hover:bg-mt-purple text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <ListVideo className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">No playlists yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              to="/playlist/$playlistId"
              params={{ playlistId: playlist.id }}
              className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-mt-magenta/10">
                  <ListVideo className="h-6 w-6 text-mt-magenta" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{playlist.title}</h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {playlist.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="playlist-title">Title *</Label>
              <Input
                id="playlist-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist name"
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="playlist-desc">Description (optional)</Label>
              <Input
                id="playlist-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your playlist"
                disabled={isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newTitle.trim() || isPending}
                className="bg-mt-magenta hover:bg-mt-purple text-white"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
