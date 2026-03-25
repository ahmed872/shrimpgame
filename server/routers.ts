import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Game routers
  player: router({
    register: publicProcedure
      .input(z.object({
        preferredName: z.string().min(1).max(255),
        phoneNumber: z.string().min(7).max(20),
        orderSource: z.enum(['dine-in', 'app']),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log("[REGISTER] Input received:", input);
          
          const existing = await db.getPlayerByPhone(input.phoneNumber);
          console.log("[REGISTER] Existing player check:", { phoneNumber: input.phoneNumber, found: !!existing });
          
          if (existing) {
            console.log("[REGISTER] Player already exists, returning ID:", existing.id);
            return { playerId: existing.id, isNewPlayer: false };
          }

          const result = await db.createPlayer(input);
          console.log("[REGISTER] Create player result:", result);
          
          const playerId = (result as any)[0]?.insertId || (result as any)?.insertId || 0;
          console.log("[REGISTER] Extracted playerId:", playerId);
          
          if (!playerId) {
            throw new Error("No player ID returned from database");
          }
          
          return { playerId, isNewPlayer: true };
        } catch (error) {
          console.error("[REGISTER] Player registration error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to register player: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    checkAttempts: publicProcedure
      .input(z.object({
        phoneNumber: z.string(),
        ipAddress: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Check attempts only by phone number (not IP)
          const limit = await db.checkAttemptLimit(input.phoneNumber, input.ipAddress, today);
          
          const attemptsRemaining = limit ? Math.max(0, 3 - limit.attemptCount) : 3;
          const canPlay = attemptsRemaining > 0;
          
          let nextAttemptTime = null;
          if (!canPlay && limit?.lastAttemptTime) {
            const resetTime = new Date(today);
            resetTime.setDate(resetTime.getDate() + 1);
            resetTime.setHours(0, 0, 0, 0);
            nextAttemptTime = resetTime.toISOString();
          }

          return {
            attemptsRemaining,
            canPlay,
            nextAttemptTime,
          };
        } catch (error) {
          console.error("Check attempts error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check attempts',
          });
        }
      }),
  }),

  game: router({
    startSession: publicProcedure
      .input(z.object({
        playerId: z.number(),
        phoneNumber: z.string(),
        ipAddress: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const today = new Date();
          const limit = await db.checkAttemptLimit(input.phoneNumber, input.ipAddress, today);
          
          if (limit && limit.attemptCount >= 3) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Daily attempt limit reached',
            });
          }

          await db.updateAttemptLimit(input.phoneNumber, input.ipAddress, today);
          const attemptNumber = (limit?.attemptCount ?? 0) + 1;

          const dateStr = today.toISOString().split('T')[0];
          const session = await db.createGameSession({
            playerId: input.playerId,
            ipAddress: input.ipAddress,
            phoneNumber: input.phoneNumber,
            attemptNumber,
            sessionDate: today,
          });

          return { sessionId: (session as any)[0]?.insertId || 0 };
        } catch (error) {
          console.error("Start session error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start game session',
          });
        }
      }),

    submitScore: publicProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number(),
        score: z.number().int().min(0),
        finalScore: z.number().int().min(0),
        goldenShrimpCount: z.number().int().min(0),
        isJackpot: z.boolean(),
        jackpotDiscount: z.string().optional(),
        gameDuration: z.number().int().min(0),
        difficulty: z.number().int().min(1),
      }))
      .mutation(async ({ input }) => {
        try {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];

          const result = await db.saveScore({
            playerId: input.playerId,
            sessionId: input.sessionId,
            score: input.score,
            finalScore: input.finalScore,
            goldenShrimpCount: input.goldenShrimpCount,
            isJackpot: input.isJackpot,
            jackpotDiscount: input.jackpotDiscount,
            gameDuration: input.gameDuration,
            difficulty: input.difficulty,
            scoreDate: today,
          });

          // Check if this is a jackpot and log it
          if (input.isJackpot) {
            const player = await db.getPlayerByPhone("");
            if (player) {
              await db.logJackpotEvent({
                playerId: input.playerId,
                playerName: player.preferredName,
                score: input.finalScore,
                discountPercentage: input.jackpotDiscount || "10",
                eventDate: today,
              });
            }
          }

          // Update daily leaderboard
          await db.updateDailyLeaderboard(today);

          return { scoreId: (result as any)[0]?.insertId || 0 };
        } catch (error) {
          console.error("Submit score error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to submit score',
          });
        }
      }),
  }),

  leaderboard: router({
    getDaily: publicProcedure.query(async () => {
      try {
        const today = new Date();
        const leaderboard = await db.getDailyLeaderboard(today);
        return leaderboard;
      } catch (error) {
        console.error("Get daily leaderboard error:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch leaderboard',
        });
      }
    }),

    getWeekly: publicProcedure.query(async () => {
      try {
        const champions = await db.getWeeklyChampions();
        return champions;
      } catch (error) {
        console.error("Get weekly champions error:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch weekly champions',
        });
      }
    }),
  }),

  admin: router({
    getPlayers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }

        try {
          // This would need a proper query helper in db.ts
          return [];
        } catch (error) {
          console.error("Get players error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch players',
          });
        }
      }),

    getJackpotEvents: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }

        try {
          const jackpots = await db.getUnnotifiedJackpots();
          return jackpots;
        } catch (error) {
          console.error("Get jackpot events error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch jackpot events',
          });
        }
      }),

    markJackpotNotified: protectedProcedure
      .input(z.object({ jackpotId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          });
        }

        try {
          await db.markJackpotNotified(input.jackpotId);
          return { success: true };
        } catch (error) {
          console.error("Mark jackpot notified error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update jackpot status',
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
