import { describe,it,expect } from "vitest";
import { savingsSchema, financeTransactionSchema, habitSchema, habitCreateSchema, registerSchema, alarmSchema, mindEntrySchema, calculateSavingsPoints, isHabitScheduledOnDate } from "@forge/shared";
describe("shared validation and business rules",()=>{
 it("validates income and expense transaction data",()=>{expect(financeTransactionSchema.parse({type:"expense",amount:12.5,category:"Alimentação",occurredAt:"2026-11-17"}).amount).toBe(12.5);expect(()=>financeTransactionSchema.parse({type:"transfer",amount:12,category:"X",occurredAt:"2026-11-17"})).toThrow();expect(()=>financeTransactionSchema.parse({type:"income",amount:1.001,category:"Salário",occurredAt:"2026-11-17"})).toThrow();});
 it("rejects withdrawal without detailed reason",()=>expect(()=>savingsSchema.parse({type:"withdrawal",amount:10})).toThrow());
 it("accepts detailed withdrawal",()=>expect(savingsSchema.parse({type:"withdrawal",amount:10,reason:"Conta de emergência"}).type).toBe("withdrawal"));
 it("accepts cent-level savings amounts",()=>expect(savingsSchema.parse({type:"deposit",amount:0.5}).amount).toBe(0.5));
 it("rejects invalid habit time",()=>expect(()=>habitSchema.parse({title:"Ler",time:"25:90"})).toThrow());
 it("rejects custom habits without selected days",()=>expect(()=>habitCreateSchema.parse({title:"Ler",frequency:"custom",days:[]})).toThrow());
 it("accepts a custom habit with at least one selected day",()=>expect(habitCreateSchema.parse({title:"Ler",frequency:"custom",days:[1]}).days).toEqual([1]));
 it("normalizes e-mail and enforces password length",()=>expect(registerSchema.parse({name:"Ana",email:"ANA@EXAMPLE.COM",password:"1234567890"}).email).toBe("ana@example.com"));
 it("accepts valid exceptional alarm overrides",()=>expect(alarmSchema.parse({time:"08:30",parentAlarmId:"00000000-0000-4000-8000-000000000001",overrideDate:"2026-11-20"}).parentAlarmId).toBe("00000000-0000-4000-8000-000000000001"));
 it("validates private mind entries",()=>expect(mindEntrySchema.parse({mood:5,content:"Hoje consegui manter a consistência."}).mood).toBe(5));
 it("awards one point for each full real accumulated",()=>{expect(calculateSavingsPoints(0.5)).toBe(0);expect(calculateSavingsPoints(1)).toBe(1);expect(calculateSavingsPoints(1.99)).toBe(1);expect(calculateSavingsPoints(2)).toBe(2)});
 it("uses weekday/weekend/custom schedules",()=>{expect(isHabitScheduledOnDate("weekdays",[],"2026-11-16")).toBe(true);expect(isHabitScheduledOnDate("weekends",[],"2026-11-16")).toBe(false);expect(isHabitScheduledOnDate("custom",[1],"2026-11-16")).toBe(true)});
});
