import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSaveCallerUserProfile } from '../hooks/useSaveCallerUserProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Sparkles } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  googleDisplayName?: string;
  googleAvatarUrl?: string;
}

export default function ProfileSetupModal({
  open,
  onClose,
  googleDisplayName,
  googleAvatarUrl,
}: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const defaultName = googleDisplayName || googleUser?.name || '';
      setName(defaultName);
      setHandle(defaultName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
      setError('');
    }
  }, [open, googleDisplayName, googleUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your channel name'); return; }
    if (!handle.trim()) { setError('Please enter a handle'); return; }
    setError('');
    saveProfile(
      {
        name: name.trim(),
        handle: handle.trim(),
        channelDescription: '',
        avatar: undefined,
      },
      { onSuccess: onClose }
    );
  };

  const avatarSrc = googleAvatarUrl || googleUser?.picture;
  const initials = name.slice(0, 2).toUpperCase() || 'MT';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isPending) onClose(); }}>
      <DialogContent className="bg-mt-charcoal-900 border-mt-charcoal-700 text-foreground max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-mt-red-500/15 rounded-full">
              <Sparkles className="w-6 h-6 text-mt-red-400" />
            </div>
          </div>
          <DialogTitle className="font-display text-2xl">Welcome to Mediatube!</DialogTitle>
          <DialogDescription className="text-mt-charcoal-400">
            Set up your channel to start sharing content
          </DialogDescription>
        </DialogHeader>

        {avatarSrc && (
          <div className="flex justify-center">
            <Avatar className="w-16 h-16 ring-2 ring-mt-red-500">
              <AvatarImage src={avatarSrc} alt={name} />
              <AvatarFallback className="bg-mt-charcoal-700 text-foreground font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-mt-charcoal-300 text-sm">Channel Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Channel"
              className="bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-mt-charcoal-300 text-sm">Handle *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mt-charcoal-500 text-sm">@</span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, '').replace(/\s+/g, '_'))}
                placeholder="mychannel"
                className="pl-7 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full font-semibold h-11"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create My Channel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
