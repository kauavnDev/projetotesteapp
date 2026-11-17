import { pgTable, uuid, varchar, text, timestamp, integer, numeric, boolean, date, jsonb, uniqueIndex, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name",{length:60}).notNull(),
  email: varchar("email",{length:254}).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role",{length:10}).notNull().default("user"),
  heightCm: integer("height_cm"),
  weightKg: numeric("weight_kg",{precision:5,scale:2}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  title: varchar("title",{length:80}).notNull(), frequency: varchar("frequency",{length:12}).notNull(),
  days: jsonb("days").$type<number[]>().notNull().default([]), time: varchar("time",{length:5}),
  color: varchar("color",{length:7}).notNull(), active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), habitId: uuid("habit_id").references(()=>habits.id,{onDelete:"cascade"}).notNull(),
  userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(), logDate: date("log_date").notNull(),
  completed: boolean("completed").notNull().default(true), points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({dailyUnique: uniqueIndex("habit_logs_user_habit_day").on(t.userId,t.habitId,t.logDate)}));
export const financeTransactions = pgTable("finance_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  type: varchar("type",{length:10}).notNull(),
  amount: numeric("amount",{precision:12,scale:2}).notNull(),
  category: varchar("category",{length:40}).notNull(),
  description: varchar("description",{length:240}),
  occurredAt: date("occurred_at").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({userDateIndex:index("finance_transactions_user_date_idx").on(t.userId,t.occurredAt)}));
export const savingsEntries = pgTable("savings_entries", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  type: varchar("type",{length:12}).notNull(), amount: numeric("amount",{precision:12,scale:2}).notNull(),
  reason: text("reason"), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  title: varchar("title",{length:100}).notNull(), targetAmount: numeric("target_amount",{precision:12,scale:2}).notNull(),
  deadline: date("deadline").notNull(), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  source: varchar("source",{length:30}).notNull(), sourceId: uuid("source_id"), points: integer("points").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({userIndex:index("points_ledger_user_id_idx").on(t.userId)}));
export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(), text: varchar("text",{length:300}).notNull(), color: varchar("color",{length:7}).notNull(),
  animation: varchar("animation",{length:12}).notNull(), author: varchar("author",{length:80}).notNull(),
  active: boolean("active").notNull().default(true), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const bodyPhotos = pgTable("body_photos", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  view: varchar("view",{length:12}).notNull(), storageKey: text("storage_key").notNull().unique(), mimeType: varchar("mime_type",{length:40}).notNull().default("image/jpeg"), fileSize: integer("file_size").notNull().default(0), takenAt: timestamp("taken_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({userTakenIndex:index("body_photos_user_taken_idx").on(t.userId,t.takenAt)}));
export const bodyAnalyses = pgTable("body_analyses", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  photoIds: jsonb("photo_ids").$type<string[]>().notNull(), summary: text("summary").notNull(),
  disclaimer: text("disclaimer").notNull(), consentAt: timestamp("consent_at",{withTimezone:true}).notNull().defaultNow(), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const alarms = pgTable("alarms", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  parentAlarmId: uuid("parent_alarm_id").references(():AnyPgColumn=>alarms.id,{onDelete:"cascade"}), habitId: uuid("habit_id").references(()=>habits.id,{onDelete:"set null"}), time: varchar("time",{length:5}).notNull(), days: jsonb("days").$type<number[]>().notNull().default([]),
  enabled: boolean("enabled").notNull().default(true), overrideDate: date("override_date")
}, t=>({overrideUnique:uniqueIndex("alarms_parent_override_unique").on(t.parentAlarmId,t.overrideDate)}));
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  tokenHash: text("token_hash").notNull(), expiresAt: timestamp("expires_at",{withTimezone:true}).notNull(),
  revokedAt: timestamp("revoked_at",{withTimezone:true}), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({userIndex:index("refresh_tokens_user_id_idx").on(t.userId)}));

export const mindEntries = pgTable("mind_entries", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  mood: integer("mood").notNull(), content: text("content").notNull(), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({userCreatedIndex:index("mind_entries_user_created_idx").on(t.userId,t.createdAt)}));

export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: uuid("requester_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  addresseeId: uuid("addressee_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  status: varchar("status",{length:12}).notNull().default("pending"),
  createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
}, t=>({pairUnique:uniqueIndex("friendships_pair_unique").on(t.requesterId,t.addresseeId),addresseeIndex:index("friendships_addressee_idx").on(t.addresseeId)}));
