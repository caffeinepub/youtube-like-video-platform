import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useRemoveVideoFromPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeVideoFromPlaylist(playlistId, videoId);
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlistVideos', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Video removed from playlist');
    },
    onError: () => {
      toast.error('Failed to remove video from playlist');
    },
  });
}
