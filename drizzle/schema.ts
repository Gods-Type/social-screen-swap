import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

// Rooms table - stores screen sharing rooms
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  hostId: int("hostId").notNull(),
  maxParticipants: int("maxParticipants").default(8).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Participants table - stores users in rooms
export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId"),
  guestName: varchar("guestName", { length: 50 }),
  isReady: boolean("isReady").default(false).notNull(),
  isHost: boolean("isHost").default(false).notNull(),
  currentPlatform: varchar("currentPlatform", { length: 50 }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().onUpdateNow().notNull(),
});

// Swap history table - tracks screen swaps
export const swapHistory = mysqlTable("swapHistory", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  fromParticipantId: int("fromParticipantId").notNull(),
  toParticipantId: int("toParticipantId").notNull(),
  swapType: mysqlEnum("swapType", ["manual", "random"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

export type SwapHistory = typeof swapHistory.$inferSelect;
export type InsertSwapHistory = typeof swapHistory.$inferInsert;

// Messages table - stores in-app chat messages
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  participantId: int("participantId").notNull(),
  senderName: varchar("senderName", { length: 50 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Session history table - stores session metadata and statistics
export const sessionHistory = mysqlTable("sessionHistory", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  hostName: varchar("hostName", { length: 50 }).notNull(),
  participantCount: int("participantCount").notNull(),
  totalSwaps: int("totalSwaps").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  sessionDuration: int("sessionDuration").notNull(), // in seconds
  platformsUsed: text("platformsUsed"), // JSON array of platforms
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt").notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type SessionHistory = typeof sessionHistory.$inferSelect;
export type InsertSessionHistory = typeof sessionHistory.$inferInsert;
