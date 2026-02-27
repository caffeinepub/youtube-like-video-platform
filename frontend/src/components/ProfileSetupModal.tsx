import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSaveCallerUserProfile } from '../hooks/useSaveCallerUserProfile';

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSetupModal({ open, onClose }: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const [name, setName] = useState(googleUser?.name || '');
  const [handle, setHandle] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [error, setError] = useState('');

  // Pre-fill name from Google if available
  React.useEffect(() => {
    if (googleUser?.name && !name) {
      setName(googleUser.name);
    }
  }, [googleUser]);

  const generateHandle = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your channel name.');
      return;
    }

    const finalHandle = handle.trim() ? handle.trim().replace(/^@/, '') : generateHandle(trimmedName);

    try {
      await saveProfile({
        name: trimmedName,
        handle: finalHandle,
        channelDescription: channelDescription.trim(),
        avatar: undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile.';
      setError(msg);
    }
  };

  const isAuthenticated = !!identity || !!googleUser;

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set up your channel</DialogTitle>
          <DialogDescription>
            {googleUser
              ? `Welcome, ${googleUser.name}! Complete your Mediatube channel setup.`
              : 'Welcome to Mediatube! Set up your channel to get started.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your channel name"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="handle">Handle (optional)</Label>
            <div className="flex items-center border border-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm">@</span>
              <input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                placeholder={name ? generateHandle(name) : 'yourchannel'}
                disabled={isPending}
                className="flex-1 px-3 py-2 bg-transparent text-sm outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-generate from your name.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Channel Description (optional)</Label>
            <Input
              id="description"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="Tell viewers about your channel"
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Channel'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
