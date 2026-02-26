import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, X, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MUSIC_LIBRARY, MusicTrack } from '@/types/music';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';

interface MusicPickerPanelProps {
  open: boolean;
  onClose: () => void;
  selectedTrack: MusicTrack | null;
  onSelect: (track: MusicTrack | null) => void;
}

export default function MusicPickerPanel({
  open,
  onClose,
  selectedTrack,
  onSelect,
}: MusicPickerPanelProps) {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreview = (track: MusicTrack) => {
    if (previewingId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPreviewingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(track.url);
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Audio play failed (likely no file), ignore
      });
      audio.onended = () => setPreviewingId(null);
      audioRef.current = audio;
      setPreviewingId(track.id);
    }
  };

  const handleSelect = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewingId(null);
    onSelect(track);
    onClose();
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewingId(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Music className="w-5 h-5 text-primary" />
              {t('chooseATrack')}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(70vh-80px)]">
          <div className="p-4 space-y-2">
            {/* No music option */}
            <button
              onClick={() => {
                onSelect(null);
                handleClose();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedTrack === null
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground text-sm">{t('noTrackSelected')}</p>
                <p className="text-xs text-muted-foreground">Original audio only</p>
              </div>
              {selectedTrack === null && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>

            {MUSIC_LIBRARY.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedTrack?.id === track.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {/* Preview button */}
                <button
                  onClick={() => handlePreview(track)}
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors"
                >
                  {previewingId === track.id ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-primary ml-0.5" />
                  )}
                </button>

                {/* Track info */}
                <button
                  className="flex-1 text-left"
                  onClick={() => handleSelect(track)}
                >
                  <p className="font-medium text-foreground text-sm">{track.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {track.artist} · {track.duration}
                  </p>
                </button>

                {/* Selected indicator */}
                {selectedTrack?.id === track.id ? (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleSelect(track)}
                  >
                    {t('addMusic')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
