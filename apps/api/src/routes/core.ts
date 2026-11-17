import { Hono } from "hono";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { habits, habitLogs, savingsEntries, goals, pointsLedger, quotes, alarms, users, mindEntries, financeTransactions } from "../db/schema.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { habitSchema, habitCreateSchema, savingsSchema, goalSchema, quoteSchema, alarmSchema, mindEntrySchema, calculateSavingsPoints, isHabitScheduledOnDate, financeTransactionSchema } from "@forge/shared";

export const coreRoutes = new Hono();
async function syncSavingsPoints(executor:any,userId:string) {
 const rows=await executor.select().from(savingsEntries).where(eq(savingsEntries.userId,userId));
 const balance=rows.reduce((sum:number,e:any)=>sum+(e.type==="deposit"?1:-1)*Number(e.amount),0);
 await executor.delete(pointsLedger).where(and(eq(pointsLedger.userId,userId),eq(pointsLedger.source,"savings")));
 await executor.insert(pointsLedger).values({userId,source:"savings",sourceId:null,points:calculateSavingsPoints(balance)});
}
coreRoutes.use("*",auth);

coreRoutes.get("/habits",async c=>{
 const uid=c.get("user").id, rows=await db.select().from(habits).where(eq(habits.userId,uid)).orderBy(desc(habits.createdAt));
 const cutoff=new Date(Date.now()-400*86400000).toISOString().slice(0,10);
 const logs=await db.select().from(habitLogs).where(and(eq(habitLogs.userId,uid),gte(habitLogs.logDate,cutoff)));
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:process.env.APP_TIME_ZONE??"America/Sao_Paulo"}).format(new Date());
 return c.json(rows.map(h=>{
  const dates=new Set(logs.filter(l=>l.habitId===h.id&&l.completed).map(l=>l.logDate));
  let cursor=new Date(`${today}T00:00:00Z`),streak=0;
  if(isHabitScheduledOnDate(h.frequency as any,h.days??[],today)&&!dates.has(today))cursor.setUTCDate(cursor.getUTCDate()-1);
  for(let guard=0;guard<400;guard++){
   const date=cursor.toISOString().slice(0,10);
   if(isHabitScheduledOnDate(h.frequency as any,h.days??[],date)){if(!dates.has(date))break;streak++;}
   cursor.setUTCDate(cursor.getUTCDate()-1);
  }
  return {...h,completedToday:dates.has(today),streak};
 }));
});
coreRoutes.post("/habits",async c=>{
 const b=habitCreateSchema.parse(await c.req.json()); const [r]=await db.insert(habits).values({...b,userId:c.get("user").id}).returning(); return c.json(r,201);
});
coreRoutes.patch("/habits/:id",async c=>{
 const b=habitSchema.partial().parse(await c.req.json());
 if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);
 if(b.frequency==="custom"&&b.days!==undefined&&!b.days.length)return c.json({error:{code:"INVALID_DAYS",message:"Selecione ao menos um dia para a frequência personalizada."}},400);
 const [r]=await db.update(habits).set(b).where(and(eq(habits.id,c.req.param("id")),eq(habits.userId,c.get("user").id))).returning();
 return r?c.json(r):c.json({error:{code:"NOT_FOUND",message:"Hábito não encontrado."}},404);
});
coreRoutes.delete("/habits/:id",async c=>{await db.delete(habits).where(and(eq(habits.id,c.req.param("id")),eq(habits.userId,c.get("user").id)));return c.json({ok:true});});
coreRoutes.post("/habits/:id/check",async c=>{
 const uid=c.get("user").id,date=c.req.query("date") ?? new Intl.DateTimeFormat("en-CA",{timeZone:process.env.APP_TIME_ZONE??"America/Sao_Paulo"}).format(new Date());
 const parsedDate=new Date(`${date}T00:00:00Z`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10)!==date) return c.json({error:{code:"INVALID_DATE",message:"Data inválida."}},400);
 const [h]=await db.select().from(habits).where(and(eq(habits.id,c.req.param("id")),eq(habits.userId,uid))).limit(1);
 if(!h)return c.json({error:{code:"NOT_FOUND",message:"Hábito não encontrado."}},404);
 if(!isHabitScheduledOnDate(h.frequency as any,h.days??[],date))return c.json({error:{code:"NOT_SCHEDULED",message:"Este hábito não está programado para essa data."}},409);
 const created=await db.transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${uid}:${h.id}:${date}`}))`);
  const [log]=await tx.insert(habitLogs).values({habitId:h.id,userId:uid,logDate:date,points:10}).onConflictDoNothing().returning();
  if(!log)return false;
  await tx.insert(pointsLedger).values({userId:uid,source:"habit",sourceId:log.id,points:10});return true;
 });
 return c.json({completed:true,created,points:10},created?201:200);
});
coreRoutes.delete("/habits/:id/check",async c=>{
 const uid=c.get("user").id,date=c.req.query("date") ?? new Intl.DateTimeFormat("en-CA",{timeZone:process.env.APP_TIME_ZONE??"America/Sao_Paulo"}).format(new Date());
 const parsedDate=new Date(`${date}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==date)return c.json({error:{code:"INVALID_DATE",message:"Data inválida."}},400);
 const [h]=await db.select({id:habits.id}).from(habits).where(and(eq(habits.id,c.req.param("id")),eq(habits.userId,uid))).limit(1);
 if(!h)return c.json({error:{code:"NOT_FOUND",message:"Hábito não encontrado."}},404);
 const removed=await db.transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${uid}:${h.id}:${date}`}))`);
  const [existing]=await tx.select().from(habitLogs).where(and(eq(habitLogs.habitId,h.id),eq(habitLogs.userId,uid),eq(habitLogs.logDate,date))).limit(1);
  if(!existing)return false;
  await tx.delete(habitLogs).where(eq(habitLogs.id,existing.id));await tx.delete(pointsLedger).where(and(eq(pointsLedger.source,"habit"),eq(pointsLedger.sourceId,existing.id)));return true;
 });
 return c.json({completed:false,removed,points:0});
});

coreRoutes.get("/savings",async c=>{
 const uid=c.get("user").id;
 const entries=await db.select().from(savingsEntries).where(eq(savingsEntries.userId,uid)).orderBy(desc(savingsEntries.createdAt));
 const balance=entries.reduce((s,e)=>s+(e.type==="deposit"?1:-1)*Number(e.amount),0);
 return c.json({balance:Math.round(balance*100)/100,entries});
});
coreRoutes.post("/savings",async c=>{
 const b=savingsSchema.parse(await c.req.json()), uid=c.get("user").id;
 const result=await db.transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${uid}))`);
  const prior=await tx.select().from(savingsEntries).where(eq(savingsEntries.userId,uid));
  const balance=prior.reduce((sum,e)=>sum+(e.type==="deposit"?1:-1)*Number(e.amount),0);
  if(b.type==="withdrawal" && b.amount>balance) return null;
  const [row]=await tx.insert(savingsEntries).values({userId:uid,type:b.type,amount:b.amount.toFixed(2),reason:b.reason??null}).returning();
  await syncSavingsPoints(tx,uid); return row;
 });
 if(!result)return c.json({error:{code:"INSUFFICIENT_FUNDS",message:"A retirada não pode superar seu saldo disponível."}},409);
 return c.json(result,201);
});
coreRoutes.patch("/savings/:id",async c=>{
 const b=savingsSchema.parse(await c.req.json()), uid=c.get("user").id;
 const result=await db.transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${uid}))`);
  const [old]=await tx.select().from(savingsEntries).where(and(eq(savingsEntries.id,c.req.param("id")),eq(savingsEntries.userId,uid))).limit(1);
  if(!old)return {kind:"missing" as const};
  const prior=await tx.select().from(savingsEntries).where(eq(savingsEntries.userId,uid));
  const balance=prior.reduce((sum,e)=>sum+(e.type==="deposit"?1:-1)*Number(e.amount),0);
  const oldContribution=(old.type==="deposit"?1:-1)*Number(old.amount),nextContribution=(b.type==="deposit"?1:-1)*b.amount;
  if(balance-oldContribution+nextContribution<0)return {kind:"funds" as const};
  const [row]=await tx.update(savingsEntries).set({type:b.type,amount:b.amount.toFixed(2),reason:b.reason??null}).where(eq(savingsEntries.id,old.id)).returning();
  await syncSavingsPoints(tx,uid);return {kind:"ok" as const,row};
 });
 if(result.kind==="missing")return c.json({error:{code:"NOT_FOUND",message:"Lançamento não encontrado."}},404);
 if(result.kind==="funds")return c.json({error:{code:"INSUFFICIENT_FUNDS",message:"A edição deixaria seu saldo negativo."}},409);
 return c.json(result.row);
});
coreRoutes.delete("/savings/:id",async c=>{
 const id=c.req.param("id"),uid=c.get("user").id;
 const result=await db.transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${uid}))`);
  const [old]=await tx.select().from(savingsEntries).where(and(eq(savingsEntries.id,id),eq(savingsEntries.userId,uid))).limit(1);
  if(!old)return "missing";
  const prior=await tx.select().from(savingsEntries).where(eq(savingsEntries.userId,uid));
  const balance=prior.reduce((sum,e)=>sum+(e.type==="deposit"?1:-1)*Number(e.amount),0);
  const next=balance-(old.type==="deposit"?1:-1)*Number(old.amount);
  if(next<0)return "funds";
  await tx.delete(savingsEntries).where(eq(savingsEntries.id,id));await syncSavingsPoints(tx,uid);return "ok";
 });
 if(result==="missing")return c.json({error:{code:"NOT_FOUND",message:"Lançamento não encontrado."}},404);
 if(result==="funds")return c.json({error:{code:"NEGATIVE_BALANCE",message:"Não é possível excluir este depósito porque existem retiradas vinculadas ao saldo."}},409);
 return c.json({ok:true});
});

