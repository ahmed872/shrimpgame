import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { BRAND_COLORS } from '@shared/gameConstants';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    preferredName: '',
    phoneNumber: '',
    orderSource: 'dine-in' as 'dine-in' | 'app',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [canPlay, setCanPlay] = useState(true);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [nextAttemptTime, setNextAttemptTime] = useState<string | null>(null);

  // Get unique user ID for this browser session
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('userSessionId');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('userSessionId', id);
    }
    return id;
  });

  useEffect(() => {
    setIpAddress(sessionId);
  }, [sessionId]);

  const registerMutation = trpc.player.register.useMutation();
  const { data: attemptsData } = trpc.player.checkAttempts.useQuery(
    {
      phoneNumber: formData.phoneNumber,
      ipAddress,
    },
    {
      enabled: formData.phoneNumber.length >= 7 && ipAddress !== '',
    }
  );

  // Update attempt state when data changes
  useEffect(() => {
    if (attemptsData) {
      setCanPlay(attemptsData.canPlay);
      setAttemptsRemaining(attemptsData.attemptsRemaining);
      setNextAttemptTime(attemptsData.nextAttemptTime);
    }
  }, [attemptsData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      orderSource: value as 'dine-in' | 'app',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preferredName.trim()) {
      toast.error('Please enter your preferred name');
      return;
    }

    if (formData.phoneNumber.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!canPlay) {
      toast.error('You have reached your daily attempt limit');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LANDING] Sending registration:', { name: formData.preferredName, phone: formData.phoneNumber, session: ipAddress });
      
      const result = await registerMutation.mutateAsync({
        preferredName: formData.preferredName,
        phoneNumber: formData.phoneNumber,
        orderSource: formData.orderSource,
        ipAddress,
      });

      console.log('[LANDING] Registration successful:', result);
      toast.success('Welcome! Starting your game...');
      
      // Save phone number for session
      localStorage.setItem('sultan_player_phone', formData.phoneNumber);

      // Navigate to game with player ID
      setLocation(`/game/${result.playerId}`);
    } catch (error) {
      console.error('[LANDING] Registration error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[LANDING] Error details:', msg);
      toast.error(`Failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdownTime = (isoString: string | null): string => {
    if (!isoString) return '';
    const resetTime = new Date(isoString).getTime();
    const now = Date.now();
    const diff = resetTime - now;

    if (diff <= 0) return 'Available now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: BRAND_COLORS.LIGHT }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: BRAND_COLORS.PRIMARY }}>
            🦐 Sultan Shrimp
          </h1>
          <p className="text-gray-600 text-lg">Interactive Game Challenge</p>
          <p className="text-sm text-gray-500 mt-2">Play daily, win amazing prizes!</p>
        </div>

        {/* Main Card */}
        <Card className="p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preferred Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Preferred Name
              </label>
              <Input
                type="text"
                name="preferredName"
                value={formData.preferredName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                disabled={isLoading}
                className="w-full"
              />
              {formData.phoneNumber.length >= 7 && (
                <p className="text-xs mt-1" style={{ color: canPlay ? BRAND_COLORS.ACCENT : BRAND_COLORS.PRIMARY }}>
                  {canPlay
                    ? `✓ ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining today`
                    : `✗ No attempts available today. ${formatCountdownTime(nextAttemptTime)}`}
                </p>
              )}
            </div>

            {/* Order Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How are you ordering?
              </label>
              <Select value={formData.orderSource} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Dine-in at Restaurant</SelectItem>
                  <SelectItem value="app">Through Mobile App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !canPlay || !formData.preferredName.trim() || formData.phoneNumber.length < 7}
              className="w-full mt-6 py-2 text-white font-semibold"
              style={{
                backgroundColor: canPlay ? BRAND_COLORS.PRIMARY : '#ccc',
                cursor: canPlay ? 'pointer' : 'not-allowed',
              }}
            >
              {isLoading ? 'Starting Game...' : 'Start Playing'}
            </Button>
          </form>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Game Rules:</h3>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>• Catch as many shrimp as you can!</li>
              <li>• Difficulty increases over time</li>
              <li>• Find the rare Golden Shrimp for bonuses</li>
              <li>• Reach 500+ points for a 10% instant discount</li>
              <li>• 3 attempts per day, reset at 11:59 PM</li>
            </ul>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>🏆 Top 3 players each day win amazing prizes!</p>
          <p className="mt-2">Share your score on Instagram for bonus entries</p>
        </div>
      </div>
    </div>
  );
}
