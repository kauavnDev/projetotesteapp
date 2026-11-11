import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, date,
  index, uniqueIndex, pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const freqEnum = pgEnum("freq", ["daily", "weekly", "monthly"]);
export const goalCatEnum = pgEnum("goal_category", ["health", "money", "skill", "habit", "other"]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "completed", "archived"]);
export const schedEnum = pgEnum("schedule_type", ["daily", "weekly", "monthly", "custom"]);
export const platformEnum = pgEnum("platform", ["ios", "android", "web"]);
export const themeEnum = pgEnum("theme_pref", ["light", "dark", "system"]);
export const quoteFreqEnum = pgEnum("quote_freq", ["multiple_per_day", "daily", "weekly", "custom"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userIdx: index("refresh_user_idx").on(t.userId) }));

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: themeEnum("theme").notNull().default("system"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  widgetConfig: jsonb("widget_config").$type<{ quote: boolean; savings: boolean; routine: boolean }>()
    .notNull().default({ quote: true, savings: true, routine: true }),
  quoteFrequency: quoteFreqEnum("quote_frequency").notNull().default("daily"),
  quoteTimesPerDay: integer("quote_times_per_day").notNull().default(1),
  quoteDaysOfWeek: jsonb("quote_days_of_week").$type<number[]>().notNull().default([1,2,3,4,5,6,0]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savingsPlans = pgTable("savings_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  frequency: freqEnum("frequency").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userIdx: index("savings_plan_user_idx").on(t.userId) }));

export const savingsEntries = pgTable("savings_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => savingsPlans.id, { onDelete: "set null" }),
  amountCents: integer("amount_cents").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userDateIdx: index("savings_entry_user_date_idx").on(t.userId, t.date) }));

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetAmountCents: integer("target_amount_cents"),
  targetDate: date("target_date"),
  category: goalCatEnum("category").notNull().default("other"),
  status: goalStatusEnum("status").notNull().default("active"),
  progressPct: integer("progress_pct").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userIdx: index("goal_user_idx").on(t.userId) }));

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  scheduleType: schedEnum("schedule_type").notNull().default("daily"),
  scheduleConfig: jsonb("schedule_config").$type<{ days?: number[]; dayOfMonth?: number; interval?: number; anchor?: string }>()
    .notNull().default({}),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  color: text("color").notNull().default("#E11D48"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userIdx: index("routine_user_idx").on(t.userId) }));

export const routineTasks = pgTable("routine_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  timeOfDay: text("time_of_day"),
  durationMinutes: integer("duration_minutes"),
}, (t) => ({ routineIdx: index("routine_task_routine_idx").on(t.routineId) }));

export const routineCompletions = pgTable("routine_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => routineTasks.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  completed: boolean("completed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex("routine_completions_unique").on(t.taskId, t.date),
  userDateIdx: index("routine_comp_user_date_idx").on(t.userId, t.date),
}));

export const bodyCheckins = pgTable("body_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weightGrams: integer("weight_grams"),
  mood: integer("mood"),
  energy: integer("energy"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userDateIdx: index("body_user_date_idx").on(t.userId, t.date) }));

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  author: text("author"),
  category: text("category"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userQuoteHistory = pgTable("user_quote_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  shownAt: timestamp("shown_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userShownIdx: index("uqh_user_shown_idx").on(t.userId, t.shownAt) }));

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: platformEnum("platform").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