coreRoutes.get("/goals",async c=>{
 const uid=c.get("user").id;
 const [goalRows,entries]=await Promise.all([db.select().from(goals).where(eq(goals.userId,uid)),db.select().from(savingsEntries).where(eq(savingsEntries.userId,uid))]);
 const balance=entries.reduce((sum,e)=>sum+(e.type==="deposit"?1:-1)*Number(e.amount),0);
 return c.json(goalRows.map(g=>({...g,savedAmount:Math.max(0,balance),progress:Math.min(100,Math.max(0,balance/Number(g.targetAmount)*100))})));
});
coreRoutes.post("/goals",async c=>{const b=goalSchema.parse(await c.req.json());const [r]=await db.insert(goals).values({userId:c.get("user").id,title:b.title,targetAmount:b.targetAmount.toFixed(2),deadline:b.deadline}).returning();return c.json(r,201);});
coreRoutes.patch("/goals/:id",async c=>{const b=goalSchema.partial().parse(await c.req.json());if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);const [r]=await db.update(goals).set({...b,targetAmount:b.targetAmount?.toFixed(2)}).where(and(eq(goals.id,c.req.param("id")),eq(goals.userId,c.get("user").id))).returning();return r?c.json(r):c.json({error:{code:"NOT_FOUND",message:"Meta não encontrada."}},404);});
coreRoutes.delete("/goals/:id",async c=>{await db.delete(goals).where(and(eq(goals.id,c.req.param("id")),eq(goals.userId,c.get("user").id)));return c.json({ok:true});});

