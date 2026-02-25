import React, { useState } from 'react';
import { ListVideo, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPlaylistsByOwner } from '../hooks/useGetPlaylistsByOwner';
import { useCreatePlaylist } from '../hooks/useCreatePlaylist';
import { useAddVideoToPlaylist } from '../hooks/useAddVideoToPlaylist';
import { useRemoveVideoFromPlaylist } from '../hooks/useRemoveVideoFromPlaylist';
import { toast } from 'sonner';

interface AddToPlaylistButtonProps {
  videoId: string;
}

export default function AddToPlaylistButton({ videoId }: AddToPlaylistButtonProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { data: playlists = [], isLoading: playlistsLoading } = useGetPlaylistsByOwner();
  const { mutate: createPlaylist, isPending: creating } = useCreatePlaylist();
  const { mutate: addVideo, isPending: adding } = useAddVideoToPlaylist();
  const { mutate: removeVideo, isPending: removing } = useRemoveVideoFromPlaylist();

  const handleOpenChange = (val: boolean) => {
    if (!isAuthenticated) {
      toast.info('Sign in to add videos to playlists');
      return;
    }
    setOpen(val);
    if (!val) {
      setShowCreateForm(false);
      setNewTitle('');
      setNewDescription('');
    }
  };

  const isVideoInPlaylist = (playlistVideos: string[]) => playlistVideos.includes(videoId);

  const handleTogglePlaylist = (playlistId: string, currentlyIn: boolean) => {
    if (currentlyIn) {
      removeVideo({ playlistId, videoId });
    } else {
      addVideo({ playlistId, videoId });
    }
  };

  const handleCreateAndAdd = () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a playlist title');
      return;
    }
    createPlaylist(
      { title: newTitle.trim(), description: newDescription.trim() },
      {
        onSuccess: (newPlaylistId) => {
          addVideo({ playlistId: newPlaylistId, videoId });
          setShowCreateForm(false);
          setNewTitle('');
          setNewDescription('');
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ListVideo className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Save to playlist</p>
        </div>

        {/* Create new playlist form */}
        {showCreateForm ? (
          <div className="p-3 space-y-3">
            <Input
              placeholder="Playlist title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <Textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTitle('');
                  setNewDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreateAndAdd}
                disabled={creating || adding || !newTitle.trim()}
              >
                {creating || adding ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Create new playlist button */}
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-muted transition-colors"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4" />
              Create new playlist
            </button>

            <Separator />

            {/* Existing playlists */}
            <div className="max-h-52 overflow-y-auto">
              {playlistsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : playlists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 px-3">
                  No playlists yet. Create one above!
                </p>
              ) : (
                playlists.map((playlist) => {
                  const inPlaylist = isVideoInPlaylist(playlist.videos);
                  const isBusy = adding || removing;
                  return (
                    <label
                      key={playlist.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={inPlaylist}
                        onCheckedChange={() => !isBusy && handleTogglePlaylist(playlist.id, inPlaylist)}
                        disabled={isBusy}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{playlist.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
