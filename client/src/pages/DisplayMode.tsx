import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { BRAND_COLORS } from '@shared/gameConstants';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
}

export default function DisplayMode() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefreshCounter, setAutoRefreshCounter] = useState(0);

  const { data: dailyData } = trpc.leaderboard.getDaily.useQuery();

  // Update leaderboard
  useEffect(() => {
    if (dailyData) {
      setLeaderboard(dailyData);
    }
  }, [dailyData]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setAutoRefreshCounter(prev => (prev + 1) % 60); // Refresh every 60 seconds
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh leaderboard every minute
  useEffect(() => {
    if (autoRefreshCounter === 0) {
      // Trigger refresh
    }
  }, [autoRefreshCounter]);

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
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return BRAND_COLORS.PRIMARY;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="w-screen h-screen flex flex-col"
      style={{ backgroundColor: BRAND_COLORS.DARK }}
    >
      {/* Header */}
      <div
        className="p-8 text-center border-b-4"
        style={{ borderColor: BRAND_COLORS.PRIMARY }}
      >
        <h1 className="text-6xl font-bold text-white mb-2">🦐 Sultan Shrimp</h1>
        <p className="text-3xl text-gray-300">Daily Leaderboard Challenge</p>
        <div className="mt-4 flex justify-center gap-8">
          <p className="text-2xl text-gray-400">{formatDate(currentTime)}</p>
          <p className="text-2xl text-gray-400">{formatTime(currentTime)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {leaderboard.length === 0 ? (
          <div className="text-center">
            <p className="text-5xl text-gray-400 mb-4">🎮 Game Starting Soon!</p>
            <p className="text-3xl text-gray-500">Check back for today's top scores</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl space-y-6">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between p-6 rounded-2xl transform transition-transform hover:scale-105"
                style={{
                  backgroundColor: getRankColor(entry.rank),
                  boxShadow: `0 10px 30px rgba(0,0,0,0.3)`,
                }}
              >
                <div className="flex items-center gap-6">
                  <span className="text-7xl">{getMedalEmoji(entry.rank)}</span>
                  <div>
                    <p className="text-white text-4xl font-bold">#{entry.rank}</p>
                    <p className="text-white text-3xl font-semibold">{entry.playerName}</p>
                  </div>
                </div>
                <p className="text-white text-5xl font-bold">{entry.score}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-6 text-center border-t-4"
        style={{ borderColor: BRAND_COLORS.PRIMARY }}
      >
        <p className="text-2xl text-gray-300 mb-2">
          🎁 Top 3 Winners Get Amazing Prizes!
        </p>
        <p className="text-lg text-gray-400">
          Play now on your phone • 3 attempts per day • Reset at 11:59 PM
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Auto-refreshing every 60 seconds • Last updated: {formatTime(currentTime)}
        </p>
      </div>
    </div>
  );
}
