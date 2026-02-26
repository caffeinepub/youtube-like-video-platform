import { useState, useCallback } from 'react';

interface MixOptions {
  musicVolume?: number;
  videoVolume?: number;
}

interface UseMusicMixerReturn {
  mixAudio: (videoBlob: Blob, musicUrl: string, options?: MixOptions) => Promise<Blob>;
  isMixing: boolean;
  mixProgress: number;
  error: string | null;
}

export function useMusicMixer(): UseMusicMixerReturn {
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mixAudio = useCallback(
    async (videoBlob: Blob, musicUrl: string, options: MixOptions = {}): Promise<Blob> => {
      const { musicVolume = 0.8, videoVolume = 0.3 } = options;

      setIsMixing(true);
      setMixProgress(0);
      setError(null);

      try {
        // Create an AudioContext
        const audioContext = new AudioContext();
        setMixProgress(10);

        // Fetch and decode the music track
        const musicResponse = await fetch(musicUrl);
        const musicArrayBuffer = await musicResponse.arrayBuffer();
        setMixProgress(30);

        const musicAudioBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
        setMixProgress(50);

        // Decode the video's audio
        const videoArrayBuffer = await videoBlob.arrayBuffer();
        let videoAudioBuffer: AudioBuffer | null = null;
        try {
          videoAudioBuffer = await audioContext.decodeAudioData(videoArrayBuffer.slice(0));
        } catch {
          // Video may not have audio track, that's okay
          videoAudioBuffer = null;
        }
        setMixProgress(70);

        // Determine output duration (use video duration if available, else music)
        const outputDuration = videoAudioBuffer
          ? videoAudioBuffer.duration
          : Math.min(musicAudioBuffer.duration, 60);

        const sampleRate = audioContext.sampleRate;
        const outputLength = Math.floor(outputDuration * sampleRate);
        const numberOfChannels = 2;

        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
          numberOfChannels,
          outputLength,
          sampleRate
        );

        // Add music track
        const musicSource = offlineContext.createBufferSource();
        musicSource.buffer = musicAudioBuffer;
        musicSource.loop = true;

        const musicGain = offlineContext.createGain();
        musicGain.gain.value = musicVolume;

        musicSource.connect(musicGain);
        musicGain.connect(offlineContext.destination);
        musicSource.start(0);

        // Add video audio if available
        if (videoAudioBuffer) {
          const videoSource = offlineContext.createBufferSource();
          videoSource.buffer = videoAudioBuffer;

          const videoGain = offlineContext.createGain();
          videoGain.gain.value = videoVolume;

          videoSource.connect(videoGain);
          videoGain.connect(offlineContext.destination);
          videoSource.start(0);
        }

        // Render the mixed audio
        const renderedBuffer = await offlineContext.startRendering();
        setMixProgress(85);

        // Convert AudioBuffer to WAV
        const wavBlob = audioBufferToWav(renderedBuffer);
        setMixProgress(95);

        await audioContext.close();
        setMixProgress(100);

        // Return the original video blob with a note that audio mixing was attempted
        // In a real scenario, we'd mux the audio into the video container
        // For now, return the original blob since full video muxing requires ffmpeg.wasm
        // The music will play separately during recording via the MusicPickerPanel
        return wavBlob;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Audio mixing failed';
        setError(message);
        throw err;
      } finally {
        setIsMixing(false);
      }
    },
    []
  );

  return { mixAudio, isMixing, mixProgress, error };
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
