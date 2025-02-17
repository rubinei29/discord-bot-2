import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lobbies = pgTable("lobbies", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  active: boolean("active").notNull().default(true),
});

export const lobbyMembers = pgTable("lobby_members", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobby_id").notNull(),
  userId: text("user_id").notNull(),
  timeoutExpiry: timestamp("timeout_expiry"),
});

export const queueMembers = pgTable("queue_members", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobby_id").notNull(),
  userId: text("user_id").notNull(),
  position: integer("position").notNull(),
  timeoutExpiry: timestamp("timeout_expiry"),
});

export const insertLobbySchema = createInsertSchema(lobbies);
export const insertLobbyMemberSchema = createInsertSchema(lobbyMembers);
export const insertQueueMemberSchema = createInsertSchema(queueMembers);

export type Lobby = typeof lobbies.$inferSelect;
export type LobbyMember = typeof lobbyMembers.$inferSelect;
export type QueueMember = typeof queueMembers.$inferSelect;
