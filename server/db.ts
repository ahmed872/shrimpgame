import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  players,
  gameSessions,
  scores,
  dailyLeaderboard,
  weeklyChampions,
  dailyResetLog,
  jackpotEvents,
  gameplayAnalytics,
  attemptLimits
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Mock data storage for development
const mockData = {
  players: new Map<number, any>(),
  attemptLimits: new Map<string, any>(),
  gameSessions: new Map<number, any>(),
  scores: new Map<number, any>(),
  nextPlayerId: 1,
  nextSessionId: 1,
  nextScoreId: 1,
};

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      console.log("[Database] Using mock database instead");
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Game-specific database helpers

export async function createPlayer(data: {
  preferredName: string;
  phoneNumber: string;
  orderSource: 'dine-in' | 'app';
  ipAddress?: string;
}) {
  const db = await getDb();
  
  if (!db) {
    // Mock implementation
    const playerId = mockData.nextPlayerId++;
    mockData.players.set(playerId, { id: playerId, ...data, createdAt: new Date() });
    console.log("[Mock] Player created:", playerId);
    return [{ insertId: playerId }];
  }

  const result = await db.insert(players).values(data);
  return result;
}

export async function getPlayerByPhone(phoneNumber: string) {
  const db = await getDb();
  
  if (!db) {
    // Mock implementation
    for (const player of mockData.players.values()) {
      if (player.phoneNumber === phoneNumber) {
        return player;
      }
    }
    return null;
  }

  const result = await db.select().from(players)
    .where(eq(players.phoneNumber, phoneNumber))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function checkAttemptLimit(phoneNumber: string, ipAddress: string, today: Date) {
  const db = await getDb();
  
  if (!db) {
    // Mock implementation - key by phone number only (not IP)
    const key = `${phoneNumber}-${today.toDateString()}`;
    return mockData.attemptLimits.get(key) || null;
  }

  const result = await db.select().from(attemptLimits)
    .where(
      and(
        eq(attemptLimits.phoneNumber, phoneNumber),
        eq(attemptLimits.limitDate, today)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateAttemptLimit(phoneNumber: string, ipAddress: string, today: Date) {
  const db = await getDb();
  
  if (!db) {
    // Mock implementation - key by phone number only (not IP)
    const key = `${phoneNumber}-${today.toDateString()}`;
    const existing = mockData.attemptLimits.get(key);
    
    if (existing) {
      existing.attemptCount += 1;
      existing.lastAttemptTime = new Date();
    } else {
      mockData.attemptLimits.set(key, {
        id: mockData.attemptLimits.size + 1,
        phoneNumber,
        ipAddress,
        attemptCount: 1,
        limitDate: today,
        lastAttemptTime: new Date(),
      });
    }
    console.log(`[Mock] Attempt updated for ${phoneNumber}: count=${mockData.attemptLimits.get(key)?.attemptCount}`);
    return;
  }

  const existing = await checkAttemptLimit(phoneNumber, ipAddress, today);

  if (existing) {
    await db.update(attemptLimits)
      .set({ 
        attemptCount: existing.attemptCount + 1,
        lastAttemptTime: new Date()
      })
      .where(eq(attemptLimits.id, existing.id));
  } else {
    await db.insert(attemptLimits).values({
      phoneNumber,
      ipAddress,
      attemptCount: 1,
      limitDate: today,
      lastAttemptTime: new Date()
    });
  }
}

export async function createGameSession(data: {
  playerId: number;
  ipAddress: string;
  phoneNumber: string;
  attemptNumber: number;
  sessionDate: Date;
}) {
  const db = await getDb();
  if (!db) {
    const id = mockData.nextSessionId++;
    mockData.gameSessions.set(id, { id, ...data });
    return [{ insertId: id }];
  }

  const result = await db.insert(gameSessions).values(data);
  return result;
}

export async function saveScore(data: {
  playerId: number;
  sessionId: number;
  score: number;
  finalScore: number;
  goldenShrimpCount: number;
  isJackpot: boolean;
  jackpotDiscount?: string;
  gameDuration: number;
  difficulty: number;
  scoreDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scores).values([data]);
  return result;
}

export async function getDailyLeaderboard(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(dailyLeaderboard)
    .where(eq(dailyLeaderboard.leaderboardDate, date))
    .orderBy(dailyLeaderboard.rank);

  return result;
}

export async function updateDailyLeaderboard(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get top 3 scores for the day
  const topScores = await db.select({
    playerId: scores.playerId,
    playerName: players.preferredName,
    finalScore: scores.finalScore,
  })
    .from(scores)
    .innerJoin(players, eq(scores.playerId, players.id))
    .where(eq(scores.scoreDate, date))
    .orderBy(desc(scores.finalScore))
    .limit(3);

  // Clear existing leaderboard for this date
  await db.delete(dailyLeaderboard)
    .where(eq(dailyLeaderboard.leaderboardDate, date));

  // Insert new top 3
  if (topScores.length > 0) {
    await db.insert(dailyLeaderboard).values(
      topScores.map((score, index) => ({
        rank: index + 1,
        playerId: score.playerId,
        playerName: score.playerName,
        score: score.finalScore,
        leaderboardDate: date,
      }))
    );
  }
}

export async function getWeeklyChampions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(weeklyChampions)
    .orderBy(weeklyChampions.dayOfWeek);

  return result;
}

export async function updateWeeklyChampion(dayOfWeek: string, dayName: string, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get top score for this day from leaderboard
  const topScore = await db.select().from(dailyLeaderboard)
    .where(eq(dailyLeaderboard.leaderboardDate, date))
    .orderBy(dailyLeaderboard.rank)
    .limit(1);

  if (topScore.length > 0) {
    const score = topScore[0];
    
    // Remove old record for this day of week if exists
    await db.delete(weeklyChampions)
      .where(eq(weeklyChampions.dayOfWeek, dayOfWeek));

    // Insert new champion
    await db.insert(weeklyChampions).values({
      dayOfWeek,
      dayName,
      playerId: score.playerId,
      playerName: score.playerName,
      score: score.score,
      recordDate: date,
    });
  }
}

export async function logJackpotEvent(data: {
  playerId: number;
  playerName: string;
  score: number;
  discountPercentage: string;
  eventDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jackpotEvents).values([data]);
  return result;
}

export async function getUnnotifiedJackpots() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(jackpotEvents)
    .where(eq(jackpotEvents.notificationSent, false));

  return result;
}

export async function markJackpotNotified(jackpotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jackpotEvents)
    .set({ notificationSent: true })
    .where(eq(jackpotEvents.id, jackpotId));
}

export async function logDailyReset(data: {
  resetDate: Date;
  topPlayerId?: number;
  topPlayerName?: string;
  topScore?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dailyResetLog).values(data);
  return result;
}

export async function saveGameplayAnalytics(data: {
  analyticsDate: Date;
  totalPlayers: number;
  totalGames: number;
  averageScore: string;
  highestScore: number;
  peakHour?: number;
  totalJackpots: number;
  averageDifficulty: string;
  llmAnalysis?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(gameplayAnalytics).values([data]);
  return result;
}

export async function getTodayTopScore(today: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select({
    finalScore: scores.finalScore,
    playerId: scores.playerId,
  })
    .from(scores)
    .where(eq(scores.scoreDate, today))
    .orderBy(desc(scores.finalScore))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getPlayerStats(playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select({
    totalGames: sql`COUNT(*)`,
    highestScore: sql`MAX(finalScore)`,
    averageScore: sql`AVG(finalScore)`,
    totalJackpots: sql`SUM(CASE WHEN isJackpot THEN 1 ELSE 0 END)`,
  })
    .from(scores)
    .where(eq(scores.playerId, playerId));

  return result.length > 0 ? result[0] : null;
}