coreRoutes.get("/leaderboard",async c=>{
 const rows=await db.select({id:users.id,name:users.name,points:sql<number>`coalesce(sum(${pointsLedger.points}),0)`}).from(users).leftJoin(pointsLedger,eq(users.id,pointsLedger.userId)).where(eq(users.active,true)).groupBy(users.id).orderBy(sql`coalesce(sum(${pointsLedger.points}),0) desc`).limit(100);
 return c.json(rows.map((r,i)=>({...r,position:i+1})));
});
const starterQuotes=[
 "Você não precisa vencer o ano hoje. Só precisa cumprir o próximo passo.",
 "Disciplina é escolher o que você quer mais, em vez do que quer agora.",
 "O progresso silencioso também é progresso. Continue.",
 "Não compare seu capítulo 2 com o capítulo 20 de outra pessoa.",
 "Pequenas escolhas repetidas viram grandes mudanças.",
 "Faça por você, inclusive nos dias em que ninguém estiver olhando.",
 "Consistência vence intensidade quando a intensidade não dura.",
 "Seu futuro é construído no que você faz quando a motivação acaba.",
 "Um erro não apaga o caminho. Aprenda, ajuste e recomece.",
 "Cuide do corpo que carrega seus sonhos.",
 "Guardar pouco ainda é guardar. O hábito vale muito.",
 "Seu dinheiro precisa de direção, não de aparência.",
 "Não é sobre nunca cair. É sobre aprender a levantar melhor.",
 "A versão que você quer ser depende das escolhas de hoje.",
 "Respeite seu ritmo, mas não abandone sua caminhada.",
 "Você pode começar de novo sem começar do zero.",
 "Foco é dizer sim ao que importa e não ao que distrai.",
 "Não espere confiança para agir. A confiança cresce com a prática.",
 "O descanso também faz parte de uma rotina sustentável.",
 "Cada hábito concluído é um voto na pessoa que você está construindo.",
 "Planeje com coragem. Execute com calma. Revise sem culpa.",
 "Seu valor não é medido por um dia ruim.",
 "A evolução real acontece quando ninguém está aplaudindo.",
 "Transforme metas grandes em passos pequenos e possíveis.",
 "Aproveite o que conquistou sem perder de vista o que deseja construir.",
 "Você não controla tudo, mas pode escolher seu próximo movimento.",
 "Uma rotina boa é aquela que cabe na vida real.",
 "Não gaste para impressionar. Guarde para ter escolhas.",
 "A paciência também é uma forma de força.",
 "Hoje é uma nova oportunidade de fazer um pouco melhor."
];
coreRoutes.get("/quotes/today",async c=>{
 let active=await db.select().from(quotes).where(eq(quotes.active,true)).orderBy(desc(quotes.createdAt));
 if(!active.length){
  await db.transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(9102026)`);
   const [existing]=await tx.select({id:quotes.id}).from(quotes).where(eq(quotes.active,true)).limit(1);
   if(!existing)await tx.insert(quotes).values(starterQuotes.map((text,i)=>({text,color:i%2?"#FB923C":"#E11D48",animation:i%3===0?"pulse":i%3===1?"fade":"gradient",author:"Forge",active:true})));
  });
  active=await db.select().from(quotes).where(eq(quotes.active,true)).orderBy(desc(quotes.createdAt));
 }
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:process.env.APP_TIME_ZONE??"America/Sao_Paulo"}).format(new Date());
 const day=Math.floor((Date.parse(today+"T00:00:00Z")-Date.parse(today.slice(0,4)+"-01-01T00:00:00Z"))/86400000);
 return c.json(active.length?active[day%active.length]:{text:"A disciplina de hoje constrói a liberdade de amanhã.",color:"#E11D48",animation:"fade",author:"Forge"});
});
coreRoutes.get("/alarms",async c=>c.json(await db.select().from(alarms).where(eq(alarms.userId,c.get("user").id))));
async function validateAlarmLinks(userId:string,b:any){
 if(b.habitId){const [h]=await db.select({id:habits.id}).from(habits).where(and(eq(habits.id,b.habitId),eq(habits.userId,userId))).limit(1);if(!h)return false;}
 if(b.parentAlarmId){const [parent]=await db.select({id:alarms.id,overrideDate:alarms.overrideDate}).from(alarms).where(and(eq(alarms.id,b.parentAlarmId),eq(alarms.userId,userId))).limit(1);if(!parent||parent.overrideDate)return false;}
 return true;
}
coreRoutes.post("/alarms",async c=>{const b=alarmSchema.parse(await c.req.json()),uid=c.get("user").id;if(Boolean(b.parentAlarmId)!==Boolean(b.overrideDate))return c.json({error:{code:"INVALID_OVERRIDE",message:"Uma exceção precisa ter alarme base e data definidos."}},400);if(!await validateAlarmLinks(uid,b))return c.json({error:{code:"INVALID_ALARM_LINK",message:"O hábito ou alarme de referência não pertence à sua conta."}},400);const [r]=await db.insert(alarms).values({...b,userId:uid,overrideDate:b.overrideDate??null,parentAlarmId:b.parentAlarmId??null,habitId:b.habitId??null}).returning();return c.json(r,201);});
coreRoutes.patch("/alarms/:id",async c=>{const b=alarmSchema.partial().parse(await c.req.json()),uid=c.get("user").id;if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);const [old]=await db.select().from(alarms).where(and(eq(alarms.id,c.req.param("id")),eq(alarms.userId,uid))).limit(1);if(!old)return c.json({error:{code:"NOT_FOUND",message:"Alarme não encontrado."}},404);const merged={...old,...b};if(Boolean(merged.parentAlarmId)!==Boolean(merged.overrideDate))return c.json({error:{code:"INVALID_OVERRIDE",message:"Uma exceção precisa ter alarme base e data definidos."}},400);if(!await validateAlarmLinks(uid,merged))return c.json({error:{code:"INVALID_ALARM_LINK",message:"O hábito ou alarme de referência não pertence à sua conta."}},400);const [r]=await db.update(alarms).set(b).where(and(eq(alarms.id,c.req.param("id")),eq(alarms.userId,uid))).returning();return c.json(r);});
coreRoutes.delete("/alarms/:id",async c=>{const uid=c.get("user").id,id=c.req.param("id");await db.delete(alarms).where(and(eq(alarms.id,id),eq(alarms.userId,uid)));await db.delete(alarms).where(and(eq(alarms.parentAlarmId,id),eq(alarms.userId,uid)));return c.json({ok:true});});


const financeMonth=(value:string|undefined)=>{
 const month=value??new Intl.DateTimeFormat("en-CA",{timeZone:process.env.APP_TIME_ZONE??"America/Sao_Paulo",year:"numeric",month:"2-digit"}).format(new Date()).slice(0,7);
 if(!/^\\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 return {month,start:`${month}-01`,end:`${month}-31`};
};
coreRoutes.get("/finance",async c=>{
 const period=financeMonth(c.req.query("month"));if(!period)return c.json({error:{code:"INVALID_MONTH",message:"Informe o mês no formato AAAA-MM."}},400);
 const rows=await db.select().from(financeTransactions).where(and(eq(financeTransactions.userId,c.get("user").id),gte(financeTransactions.occurredAt,period.start),sql`${financeTransactions.occurredAt} <= ${period.end}`)).orderBy(desc(financeTransactions.occurredAt),desc(financeTransactions.createdAt));
 const income=rows.filter(x=>x.type==="income").reduce((s,x)=>s+Number(x.amount),0),expense=rows.filter(x=>x.type==="expense").reduce((s,x)=>s+Number(x.amount),0);
 const totals=rows.filter(x=>x.type==="expense").reduce((acc:Record<string,number>,x)=>{acc[x.category]=(acc[x.category]??0)+Number(x.amount);return acc;},{});
 const categories=Object.entries(totals).map(([category,amount])=>({category,amount:Number(amount.toFixed(2))})).sort((a,b)=>b.amount-a.amount);
 return c.json({month:period.month,income:Number(income.toFixed(2)),expenses:Number(expense.toFixed(2)),balance:Number((income-expense).toFixed(2)),transactions:rows,categories});
});
coreRoutes.post("/finance",async c=>{
 const b=financeTransactionSchema.parse(await c.req.json());
 const [row]=await db.insert(financeTransactions).values({...b,userId:c.get("user").id,amount:b.amount.toFixed(2),description:b.description||null}).returning();
 return c.json(row,201);
});
coreRoutes.patch("/finance/:id",async c=>{
 const b=financeTransactionSchema.partial().parse(await c.req.json());if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);
 const [row]=await db.update(financeTransactions).set({...b,amount:b.amount===undefined?undefined:b.amount.toFixed(2),description:b.description===undefined?undefined:(b.description||null)}).where(and(eq(financeTransactions.id,c.req.param("id")),eq(financeTransactions.userId,c.get("user").id))).returning();
 return row?c.json(row):c.json({error:{code:"NOT_FOUND",message:"Lançamento não encontrado."}},404);
});
coreRoutes.delete("/finance/:id",async c=>{
 const [row]=await db.delete(financeTransactions).where(and(eq(financeTransactions.id,c.req.param("id")),eq(financeTransactions.userId,c.get("user").id))).returning({id:financeTransactions.id});
 return row?c.json({ok:true}):c.json({error:{code:"NOT_FOUND",message:"Lançamento não encontrado."}},404);
});

coreRoutes.get("/admin/users",adminOnly,async c=>c.json(await db.select({id:users.id,name:users.name,email:users.email,role:users.role,active:users.active,createdAt:users.createdAt}).from(users).orderBy(desc(users.createdAt))));
coreRoutes.patch("/admin/users/:id",adminOnly,async c=>{
 const b=await c.req.json();if(!b||typeof b!=="object"||Array.isArray(b))return c.json({error:{code:"INVALID_BODY",message:"Dados inválidos."}},400);
 if(b.active!==undefined && typeof b.active!=="boolean") return c.json({error:{code:"INVALID_ACTIVE",message:"Estado inválido."}},400);
 if(b.name!==undefined && (typeof b.name!=="string" || b.name.trim().length<2 || b.name.trim().length>60)) return c.json({error:{code:"INVALID_NAME",message:"Nome deve ter entre 2 e 60 caracteres."}},400);
 const patch:any={}; if(b.active!==undefined) patch.active=b.active; if(b.name!==undefined) patch.name=b.name.trim();
 if(!Object.keys(patch).length) return c.json({error:{code:"EMPTY_UPDATE",message:"Nenhuma alteração informada."}},400);
 const [r]=await db.update(users).set(patch).where(eq(users.id,c.req.param("id"))).returning({id:users.id,name:users.name,email:users.email,role:users.role,active:users.active});
 return r?c.json(r):c.json({error:{code:"NOT_FOUND",message:"Usuário não encontrado."}},404);
});
coreRoutes.get("/admin/metrics",adminOnly,async c=>{
 const [u]=await db.select({count:sql<number>`count(*)`}).from(users);
 const [h]=await db.select({count:sql<number>`count(*)`}).from(habits);
 const [s]=await db.select({total:sql<number>`coalesce(sum(case when type='deposit' then amount::numeric else -amount::numeric end),0)`}).from(savingsEntries);
 return c.json({users:Number(u.count),habits:Number(h.count),netSavings:Number(s.total)});
});
coreRoutes.get("/admin/quotes",adminOnly,async c=>c.json(await db.select().from(quotes).orderBy(desc(quotes.createdAt))));
coreRoutes.post("/admin/quotes",adminOnly,async c=>{const b=quoteSchema.parse(await c.req.json());const [r]=await db.insert(quotes).values(b).returning();return c.json(r,201);});
coreRoutes.patch("/admin/quotes/:id",adminOnly,async c=>{const b=quoteSchema.partial().parse(await c.req.json());if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);const [r]=await db.update(quotes).set(b).where(eq(quotes.id,c.req.param("id"))).returning();return r?c.json(r):c.json({error:{code:"NOT_FOUND",message:"Frase não encontrada."}},404);});
coreRoutes.delete("/admin/quotes/:id",adminOnly,async c=>{await db.delete(quotes).where(eq(quotes.id,c.req.param("id")));return c.json({ok:true});});

coreRoutes.get("/mind/entries",async c=>c.json(await db.select().from(mindEntries).where(eq(mindEntries.userId,c.get("user").id)).orderBy(desc(mindEntries.createdAt)).limit(100)));
coreRoutes.post("/mind/entries",async c=>{const b=mindEntrySchema.parse(await c.req.json());const [r]=await db.insert(mindEntries).values({...b,userId:c.get("user").id}).returning();return c.json(r,201);});
coreRoutes.patch("/mind/entries/:id",async c=>{const b=mindEntrySchema.partial().parse(await c.req.json());if(!Object.keys(b).length)return c.json({error:{code:"EMPTY_UPDATE",message:"Informe ao menos um campo."}},400);const [r]=await db.update(mindEntries).set(b).where(and(eq(mindEntries.id,c.req.param("id")),eq(mindEntries.userId,c.get("user").id))).returning();return r?c.json(r):c.json({error:{code:"NOT_FOUND",message:"Registro não encontrado."}},404);});
coreRoutes.delete("/mind/entries/:id",async c=>{await db.delete(mindEntries).where(and(eq(mindEntries.id,c.req.param("id")),eq(mindEntries.userId,c.get("user").id)));return c.json({ok:true});});
