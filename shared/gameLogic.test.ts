import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateScore,
  applyGoldenShrimpMultiplier,
  isJackpotScore,
  shouldSpawnGoldenShrimp,
  calculateDifficulty,
  calculateSpawnRate,
  formatCountdownTime,
  getNextResetTime,
  getMillisecondsUntilReset,
  isResetTime,
  getTodayString,
  getDayOfWeek,
  getDayName,
} from './gameLogic';

describe('Game Logic', () => {
  describe('calculateScore', () => {
    it('should calculate base score from catches', () => {
      const score = calculateScore(5, 1, 0);
      expect(score).toBe(50); // 5 catches * 10 points
    });

    it('should apply difficulty bonus', () => {
      const score = calculateScore(5, 2, 0);
      expect(score).toBeGreaterThan(50);
    });

    it('should add golden shrimp bonus', () => {
      const scoreWithoutGolden = calculateScore(5, 1, 0);
      const scoreWithGolden = calculateScore(5, 1, 1);
      expect(scoreWithGolden).toBeGreaterThan(scoreWithoutGolden);
    });
  });

  describe('applyGoldenShrimpMultiplier', () => {
    it('should double the score', () => {
      const original = 100;
      const multiplied = applyGoldenShrimpMultiplier(original);
      expect(multiplied).toBe(200);
    });
  });

  describe('isJackpotScore', () => {
    it('should return true for scores >= 500', () => {
      expect(isJackpotScore(500)).toBe(true);
      expect(isJackpotScore(600)).toBe(true);
    });

    it('should return false for scores < 500', () => {
      expect(isJackpotScore(499)).toBe(false);
      expect(isJackpotScore(100)).toBe(false);
    });
  });

  describe('shouldSpawnGoldenShrimp', () => {
    it('should return a boolean', () => {
      const result = shouldSpawnGoldenShrimp();
      expect(typeof result).toBe('boolean');
    });

    it('should have approximately 5% spawn chance', () => {
      const iterations = 10000;
      let goldenCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (shouldSpawnGoldenShrimp()) {
          goldenCount++;
        }
      }

      const spawnRate = goldenCount / iterations;
      // Allow 3-7% for variance
      expect(spawnRate).toBeGreaterThan(0.03);
      expect(spawnRate).toBeLessThan(0.07);
    });
  });

  describe('calculateDifficulty', () => {
    it('should start at difficulty 1', () => {
      const difficulty = calculateDifficulty(0);
      expect(difficulty).toBe(1);
    });

    it('should increase difficulty over time', () => {
      const diff0 = calculateDifficulty(0);
      const diff10 = calculateDifficulty(10);
      const diff20 = calculateDifficulty(20);

      expect(diff10).toBeGreaterThan(diff0);
      expect(diff20).toBeGreaterThan(diff10);
    });

    it('should cap at max difficulty', () => {
      const difficulty = calculateDifficulty(1000);
      expect(difficulty).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateSpawnRate', () => {
    it('should increase with difficulty', () => {
      const rate1 = calculateSpawnRate(1);
      const rate5 = calculateSpawnRate(5);
      const rate10 = calculateSpawnRate(10);

      expect(rate5).toBeGreaterThan(rate1);
      expect(rate10).toBeGreaterThan(rate5);
    });
  });

  describe('formatCountdownTime', () => {
    it('should format milliseconds to readable time', () => {
      const oneMinute = 60 * 1000;
      const formatted = formatCountdownTime(oneMinute);
      expect(formatted).toContain('m');
    });

    it('should handle hours', () => {
      const oneHour = 60 * 60 * 1000;
      const formatted = formatCountdownTime(oneHour);
      expect(formatted).toContain('h');
    });

    it('should handle seconds only', () => {
      const thirtySeconds = 30 * 1000;
      const formatted = formatCountdownTime(thirtySeconds);
      expect(formatted).toContain('s');
    });
  });

  describe('getDayOfWeek', () => {
    it('should return a number between 0-6', () => {
      const dayOfWeek = getDayOfWeek();
      expect(dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(dayOfWeek).toBeLessThanOrEqual(6);
    });

    it('should return correct day for specific date', () => {
      // January 1, 2024 was a Monday (1)
      const date = new Date(2024, 0, 1);
      const dayOfWeek = getDayOfWeek(date);
      expect(dayOfWeek).toBe(1);
    });
  });

  describe('getDayName', () => {
    it('should return correct day names', () => {
      expect(getDayName(0)).toBe('Sunday');
      expect(getDayName(1)).toBe('Monday');
      expect(getDayName(6)).toBe('Saturday');
    });

    it('should return Unknown for invalid day', () => {
      expect(getDayName(7)).toBe('Unknown');
    });
  });

  describe('getTodayString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today\'s date', () => {
      const today = getTodayString();
      const expectedToday = new Date().toISOString().split('T')[0];
      expect(today).toBe(expectedToday);
    });
  });

  describe('getNextResetTime', () => {
    it('should return a Date object', () => {
      const resetTime = getNextResetTime();
      expect(resetTime).toBeInstanceOf(Date);
    });

    it('should return 23:59 time', () => {
      const resetTime = getNextResetTime();
      expect(resetTime.getHours()).toBe(23);
      expect(resetTime.getMinutes()).toBe(59);
    });

    it('should be in the future', () => {
      const resetTime = getNextResetTime();
      expect(resetTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getMillisecondsUntilReset', () => {
    it('should return a positive number', () => {
      const ms = getMillisecondsUntilReset();
      expect(ms).toBeGreaterThan(0);
    });

    it('should be less than 24 hours', () => {
      const ms = getMillisecondsUntilReset();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      expect(ms).toBeLessThan(twentyFourHours);
    });
  });
});
