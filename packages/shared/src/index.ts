import { z } from "zod";

export const emailSchema = z.string().email().max(254).transform(v => v.toLowerCase());
export const passwordSchema = z.string().min(10).max(128);
export const registerSchema = z.object({ name: z.string().trim().min(2).max(60), email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

const habitObjectSchema = z.object({
  title: z.string().trim().min(2).max(80),
  frequency: z.enum(["daily","weekdays","weekends","custom"]).default("daily"),
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#E11D48")
});
export const habitSchema = habitObjectSchema;
export const habitCreateSchema = habitObjectSchema.superRefine((value,ctx)=>{
  if(value.frequency==="custom"&&value.days.length===0){
    ctx.addIssue({code:"custom",path:["days"],message:"Selecione ao menos um dia para a frequência personalizada."});
  }
});

export const savingsSchema = z.object({
  type: z.enum(["deposit","withdrawal"]),
  amount: z.number().positive().max(1000000).refine(v=>Math.abs(v*100-Math.round(v*100))<1e-8,{message:"Informe no máximo duas casas decimais."}),
  reason: z.string().trim().max(500).optional()
}).superRefine((v, ctx) => {
  if (v.type === "withdrawal" && (!v.reason || v.reason.length < 12)) {
    ctx.addIssue({ code: "custom", path: ["reason"], message: "Informe um motivo detalhado (mínimo 12 caracteres)." });
  }
});
export const goalSchema = z.object({
  title: z.string().trim().min(2).max(100),
  targetAmount: z.number().positive().max(10000000),
  deadline: z.string().date()
});
export const alarmSchema = z.object({
  habitId: z.string().uuid().nullable().optional(),
  parentAlarmId: z.string().uuid().nullable().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  enabled: z.boolean().default(true),
  overrideDate: z.string().date().nullable().optional()
});
export const quoteSchema = z.object({
  text: z.string().trim().min(5).max(300),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#E11D48"),
  animation: z.enum(["none","fade","pulse","gradient"]).default("fade"),
  author: z.string().trim().max(80).default("Forge")
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type HabitInput = z.infer<typeof habitCreateSchema>;
export type SavingsInput = z.infer<typeof savingsSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

export const mindEntrySchema = z.object({ mood: z.number().int().min(1).max(5), content: z.string().trim().min(1).max(2000) });
export type MindEntryInput = z.infer<typeof mindEntrySchema>;

export function calculateSavingsPoints(netBalance:number):number {
  return Number.isFinite(netBalance) ? Math.max(0,Math.floor(netBalance+0.000001)) : 0;
}
export function isHabitScheduledOnDate(frequency:"daily"|"weekdays"|"weekends"|"custom",days:number[],date:string):boolean {
  const parsed=new Date(`${date}T00:00:00Z`);
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)return false;
  const day=parsed.getUTCDay();
  return frequency==="daily"||(frequency==="weekdays"&&day>=1&&day<=5)||(frequency==="weekends"&&(day===0||day===6))||(frequency==="custom"&&days.includes(day));
}

export const financeTransactionSchema = z.object({
  type: z.enum(["income","expense"]),
  amount: z.number().positive().max(10000000).refine(v=>Math.abs(v*100-Math.round(v*100))<1e-8,{message:"Informe no máximo duas casas decimais."}),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().max(240).optional(),
  occurredAt: z.string().date()
});
export type FinanceTransactionInput = z.infer<typeof financeTransactionSchema>;

export const friendInviteSchema = z.object({ email: emailSchema });
export const friendRequestActionSchema = z.object({ action: z.enum(["accept","decline"]) });
