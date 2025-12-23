import React, { forwardRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, MessageCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SHARE_TEXT = `IBS Diet Companion helps track meals, symptoms, and personal triggers.

I'm using it to understand my IBS better.

Early users get 6 months free access.`;

interface ShareButtonProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export const ShareButton = forwardRef<HTMLDivElement, ShareButtonProps>(
  function ShareButton({ variant = 'icon', className = '' }, ref) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (variant === 'icon') {
    return (
      <div ref={ref}>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className={`rounded-xl ${className}`}
          title="Share app"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref} className={`space-y-3 ${className}`}>
      <h3 className="font-display font-semibold text-foreground text-sm">Share with Others</h3>
      <p className="text-muted-foreground text-xs">
        Know someone with IBS? Share this free tool with them.
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex-1 h-10 rounded-xl text-sm"
        >
          {copied ? <Check className="w-4 h-4 mr-2 text-success" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button
          variant="outline"
          onClick={handleWhatsApp}
          className="h-10 rounded-xl text-sm px-4"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
});