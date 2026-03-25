import { GOLDEN_SHRIMP, JACKPOT, SCORING, GAME_CONFIG } from './gameConstants';

/**
 * Calculate score based on catches and difficulty
 */
export function calculateScore(
  catches: number,
  difficulty: number,
  goldenShrimpCount: number
): number {
  const baseScore = catches * SCORING.BASE_POINTS_PER_CATCH;
  const difficultyBonus = Math.floor(baseScore * (difficulty - 1) * 0.1);
  const goldenShrimpBonus = goldenShrimpCount * (SCORING.BASE_POINTS_PER_CATCH * GOLDEN_SHRIMP.SCORE_MULTIPLIER);
  
  return baseScore + difficultyBonus + goldenShrimpBonus;
}

/**
 * Apply Golden Shrimp multiplier to score
 */
export function applyGoldenShrimpMultiplier(score: number): number {
  return score * GOLDEN_SHRIMP.SCORE_MULTIPLIER;
}

/**
 * Check if score qualifies for Jackpot
 */
export function isJackpotScore(score: number): boolean {
  return score >= JACKPOT.TARGET_SCORE;
}

/**
 * Determine if Golden Shrimp should spawn
 */
export function shouldSpawnGoldenShrimp(): boolean {
  return Math.random() < GOLDEN_SHRIMP.SPAWN_CHANCE;
}

/**
 * Calculate difficulty level based on time elapsed
 */
export function calculateDifficulty(elapsedSeconds: number): number {
  const baseDifficulty = GAME_CONFIG.INITIAL_DIFFICULTY;
  const difficultyIncrease = Math.floor(elapsedSeconds / 10) * GAME_CONFIG.DIFFICULTY_INCREMENT;
  const finalDifficulty = Math.min(
    baseDifficulty + difficultyIncrease,
    GAME_CONFIG.MAX_DIFFICULTY
  );
  
  return Math.round(finalDifficulty * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate spawn rate based on difficulty
 */
export function calculateSpawnRate(difficulty: number): number {
  const baseRate = 1; // 1 shrimp per second
  const rateIncrease = (difficulty - 1) * GAME_CONFIG.SPAWN_RATE_INCREASE;
  return baseRate + rateIncrease;
}

/**
 * Format time remaining for countdown
 */
export function formatCountdownTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Calculate next reset time (11:59 PM)
 */
export function getNextResetTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  
  return tomorrow;
}

/**
 * Calculate milliseconds until next reset
 */
export function getMillisecondsUntilReset(): number {
  const nextReset = getNextResetTime();
  return nextReset.getTime() - Date.now();
}

/**
 * Check if it's currently reset time (within 1 minute window)
 */
export function isResetTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  return hour === 23 && minute === 59;
}

/**
 * Get today's date as string (YYYY-MM-DD)
 */
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get day of week (0-6, 0 = Sunday)
 */
export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

/**
 * Get day name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}
