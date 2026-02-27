import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, ListPlus, Plus } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetPlaylistsByOwner } from '../hooks/useGetPlaylistsByOwner';
import { useAddVideoToPlaylist } from '../hooks/useAddVideoToPlaylist';
import { useRemoveVideoFromPlaylist } from '../hooks/useRemoveVideoFromPlaylist';
import { useCreatePlaylist } from '../hooks/useCreatePlaylist';

interface AddToPlaylistButtonProps {
  videoId: string;
  iconOnly?: boolean;
}

export default function AddToPlaylistButton({ videoId, iconOnly }: AddToPlaylistButtonProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: playlists = [] } = useGetPlaylistsByOwner();
  const { mutateAsync: addVideo, isPending: isAdding } = useAddVideoToPlaylist();
  const { mutateAsync: removeVideo, isPending: isRemoving } = useRemoveVideoFromPlaylist();
  const { mutateAsync: createPlaylist, isPending: isCreating } = useCreatePlaylist();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  const isVideoInPlaylist = (playlistId: string) =>
    playlists.find((p) => p.id === playlistId)?.videos.includes(videoId) ?? false;

  const handleToggle = async (playlistId: string) => {
    if (isVideoInPlaylist(playlistId)) {
      await removeVideo({ playlistId, videoId });
    } else {
      await addVideo({ playlistId, videoId });
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    const playlistId = await createPlaylist({
      title: newPlaylistName.trim(),
      description: '',
    });
    await addVideo({ playlistId, videoId });
    setNewPlaylistName('');
    setShowCreate(false);
  };

  const isPending = isAdding || isRemoving || isCreating;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? 'icon' : 'sm'}
          className={iconOnly ? 'rounded-full' : ''}
          title="Save to playlist"
        >
          <ListPlus className="h-4 w-4" />
          {!iconOnly && <span className="ml-1">Save</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-sm font-medium mb-2">Save to playlist</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {playlists.length === 0 && (
            <p className="text-xs text-muted-foreground">No playlists yet.</p>
          )}
          {playlists.map((playlist) => (
            <label
              key={playlist.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1"
            >
              <Checkbox
                checked={isVideoInPlaylist(playlist.id)}
                onCheckedChange={() => handleToggle(playlist.id)}
                disabled={isPending}
              />
              <span className="text-sm truncate">{playlist.title}</span>
            </label>
          ))}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          {showCreate ? (
            <div className="flex gap-1">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="h-7 text-xs"
                disabled={isPending}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                autoFocus
              />
              <Button
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCreateAndAdd}
                disabled={!newPlaylistName.trim() || isPending}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New playlist
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
