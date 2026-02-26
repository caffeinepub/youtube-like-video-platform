import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '../utils/avatarHelpers';

interface ProfileSetupModalProps {
  onComplete?: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const isIIUser = !!identity;
  const isGoogleUser = !!googleUser && !isIIUser;

  const [name, setName] = useState(googleUser?.name || '');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(googleUser?.picture || null);
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error('Avatar must be under 512 KB');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your channel name');
      return;
    }

    // For Google-only users, save to localStorage since they can't interact with backend
    if (isGoogleUser) {
      if (googleUser) {
        const profileKey = `google_profile_setup_${googleUser.sub}`;
        localStorage.setItem(profileKey, 'true');
        localStorage.setItem(`google_profile_name_${googleUser.sub}`, name.trim());
        localStorage.setItem(`google_profile_desc_${googleUser.sub}`, description.trim());
      }
      toast.success('Profile saved!');
      onComplete?.();
      return;
    }

    // For II users, save to backend
    if (!actor) {
      toast.error('Not connected. Please try again.');
      return;
    }

    // Derive a handle from name if user left it blank
    const finalHandle = handle.trim()
      ? handle.trim()
      : name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    setIsSaving(true);
    try {
      await actor.saveCallerUserProfile({
        name: name.trim(),
        channelDescription: description.trim(),
        handle: finalHandle,
        avatar: avatarBytes ? avatarBytes : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created!');
      onComplete?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Set up your channel</DialogTitle>
          <DialogDescription>
            {isGoogleUser
              ? `Welcome, ${googleUser?.name}! Complete your channel profile to get started.`
              : 'Create your channel profile to start uploading and interacting.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {avatarPreview && <AvatarImage src={avatarPreview} alt={name} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(name || 'U')}
                </AvatarFallback>
              </Avatar>
              {isIIUser && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            {isGoogleUser && (
              <p className="text-xs text-muted-foreground">Using your Google profile picture</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your channel name"
              required
            />
          </div>

          {/* Handle — only for II users */}
          {isIIUser && (
            <div className="space-y-1.5">
              <Label htmlFor="channel-handle">Handle <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                  @
                </span>
                <Input
                  id="channel-handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/\s/g, ''))}
                  placeholder="yourhandle"
                  className="pl-7"
                  maxLength={40}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only. Leave blank to auto-generate from your name.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-desc">Channel Description</Label>
            <Textarea
              id="channel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your channel..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
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
