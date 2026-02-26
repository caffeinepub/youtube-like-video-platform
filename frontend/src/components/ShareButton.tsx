import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useState } from 'react';

interface ShareButtonProps {
  videoId: string;
  /** When true, renders as a plain icon without the ghost button wrapper (for use inside custom containers) */
  iconOnly?: boolean;
}

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy fallback using execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

export default function ShareButton({ videoId, iconOnly = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/video/${videoId}`;

    const success = await copyToClipboard(shareUrl);

    if (success) {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Last resort: show the URL in a toast so user can copy manually
      toast.info(`Copy this link: ${shareUrl}`, { duration: 6000 });
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleShare}
        className="flex items-center justify-center w-full h-full text-white"
        aria-label="Share video"
      >
        {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleShare}
            className="text-white hover:bg-white/20"
          >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : 'Share video'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
