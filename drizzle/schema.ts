import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  date,
  bigint,
  json
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with game-specific fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Player registration data collected from landing page
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  preferredName: varchar("preferredName", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  orderSource: mysqlEnum("orderSource", ["dine-in", "app"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Game session tracking for attempt limiting
 */
export const gameSessions = mysqlTable("gameSessions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  attemptNumber: int("attemptNumber").notNull(),
  sessionDate: date("sessionDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;

/**
 * Game scores and results
 */
export const scores = mysqlTable("scores", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  sessionId: int("sessionId").notNull(),
  score: int("score").notNull(),
  finalScore: int("finalScore").notNull(), // After multipliers
  goldenShrimpCount: int("goldenShrimpCount").default(0).notNull(),
  isJackpot: boolean("isJackpot").default(false).notNull(),
  jackpotDiscount: decimal("jackpotDiscount", { precision: 5, scale: 2 }).default("0"),
  gameDuration: int("gameDuration").notNull(), // in seconds
  difficulty: int("difficulty").notNull(), // final difficulty level reached
  scoreDate: date("scoreDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Score = typeof scores.$inferSelect;
export type InsertScore = typeof scores.$inferInsert;

/**
 * Daily leaderboard snapshot
 */
export const dailyLeaderboard = mysqlTable("dailyLeaderboard", {
  id: int("id").autoincrement().primaryKey(),
  rank: int("rank").notNull(), // 1, 2, 3
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 255 }).notNull(),
  score: int("score").notNull(),
  leaderboardDate: date("leaderboardDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyLeaderboard = typeof dailyLeaderboard.$inferSelect;
export type InsertDailyLeaderboard = typeof dailyLeaderboard.$inferInsert;

/**
 * Weekly champions archive
 */
export const weeklyChampions = mysqlTable("weeklyChampions", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: varchar("dayOfWeek", { length: 10 }).notNull(), // 0-6 (Sunday-Saturday)
  dayName: varchar("dayName", { length: 20 }).notNull(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 255 }).notNull(),
  score: int("score").notNull(),
  recordDate: date("recordDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyChampion = typeof weeklyChampions.$inferSelect;
export type InsertWeeklyChampion = typeof weeklyChampions.$inferInsert;

/**
 * Daily reset log for tracking when resets occur
 */
export const dailyResetLog = mysqlTable("dailyResetLog", {
  id: int("id").autoincrement().primaryKey(),
  resetDate: date("resetDate").notNull(),
  topPlayerId: int("topPlayerId"),
  topPlayerName: varchar("topPlayerName", { length: 255 }),
  topScore: int("topScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyResetLog = typeof dailyResetLog.$inferSelect;
export type InsertDailyResetLog = typeof dailyResetLog.$inferInsert;

/**
 * Jackpot events log
 */
export const jackpotEvents = mysqlTable("jackpotEvents", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 255 }).notNull(),
  score: int("score").notNull(),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).notNull(),
  notificationSent: boolean("notificationSent").default(false).notNull(),
  eventDate: date("eventDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JackpotEvent = typeof jackpotEvents.$inferSelect;
export type InsertJackpotEvent = typeof jackpotEvents.$inferInsert;

/**
 * Gameplay analytics for LLM analysis
 */
export const gameplayAnalytics = mysqlTable("gameplayAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  analyticsDate: date("analyticsDate").notNull(),
  totalPlayers: int("totalPlayers").notNull(),
  totalGames: int("totalGames").notNull(),
  averageScore: decimal("averageScore", { precision: 10, scale: 2 }).notNull(),
  highestScore: int("highestScore").notNull(),
  peakHour: int("peakHour"), // 0-23
  totalJackpots: int("totalJackpots").default(0).notNull(),
  averageDifficulty: decimal("averageDifficulty", { precision: 5, scale: 2 }).notNull(),
  llmAnalysis: text("llmAnalysis"), // JSON string with recommendations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameplayAnalytics = typeof gameplayAnalytics.$inferSelect;
export type InsertGameplayAnalytics = typeof gameplayAnalytics.$inferInsert;

/**
 * Attempt tracking for rate limiting
 */
export const attemptLimits = mysqlTable("attemptLimits", {
  id: int("id").autoincrement().primaryKey(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptTime: timestamp("lastAttemptTime"),
  resetTime: timestamp("resetTime"),
  limitDate: date("limitDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttemptLimit = typeof attemptLimits.$inferSelect;
export type InsertAttemptLimit = typeof attemptLimits.$inferInsert;
