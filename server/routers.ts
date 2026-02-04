import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Room routes
  rooms: router({
    // Create a new room (no auth required for guest access)
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        hostId: z.number().optional(),
        guestName: z.string().min(1).max(50).optional(),
        maxParticipants: z.number().min(2).max(8).default(8),
      }))
      .mutation(async ({ input }) => {
        const code = await db.generateUniqueRoomCode();
        const roomId = await db.createRoom({
          code,
          name: input.name,
          hostId: input.hostId || 0,
          maxParticipants: input.maxParticipants,
          isActive: true,
        });

        // Add host as first participant
        const participantId = await db.addParticipant({
          roomId: Number(roomId),
          userId: input.hostId,
          guestName: input.guestName,
          isHost: true,
          isReady: false,
        });

        return {
          roomId: Number(roomId),
          code,
          participantId: Number(participantId),
        };
      }),

    // Join existing room
    join: publicProcedure
      .input(z.object({
        code: z.string().length(6),
        userId: z.number().optional(),
        guestName: z.string().min(1).max(50).optional(),
      }))
      .mutation(async ({ input }) => {
        const room = await db.getRoomByCode(input.code);
        
        if (!room) {
          throw new Error("Room not found");
        }

        if (!room.isActive) {
          throw new Error("Room is no longer active");
        }

        const participants = await db.getRoomParticipants(room.id);
        
        if (participants.length >= room.maxParticipants) {
          throw new Error("Room is full");
        }

        const participantId = await db.addParticipant({
          roomId: room.id,
          userId: input.userId,
          guestName: input.guestName,
          isHost: false,
          isReady: false,
        });

        return {
          roomId: room.id,
          participantId: Number(participantId),
          room,
        };
      }),

    // Get room details
    get: publicProcedure
      .input(z.object({
        roomId: z.number(),
      }))
      .query(async ({ input }) => {
        const room = await db.getRoomById(input.roomId);
        
        if (!room) {
          throw new Error("Room not found");
        }

        const participants = await db.getRoomParticipants(room.id);

        return {
          room,
          participants,
        };
      }),

    // Leave room
    leave: publicProcedure
      .input(z.object({
        participantId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.removeParticipant(input.participantId);
        return { success: true };
      }),

    // End room (host only)
    end: publicProcedure
      .input(z.object({
        roomId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deactivateRoom(input.roomId);
        return { success: true };
      }),
  }),

  // Participant routes
  participants: router({
    // Update ready status
    setReady: publicProcedure
      .input(z.object({
        participantId: z.number(),
        isReady: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.setParticipantReady(input.participantId, input.isReady);
        return { success: true };
      }),

    // Update current platform
    setPlatform: publicProcedure
      .input(z.object({
        participantId: z.number(),
        platform: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateParticipant(input.participantId, {
          currentPlatform: input.platform,
        });
        return { success: true };
      }),

    // Get all participants in a room
    list: publicProcedure
      .input(z.object({
        roomId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getRoomParticipants(input.roomId);
      }),
  }),

  // Swap routes
  swaps: router({
    // Record a swap
    record: publicProcedure
      .input(z.object({
        roomId: z.number(),
        fromParticipantId: z.number(),
        toParticipantId: z.number(),
        swapType: z.enum(["manual", "random"]),
      }))
      .mutation(async ({ input }) => {
        const swapId = await db.recordSwap({
          roomId: input.roomId,
          fromParticipantId: input.fromParticipantId,
          toParticipantId: input.toParticipantId,
          swapType: input.swapType,
        });
        return { swapId: Number(swapId) };
      }),

    // Get swap history for a room
    history: publicProcedure
      .input(z.object({
        roomId: z.number(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ input }) => {
        return db.getRoomSwapHistory(input.roomId, input.limit);
      }),
  }),

  messages: router({
    send: publicProcedure
      .input(z.object({
        roomId: z.number(),
        participantId: z.number(),
        senderName: z.string().min(1).max(50),
        content: z.string().min(1).max(500),
      }))
      .mutation(async ({ input }) => {
        const messageId = await db.addMessage({
          roomId: input.roomId,
          participantId: input.participantId,
          senderName: input.senderName,
          content: input.content,
        });
        return { messageId: Number(messageId) };
      }),

    list: publicProcedure
      .input(z.object({
        roomId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        return db.getRoomMessages(input.roomId, input.limit);
      }),
  }),

  sessionHistory: router({
    create: publicProcedure
      .input(z.object({
        roomId: z.number(),
        hostName: z.string().min(1).max(50),
        participantCount: z.number(),
        totalSwaps: z.number().default(0),
        totalMessages: z.number().default(0),
        sessionDuration: z.number(),
        platformsUsed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const sessionId = await db.createSessionHistory({
          roomId: input.roomId,
          hostName: input.hostName,
          participantCount: input.participantCount,
          totalSwaps: input.totalSwaps,
          totalMessages: input.totalMessages,
          sessionDuration: input.sessionDuration,
          platformsUsed: input.platformsUsed,
          endedAt: new Date(),
        });
        return { sessionId: Number(sessionId) };
      }),

    get: publicProcedure
      .input(z.object({
        roomId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getSessionHistory(input.roomId);
      }),
  }),

  replay: router({
    recordEvent: publicProcedure
      .input(z.object({
        roomId: z.number(),
        participantId: z.number(),
        eventType: z.enum(["tap", "swipe", "message", "platform_change", "video_toggle", "swap"]),
        eventData: z.string().optional(),
        targetParticipantId: z.number().optional(),
        sessionStartTime: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventId = await db.recordInteractionEvent({
          roomId: input.roomId,
          participantId: input.participantId,
          eventType: input.eventType,
          eventData: input.eventData,
          targetParticipantId: input.targetParticipantId,
          sessionStartTime: input.sessionStartTime,
        });
        return { eventId: Number(eventId) };
      }),

    getEvents: publicProcedure
      .input(z.object({
        roomId: z.number(),
        sessionStartTime: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return db.getSessionEvents(input.roomId, input.sessionStartTime || new Date());
      }),

    createSession: publicProcedure
      .input(z.object({
        roomId: z.number(),
        sessionHistoryId: z.number(),
        totalEvents: z.number(),
        sessionDuration: z.number(),
      }))
      .mutation(async ({ input }) => {
        const sessionId = await db.createReplaySession({
          roomId: input.roomId,
          sessionHistoryId: input.sessionHistoryId,
          totalEvents: input.totalEvents,
          sessionDuration: input.sessionDuration,
        });
        return { sessionId: Number(sessionId) };
      }),

    getSession: publicProcedure
      .input(z.object({
        roomId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getReplaySession(input.roomId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
