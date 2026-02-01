import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rooms, participants, swapHistory, InsertRoom, InsertParticipant, InsertSwapHistory } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
      values.role = "admin";
      updateSet.role = "admin";
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

// Room operations
export async function createRoom(data: InsertRoom) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rooms).values(data);
  return Number(result[0].insertId);
}

export async function getRoomByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(rooms).where(eq(rooms.code, code));
  return result[0] || null;
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(rooms).where(eq(rooms.id, id));
  return result[0] || null;
}

export async function updateRoom(id: number, data: Partial<InsertRoom>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rooms).set(data).where(eq(rooms.id, id));
}

export async function deactivateRoom(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rooms).set({ isActive: false }).where(eq(rooms.id, id));
}

// Participant operations
export async function addParticipant(data: InsertParticipant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(participants).values(data);
  return Number(result[0].insertId);
}

export async function getRoomParticipants(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(participants).where(eq(participants.roomId, roomId));
}

export async function getParticipantById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(participants).where(eq(participants.id, id));
  return result[0] || null;
}

export async function updateParticipant(id: number, data: Partial<InsertParticipant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(participants).set(data).where(eq(participants.id, id));
}

export async function removeParticipant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(participants).where(eq(participants.id, id));
}

export async function setParticipantReady(id: number, isReady: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(participants).set({ isReady }).where(eq(participants.id, id));
}

// Swap history operations
export async function recordSwap(data: InsertSwapHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(swapHistory).values(data);
  return Number(result[0].insertId);
}

export async function getRoomSwapHistory(roomId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(swapHistory)
    .where(eq(swapHistory.roomId, roomId))
    .orderBy(desc(swapHistory.createdAt))
    .limit(limit);
}

// Utility functions
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function isRoomCodeUnique(code: string): Promise<boolean> {
  const room = await getRoomByCode(code);
  return room === null;
}

export async function generateUniqueRoomCode(): Promise<string> {
  let code = generateRoomCode();
  let attempts = 0;
  
  while (!(await isRoomCodeUnique(code)) && attempts < 10) {
    code = generateRoomCode();
    attempts++;
  }
  
  if (attempts >= 10) {
    throw new Error("Failed to generate unique room code");
  }
  
  return code;
}
