import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ExternalBlob } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useCreateCommunityPost } from '../hooks/useCreateCommunityPost';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

export default function CommunityPostComposer() {
  const { identity, login } = useInternetIdentity();
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  const isAuthenticated = !!identity;
  const { data: userProfile } = useGetCallerUserProfile();
  const { mutate: createPost, isPending } = useCreateCommunityPost();

  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = userProfile?.name || 'User';
  const avatarBytes = userProfile?.avatar;
  const avatarDataUrl = avatarBytes ? convertBlobToDataURL(avatarBytes) : undefined;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!body.trim() || isPending) return;

    let attachment: ExternalBlob | null = null;

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      attachment = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
    }

    createPost(
      { body: body.trim(), attachment },
      {
        onSuccess: () => {
          setBody('');
          setImageFile(null);
          setImagePreview(null);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <p className="text-muted-foreground text-sm mb-3">{t('signInToPost')}</p>
        <Button size="sm" onClick={() => login()}>
          {t('signIn') || 'Sign in'}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
          {avatarDataUrl && <AvatarImage src={avatarDataUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('writePostPlaceholder')}
            className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm"
            disabled={isPending}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-border object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {isPending && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{t('posting')} {uploadProgress}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isPending}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-xs">{t('uploadImage')}</span>
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!body.trim() || isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('posting')}
                </>
              ) : (
                t('postButton')
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
