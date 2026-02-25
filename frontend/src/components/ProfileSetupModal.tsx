import React, { useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSaveCallerUserProfile } from '../hooks/useSaveCallerUserProfile';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Loader2, User, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '../utils/avatarHelpers';

const MAX_IMAGE_SIZE = 512 * 1024; // 512 KB

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const { googleUser } = useGoogleAuth();
  const [name, setName] = useState(googleUser?.name || '');
  const [channelDescription, setChannelDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be 512 KB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (result instanceof ArrayBuffer) {
        setAvatarBytes(new Uint8Array(result));
        setAvatarPreview(URL.createObjectURL(file));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Please enter your channel name');
      return;
    }
    setNameError('');
    saveProfile(
      {
        name: name.trim(),
        channelDescription: channelDescription.trim(),
        avatar: avatarBytes ?? undefined,
      },
      {
        onSuccess: () => {
          onComplete();
        },
      }
    );
  };

  const displayName = name || 'You';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Set up your channel</DialogTitle>
              <DialogDescription>
                Create your VideoHub profile to start uploading and interacting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group/avatar">
              <Avatar className="w-20 h-20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={displayName} />
                ) : googleUser?.picture ? (
                  <AvatarImage src={googleUser.picture} alt={displayName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                title="Upload profile photo"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Click avatar to upload a photo (optional, max 512 KB)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channel-name">Channel Name *</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="e.g. My Awesome Channel"
              className={nameError ? 'border-destructive' : ''}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channel-description">Channel Description</Label>
            <Textarea
              id="channel-description"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="Tell viewers about your channel (optional)"
              rows={3}
              className="resize-none"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Create Channel'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
