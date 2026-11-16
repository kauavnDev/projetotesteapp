import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { ZodError } from "zod";
import { authRoutes } from "./routes/auth.js";
import { coreRoutes } from "./routes/core.js";
import { bodyRoutes } from "./routes/body.js";
import { pool } from "./db/client.js";

const app = new Hono();
const allowed = (process.env.CORS_ORIGINS??"").split(",").map(x=>x.trim()).filter(Boolean);
app.use("*",cors({origin:(origin)=>origin && allowed.includes(origin)?origin:undefined,allowHeaders:["Content-Type","Authorization"],allowMethods:["GET","POST","PATCH","DELETE","OPTIONS"],credentials:true,maxAge:600}));
app.onError((err,c)=>{
  if(err instanceof SyntaxError) return c.json({error:{code:"INVALID_JSON",message:"O corpo da solicitação não contém JSON válido."}},400);
  if(err instanceof ZodError) return c.json({error:{code:"VALIDATION_ERROR",message:"Confira os campos informados.",details:err.flatten().fieldErrors}},400);
  console.error("API_ERROR",{name:err.name,message:process.env.NODE_ENV==="production"?"internal":err.message});
  return c.json({error:{code:"INTERNAL_ERROR",message:process.env.NODE_ENV==="production"?"Não foi possível concluir a operação.":err.message}},500);
});
app.notFound(c=>c.json({error:{code:"NOT_FOUND",message:"Rota não encontrada."}},404));
app.get("/health",async c=>{try{await pool.query("select 1");return c.json({ok:true,service:"forge-api",database:"connected"});}catch{return c.json({ok:false,service:"forge-api",database:"unavailable"},503);}});
app.route("/v1/auth",authRoutes);
app.route("/v1",coreRoutes);
app.route("/v1/body",bodyRoutes);
const port=Number(process.env.PORT??8787);
serve({fetch:app.fetch,port},info=>console.log(`Forge API listening on ${info.port}`));
