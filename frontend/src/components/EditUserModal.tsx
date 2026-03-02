import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { useAdminSaveUserProfile } from '../hooks/useAdminSaveUserProfile';
import { UserProfile } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  userPrincipal: Principal;
  initialProfile: UserProfile;
}

export default function EditUserModal({ open, onClose, userPrincipal, initialProfile }: EditUserModalProps) {
  const { mutate: saveProfile, isPending } = useAdminSaveUserProfile();
  const [name, setName] = useState(initialProfile.name);
  const [handle, setHandle] = useState(initialProfile.handle);
  const [description, setDescription] = useState(initialProfile.channelDescription);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialProfile.name);
      setHandle(initialProfile.handle);
      setDescription(initialProfile.channelDescription);
      setError('');
    }
  }, [open, initialProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    saveProfile(
      {
        profile: {
          name: name.trim(),
          handle: handle.trim(),
          channelDescription: description.trim(),
          avatar: initialProfile.avatar,
        },
        user: userPrincipal,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-mt-charcoal-900 border-mt-charcoal-700 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit User Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-mt-charcoal-300 text-sm">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User name"
              className="bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-mt-charcoal-300 text-sm">Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mt-charcoal-500 text-sm">@</span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                placeholder="handle"
                className="pl-7 bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-mt-charcoal-300 text-sm">Channel Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Channel description..."
              rows={3}
              className="bg-mt-charcoal-800 border-mt-charcoal-700 text-foreground placeholder:text-mt-charcoal-500 focus:border-mt-red-500 focus:ring-mt-red-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-mt-charcoal-300 hover:text-foreground hover:bg-mt-charcoal-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
