import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { Client } from "pg";

const databaseUrl=process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("PostgreSQL migration integration",()=>{
 let client:Client|null=null;
 beforeAll(async()=>{client=new Client({connectionString:databaseUrl!});await client.connect()});
 afterAll(async()=>{if(client)await client.end()});

 it("creates every table used by the current API",async()=>{
  const result=await client!.query<{table_name:string}>(`select table_name from information_schema.tables where table_schema='public'`);
  const names=result.rows.map(row=>row.table_name);
  expect(names).toEqual(expect.arrayContaining([
   "users","habits","habit_logs","savings_entries","goals","points_ledger",
   "quotes","body_photos","body_analyses","alarms","refresh_tokens","mind_entries"
  ]));
 });

 it("enforces one completion per user, habit and day",async()=>{
  const email=`forge-ci-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const [user]= (await client!.query<{id:string}>(
   "insert into users (name,email,password_hash) values ($1,$2,$3) returning id",
   ["Forge CI",email,"not-a-real-password-hash"]
  )).rows;
  try{
   const [habit]=(await client!.query<{id:string}>(
    "insert into habits (user_id,title,frequency,days,color) values ($1,$2,$3,$4,$5) returning id",
    [user.id,"Teste CI","daily",JSON.stringify([]),"#E11D48"]
   )).rows;
   const insert=()=>client!.query(
    "insert into habit_logs (habit_id,user_id,log_date) values ($1,$2,$3)",
    [habit.id,user.id,"2026-11-17"]
   );
   await insert();
   await expect(insert()).rejects.toMatchObject({code:"23505"});
  }finally{
   await client!.query("delete from users where id=$1",[user.id]);
  }
 });
});
