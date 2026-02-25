import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useAddVideoToPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVideoToPlaylist(playlistId, videoId);
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlistVideos', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: () => {
      toast.error('Failed to add video to playlist');
    },
  });
}
