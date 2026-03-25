import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { BRAND_COLORS } from '@shared/gameConstants';
import { toast } from 'sonner';

interface JackpotEvent {
  id: number;
  playerName: string;
  score: number;
  discountPercentage: string;
  notificationSent: boolean;
  eventDate: Date | string;
  createdAt?: Date;
  playerId?: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [jackpotEvents, setJackpotEvents] = useState<JackpotEvent[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const getJackpotsMutation = trpc.admin.getJackpotEvents.useQuery();
  const markNotifiedMutation = trpc.admin.markJackpotNotified.useMutation();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
      toast.error('Admin access required');
    }
  }, [user]);

  useEffect(() => {
    if (getJackpotsMutation.data) {
      setJackpotEvents(getJackpotsMutation.data as JackpotEvent[]);
    }
  }, [getJackpotsMutation.data]);

  const handleMarkNotified = async (jackpotId: number) => {
    try {
      await markNotifiedMutation.mutateAsync({ jackpotId });
      setJackpotEvents(prev =>
        prev.map(event =>
          event.id === jackpotId ? { ...event, notificationSent: true } : event
        )
      );
      toast.success('Notification marked as sent');
    } catch (error) {
      console.error('Failed to mark notification:', error);
      toast.error('Failed to update notification status');
    }
  };

  const handleSelectWinner = (playerName: string) => {
    setSelectedWinner(playerName);
    toast.success(`${playerName} selected as winner!`);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: BRAND_COLORS.LIGHT }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: BRAND_COLORS.PRIMARY }}>
            👨‍💼 Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage game events and winners</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Total Jackpots Today</p>
            <p className="text-3xl font-bold" style={{ color: BRAND_COLORS.PRIMARY }}>
              {jackpotEvents.length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Notifications Sent</p>
            <p className="text-3xl font-bold" style={{ color: BRAND_COLORS.ACCENT }}>
              {jackpotEvents.filter(e => e.notificationSent).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Pending Notifications</p>
            <p className="text-3xl font-bold" style={{ color: BRAND_COLORS.SECONDARY }}>
              {jackpotEvents.filter(e => !e.notificationSent).length}
            </p>
          </Card>
        </div>

        {/* Jackpot Events */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: BRAND_COLORS.PRIMARY }}>
            🎉 Jackpot Events
          </h2>

          {jackpotEvents.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No jackpot events today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${BRAND_COLORS.PRIMARY}` }}>
                    <th className="text-left py-3 px-4">Player Name</th>
                    <th className="text-left py-3 px-4">Score</th>
                    <th className="text-left py-3 px-4">Discount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jackpotEvents.map((event) => (
                    <tr
                      key={event.id}
                      style={{ borderBottom: `1px solid #eee` }}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-semibold">{event.playerName}</td>
                      <td className="py-3 px-4">{event.score}</td>
                      <td className="py-3 px-4">{event.discountPercentage}%</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: event.notificationSent ? BRAND_COLORS.ACCENT : BRAND_COLORS.SECONDARY,
                            color: 'white',
                          }}
                        >
                          {event.notificationSent ? '✓ Sent' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-x-2">
                        {!event.notificationSent && (
                          <Button
                            onClick={() => handleMarkNotified(event.id)}
                            size="sm"
                            className="text-white"
                            style={{ backgroundColor: BRAND_COLORS.ACCENT }}
                          >
                            Mark Sent
                          </Button>
                        )}
                        <Button
                          onClick={() => handleSelectWinner(event.playerName)}
                          size="sm"
                          className="text-white"
                          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                        >
                          Select Winner
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Selected Winner */}
        {selectedWinner && (
          <Card className="p-6 mb-8" style={{ borderLeft: `4px solid ${BRAND_COLORS.GOLD}` }}>
            <h3 className="text-xl font-bold mb-3">🏆 Selected Winner</h3>
            <p className="text-lg mb-4">
              <span className="font-semibold" style={{ color: BRAND_COLORS.PRIMARY }}>
                {selectedWinner}
              </span>
              {' '}has been selected as today's winner!
            </p>
            <p className="text-gray-600 mb-4">
              Prepare their reward: Free meal or discount voucher
            </p>
            <Button
              onClick={() => {
                toast.success('Winner notification sent!');
                setSelectedWinner(null);
              }}
              className="text-white"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              Send Winner Notification
            </Button>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-blue-50">
          <h3 className="text-lg font-bold mb-3">📋 Instructions</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Monitor jackpot events in real-time</li>
            <li>• Mark notifications as sent when you contact winners</li>
            <li>• Select daily winners to announce on social media</li>
            <li>• Track all player data for loyalty program</li>
            <li>• Review weekly champion history</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
