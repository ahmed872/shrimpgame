/**
 * Game configuration and constants
 */

// Game difficulty settings
export const GAME_CONFIG = {
  INITIAL_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  DIFFICULTY_INCREMENT: 0.5,
  SPAWN_RATE_INCREASE: 0.1, // Per difficulty level
};

// Golden Shrimp settings
export const GOLDEN_SHRIMP = {
  SPAWN_CHANCE: 0.05, // 5% chance per catch
  SCORE_MULTIPLIER: 2,
  EXTRA_ATTEMPT: true,
};

// Jackpot settings
export const JACKPOT = {
  TARGET_SCORE: 500, // Very difficult to achieve
  DISCOUNT_PERCENTAGE: 10,
  NOTIFICATION_ENABLED: true,
};

// Attempt limiting
export const ATTEMPT_LIMITS = {
  MAX_ATTEMPTS_PER_DAY: 3,
  RESET_HOUR: 23,
  RESET_MINUTE: 59,
};

// Leaderboard settings
export const LEADERBOARD = {
  TOP_POSITIONS: 3,
  DAILY_RESET_TIME: '23:59', // 11:59 PM
};

// Game duration (in seconds)
export const GAME_DURATION = {
  MIN: 30,
  MAX: 300,
};

// Scoring
export const SCORING = {
  BASE_POINTS_PER_CATCH: 10,
  DIFFICULTY_MULTIPLIER: 1.5,
};

// Colors for branding
export const BRAND_COLORS = {
  PRIMARY: '#E74C3C', // Red (shrimp color)
  SECONDARY: '#F39C12', // Orange
  ACCENT: '#27AE60', // Green
  DARK: '#2C3E50',
  LIGHT: '#ECF0F1',
  GOLD: '#F1C40F', // For Golden Shrimp
};

// Days of week
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
