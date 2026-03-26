// Demo Mode - localStorage-based storage
export interface DemoGameSession {
  playerId: string;
  playerName: string;
  playerPhone: string;
  orderingMethod: string;
  timestamp: number;
}

export interface DemoGameScore {
  playerId: string;
  playerName: string;
  score: number;
  catches: number;
  goldenCatches: number;
  timeElapsed: number;
  timestamp: number;
}

const STORAGE_KEYS = {
  SESSION: 'demo_game_session',
  SCORES: 'demo_game_scores',
  ATTEMPTS: 'demo_game_attempts',
};

export const demoMode = {
  // Session Management
  saveSession(data: Omit<DemoGameSession, 'playerId' | 'timestamp'>) {
    const playerId = `player_${Date.now()}`;
    const session: DemoGameSession = {
      playerId,
      playerName: data.playerName,
      playerPhone: data.playerPhone,
      orderingMethod: data.orderingMethod,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    return session;
  },

  getSession(): DemoGameSession | null {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // Attempts Management (Local Validation)
  getAttempts(): number {
    const attempts = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return attempts ? parseInt(attempts) : 3; // Default 3 attempts
  },

  decrementAttempts(): number {
    const current = this.getAttempts();
    const remaining = Math.max(0, current - 1);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, String(remaining));
    return remaining;
  },

  resetAttempts() {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, '3');
  },

  // Score Management
  saveScore(score: Omit<DemoGameScore, 'timestamp' | 'playerId'>) {
    const session = this.getSession();
    if (!session) return null;

    const scoreEntry: DemoGameScore = {
      playerId: session.playerId,
      playerName: score.playerName,
      score: score.score,
      catches: score.catches,
      goldenCatches: score.goldenCatches,
      timeElapsed: score.timeElapsed,
      timestamp: Date.now(),
    };

    const scores = this.getAllScores();
    scores.push(scoreEntry);
    scores.sort((a, b) => b.score - a.score); // Sort descending
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
    return scoreEntry;
  },

  getAllScores(): DemoGameScore[] {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES);
    return data ? JSON.parse(data) : [];
  },

  getTopScores(limit: number = 10): DemoGameScore[] {
    return this.getAllScores().slice(0, limit);
  },

  getTodayScores(): DemoGameScore[] {
    const now = Date.now();
    const today = now - (now % (24 * 60 * 60 * 1000)); // Start of today
    return this.getAllScores().filter((score) => score.timestamp >= today);
  },

  getDailyLeaderboard(limit: number = 3) {
    return this.getTodayScores()
      .slice(0, limit)
      .map((score, idx) => ({
        rank: idx + 1,
        playerName: score.playerName,
        score: score.score,
      }));
  },

  // Mock Data for demo
  getMockDailyLeaderboard() {
    return [
      { rank: 1, playerName: 'أحمد الفائز', score: 4520 },
      { rank: 2, playerName: 'سارة النشيطة', score: 3890 },
      { rank: 3, playerName: 'محمود الماهر', score: 3250 },
    ];
  },

  getMockWeeklyChampions() {
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return daysOfWeek.map((day, idx) => ({
      dayOfWeek: idx.toString(),
      dayName: day,
      playerName: ['علي', 'فاطمة', 'محمد', 'ليلى', 'حسن', 'نور', 'زيد'][idx],
      score: Math.floor(Math.random() * 2000) + 2500,
    }));
  },
};
