import React, { useState, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useCreateCommunityPost } from '../hooks/useCreateCommunityPost';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Loader2, Image, Send, X } from 'lucide-react';

export default function CommunityPostComposer() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const isAuthenticated = !!identity || !!googleUser;
  const { mutate: createPost, isPending } = useCreateCommunityPost();

  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    let attachment: ExternalBlob | null = null;
    if (imageFile) {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      attachment = ExternalBlob.fromBytes(bytes).withUploadProgress(setUploadProgress);
    }

    createPost({ body: body.trim(), attachment }, {
      onSuccess: () => {
        setBody('');
        setImageFile(null);
        setImagePreview(null);
        setUploadProgress(0);
      },
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl p-4 shadow-card">
      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share something with your community..."
          rows={3}
          maxLength={1000}
          className="w-full bg-mt-charcoal-800 border border-mt-charcoal-700 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-mt-charcoal-500 focus:outline-none focus:border-mt-red-500 focus:ring-1 focus:ring-mt-red-500 resize-none transition-colors"
        />

        {imagePreview && (
          <div className="relative mt-3 rounded-xl overflow-hidden border border-mt-charcoal-700">
            <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isPending && uploadProgress > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-mt-charcoal-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-mt-red-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-mt-charcoal-400 hover:text-mt-red-400 hover:bg-mt-red-500/10 transition-colors"
            >
              <Image className="w-4 h-4" />
            </button>
            <span className="text-xs text-mt-charcoal-500">{body.length}/1000</span>
          </div>

          <Button
            type="submit"
            disabled={isPending || !body.trim()}
            size="sm"
            className="bg-mt-red-500 hover:bg-mt-red-600 text-white border-0 rounded-full flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
