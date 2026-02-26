import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserProfile } from '../hooks/useUpdateUserProfile';
import type { UserProfile } from '../backend';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
}

export default function EditProfileModal({ open, onClose, currentProfile }: EditProfileModalProps) {
  const [name, setName] = useState(currentProfile.name);
  const [handle, setHandle] = useState(currentProfile.handle);
  const [description, setDescription] = useState(currentProfile.channelDescription);

  const { mutate: updateProfile, isPending } = useUpdateUserProfile();

  // Sync fields when modal opens with fresh profile data
  useEffect(() => {
    if (open) {
      setName(currentProfile.name);
      setHandle(currentProfile.handle);
      setDescription(currentProfile.channelDescription);
    }
  }, [open, currentProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedHandle = handle.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      toast.error('Channel name cannot be empty');
      return;
    }
    if (!trimmedHandle) {
      toast.error('Handle cannot be empty');
      return;
    }
    // Basic handle format: alphanumeric + underscores, no spaces
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedHandle)) {
      toast.error('Handle can only contain letters, numbers, and underscores');
      return;
    }

    updateProfile(
      {
        name: trimmedName,
        channelDescription: trimmedDescription,
        handle: trimmedHandle,
        avatar: null, // Keep existing avatar
      },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully!');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to update profile');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Channel Profile</DialogTitle>
          <DialogDescription>
            Update your channel name, handle, and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Channel Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your channel name"
              disabled={isPending}
              maxLength={80}
            />
          </div>

          {/* Handle */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-handle">Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                @
              </span>
              <Input
                id="edit-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/\s/g, ''))}
                placeholder="yourhandle"
                disabled={isPending}
                maxLength={40}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Channel Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your channel..."
              disabled={isPending}
              rows={3}
              maxLength={500}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
