import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
});
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const SavingsPlanSchema = z.object({
  amountCents: z.number().int().positive(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
});

export const SavingsEntrySchema = z.object({
  amountCents: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
});

export const GoalSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  targetAmountCents: z.number().int().nonnegative().optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.enum(["health", "money", "skill", "habit", "other"]).default("other"),
});

export const RoutineSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scheduleType: z.enum(["daily", "weekly", "monthly", "custom"]),
  scheduleConfig: z.object({
    days: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    interval: z.number().int().positive().optional(),
    anchor: z.string().optional(),
  }).default({}),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#E11D48"),
  tasks: z.array(z.object({
    title: z.string().min(1).max(120),
    timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    durationMinutes: z.number().int().positive().optional(),
  })).default([]),
});

export const BodyCheckinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightGrams: z.number().int().positive().max(500_000).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  photoBase64: z.string().optional(),
});

export const PrefsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  quoteFrequency: z.enum(["multiple_per_day", "daily", "weekly", "custom"]).optional(),
  quoteTimesPerDay: z.number().int().min(1).max(10).optional(),
  quoteDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  widgetConfig: z.object({
    quote: z.boolean(), savings: z.boolean(), routine: z.boolean(),
  }).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type SavingsPlanInput = z.infer<typeof SavingsPlanSchema>;
export type SavingsEntryInput = z.infer<typeof SavingsEntrySchema>;
export type GoalInput = z.infer<typeof GoalSchema>;
export type RoutineInput = z.infer<typeof RoutineSchema>;
export type BodyCheckinInput = z.infer<typeof BodyCheckinSchema>;
export type PrefsInput = z.infer<typeof PrefsSchema>;