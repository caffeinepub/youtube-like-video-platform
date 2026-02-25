import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';

interface UploadVideoParams {
  title: string;
  description: string;
  duration: number;
  file: File;
}

export function useUploadVideo(onProgress?: (percentage: number) => void) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, duration, file }: UploadVideoParams): Promise<string> => {
      if (!actor) throw new Error('Actor not available');

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let videoBlob = ExternalBlob.fromBytes(uint8Array);
      
      if (onProgress) {
        videoBlob = videoBlob.withUploadProgress(onProgress);
      }

      return actor.uploadVideo(title, description, BigInt(duration), videoBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}
