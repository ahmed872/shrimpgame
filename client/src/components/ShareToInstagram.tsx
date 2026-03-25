import { Button } from '@/components/ui/button';
import { BRAND_COLORS } from '@shared/gameConstants';
import { toast } from 'sonner';

interface ShareToInstagramProps {
  playerName: string;
  score: number;
  isJackpot: boolean;
  onShare?: () => void;
}

export default function ShareToInstagram({
  playerName,
  score,
  isJackpot,
  onShare,
}: ShareToInstagramProps) {
  const handleShare = () => {
    const text = isJackpot
      ? `🎉 I just won a JACKPOT with ${score} points on @sultanshrimp's game! 🦐 I got a 10% instant discount! Join the challenge and compete for amazing prizes! 🏆`
      : `🦐 I scored ${score} points on @sultanshrimp's interactive game! Can you beat my score? Play now and win amazing prizes! 🎮🏆`;

    // Instagram Story share intent
    const instagramUrl = `https://www.instagram.com/create/story`;

    // Copy text to clipboard
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Text copied! Open Instagram to share your story');
      window.open(instagramUrl, '_blank');
      onShare?.();
    }).catch(() => {
      toast.error('Failed to copy text');
    });
  };

  return (
    <Button
      onClick={handleShare}
      className="w-full py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
      style={{ backgroundColor: '#E4405F' }}
    >
      📱 Share on Instagram Story
    </Button>
  );
}
