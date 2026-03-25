import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { BRAND_COLORS, DAYS_OF_WEEK } from '@shared/gameConstants';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
}

interface WeeklyChampion {
  dayOfWeek: string;
  dayName: string;
  playerName: string;
  score: number;
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyChampions, setWeeklyChampions] = useState<WeeklyChampion[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const { data: dailyData, isLoading: dailyLoading } = trpc.leaderboard.getDaily.useQuery();
  const { data: weeklyData, isLoading: weeklyLoading } = trpc.leaderboard.getWeekly.useQuery();

  useEffect(() => {
    if (dailyData) {
      setDailyLeaderboard(dailyData);
    }
  }, [dailyData]);

  useEffect(() => {
    if (weeklyData) {
      setWeeklyChampions(weeklyData);
    }
  }, [weeklyData]);

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏆';
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return BRAND_COLORS.PRIMARY;
    }
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: BRAND_COLORS.LIGHT }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: BRAND_COLORS.PRIMARY }}>
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600">See who's winning today!</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 justify-center">
          <Button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'daily'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{
              backgroundColor: activeTab === 'daily' ? BRAND_COLORS.PRIMARY : 'white',
            }}
          >
            Today's Top 3
          </Button>
          <Button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{
              backgroundColor: activeTab === 'weekly' ? BRAND_COLORS.PRIMARY : 'white',
            }}
          >
            Weekly Champions
          </Button>
        </div>

        {/* Daily Leaderboard */}
        {activeTab === 'daily' && (
          <div className="space-y-3">
            {dailyLoading ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">Loading leaderboard...</p>
              </Card>
            ) : dailyLeaderboard.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600 mb-4">No scores yet today</p>
                <Button
                  onClick={() => setLocation('/')}
                  style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                  className="text-white"
                >
                  Play Now
                </Button>
              </Card>
            ) : (
              dailyLeaderboard.map((entry) => (
                <Card
                  key={entry.rank}
                  className="p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getMedalEmoji(entry.rank)}</span>
                    <div>
                      <p className="font-semibold text-lg">{entry.playerName}</p>
                      <p className="text-sm text-gray-600">Rank #{entry.rank}</p>
                    </div>
                  </div>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: getRankColor(entry.rank) }}
                  >
                    {entry.score}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Weekly Champions */}
        {activeTab === 'weekly' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyLoading ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-gray-600">Loading weekly champions...</p>
              </Card>
            ) : weeklyChampions.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-gray-600">No weekly data yet</p>
              </Card>
            ) : (
              weeklyChampions.map((champion) => (
                <Card
                  key={champion.dayOfWeek}
                  className="p-4"
                  style={{ borderLeft: `4px solid ${BRAND_COLORS.PRIMARY}` }}
                >
                  <p className="font-semibold text-lg mb-2">{champion.dayName}</p>
                  <p className="text-2xl font-bold" style={{ color: BRAND_COLORS.PRIMARY }}>
                    {champion.playerName}
                  </p>
                  <p className="text-gray-600 mt-1">Score: {champion.score}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation('/')}
            className="px-8 py-3 text-white font-semibold rounded-lg"
            style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
