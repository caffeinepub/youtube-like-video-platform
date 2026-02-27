import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Image, Loader2, X } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useCreateCommunityPost } from '../hooks/useCreateCommunityPost';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { ExternalBlob } from '../backend';

export default function CommunityPostComposer() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;

  const { data: userProfile } = useGetCallerUserProfile();
  const { mutateAsync: createPost, isPending } = useCreateCommunityPost();

  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = userProfile?.avatar ? convertBlobToDataURL(userProfile.avatar) : null;
  const displayName = googleUser?.name || userProfile?.name || 'User';
  const displayAvatar = (googleUser?.picture && !avatarUrl) ? googleUser.picture : avatarUrl;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !isAuthenticated) return;

    let attachment: ExternalBlob | null = null;
    if (imageFile) {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      attachment = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct)
      );
    }

    try {
      await createPost({ body: body.trim(), attachment });
      setBody('');
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
    } catch {
      // handled by mutation
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">Sign in to post in the community</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {displayAvatar && <AvatarImage src={displayAvatar} />}
          <AvatarFallback className="bg-primary/20 text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share something with the community..."
          className="flex-1 min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 p-0 text-sm"
          disabled={isPending}
        />
      </div>

      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-48 rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {isPending && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-1" />
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Image className="h-4 w-4 mr-1" />
            Photo
          </Button>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!body.trim() || isPending}
          className="bg-mt-magenta hover:bg-mt-purple text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Posting...
            </>
          ) : (
            'Post'
          )}
        </Button>
      </div>
    </form>
  );
}
