import { Hono } from "hono";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { db } from "../db/client.js";
import { bodyPhotos, bodyAnalyses, users } from "../db/schema.js";
import { auth } from "../middleware/auth.js";

export const bodyRoutes = new Hono();
bodyRoutes.use("*",auth);
const storageDir=resolve(process.env.PRIVATE_UPLOAD_DIR??".private-uploads");
const configuredMax=Number(process.env.UPLOAD_MAX_MB??8);const maxBytes=(Number.isFinite(configuredMax)?Math.max(1,Math.min(20,configuredMax)):8)*1024*1024;
const analysisAttempts=new Map<string,number[]>();
function sniffImage(bytes:Buffer):"image/jpeg"|"image/png"|"image/webp"|null {
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return "image/jpeg";
 if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "image/png";
 if(bytes.length>=12&&bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP")return "image/webp";
 return null;
}
bodyRoutes.get("/photos",async c=>c.json(await db.select({id:bodyPhotos.id,view:bodyPhotos.view,takenAt:bodyPhotos.takenAt,mimeType:bodyPhotos.mimeType,fileSize:bodyPhotos.fileSize}).from(bodyPhotos).where(eq(bodyPhotos.userId,c.get("user").id)).orderBy(desc(bodyPhotos.takenAt))));
bodyRoutes.post("/photos",async c=>{
 const contentLength=Number(c.req.header("content-length")??0);if(contentLength>maxBytes+128*1024)return c.json({error:{code:"FILE_TOO_LARGE",message:"O envio excede o limite permitido."}},413);
 const form=await c.req.formData(), file=form.get("photo"), view=String(form.get("view")??"front");
 if(!(file instanceof File))return c.json({error:{code:"INVALID_FILE",message:"Envie uma foto."}},400);
 if(!["front","side","back"].includes(view))return c.json({error:{code:"INVALID_VIEW",message:"Vista inválida."}},400);
 if(file.size<16||file.size>maxBytes)return c.json({error:{code:"INVALID_FILE",message:`A imagem deve ter até ${Math.floor(maxBytes/1024/1024)} MB.`}},400);
 const bytes=Buffer.from(await file.arrayBuffer()),mime=sniffImage(bytes);
 if(!mime||mime!==file.type)return c.json({error:{code:"INVALID_FILE",message:"O conteúdo precisa ser uma imagem JPG, PNG ou WebP válida."}},400);
 await mkdir(storageDir,{recursive:true,mode:0o700});await chmod(storageDir,0o700);
 const key=`${c.get("user").id}/${randomUUID()}`;
 await mkdir(join(storageDir,c.get("user").id),{recursive:true,mode:0o700});await chmod(join(storageDir,c.get("user").id),0o700);
 await writeFile(join(storageDir,key),bytes,{mode:0o600,flag:"wx"});
 try {
  const [row]=await db.insert(bodyPhotos).values({userId:c.get("user").id,view,storageKey:key,mimeType:mime,fileSize:bytes.length}).returning({id:bodyPhotos.id,view:bodyPhotos.view,takenAt:bodyPhotos.takenAt});
  return c.json(row,201);
 } catch(err) { await unlink(join(storageDir,key)).catch(()=>{}); throw err; }
});
bodyRoutes.get("/photos/:id/file",async c=>{
 const [photo]=await db.select().from(bodyPhotos).where(and(eq(bodyPhotos.id,c.req.param("id")),eq(bodyPhotos.userId,c.get("user").id))).limit(1);
 if(!photo)return c.json({error:{code:"NOT_FOUND",message:"Foto não encontrada."}},404);
 try { const bytes=await readFile(join(storageDir,photo.storageKey)); return new Response(bytes,{headers:{"Content-Type":photo.mimeType,"Content-Length":String(bytes.length),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Disposition":"inline"}}); }
 catch { return c.json({error:{code:"FILE_UNAVAILABLE",message:"Arquivo privado indisponível neste servidor."}},404); }
});
bodyRoutes.delete("/photos/:id",async c=>{
 const [photo]=await db.select().from(bodyPhotos).where(and(eq(bodyPhotos.id,c.req.param("id")),eq(bodyPhotos.userId,c.get("user").id))).limit(1);
 if(!photo)return c.json({error:{code:"NOT_FOUND",message:"Foto não encontrada."}},404);
 // A photo deletion also removes AI summaries derived from it, so deleted images
 // are not indirectly retained through their analysis history.
 await db.delete(bodyAnalyses).where(and(
  eq(bodyAnalyses.userId,c.get("user").id),
  sql`${bodyAnalyses.photoIds} @> ${JSON.stringify([photo.id])}::jsonb`
 ));
 await db.delete(bodyPhotos).where(eq(bodyPhotos.id,photo.id));
 await unlink(join(storageDir,photo.storageKey)).catch(()=>{});
 return c.json({ok:true});
});
bodyRoutes.get("/analyses",async c=>c.json(await db.select({id:bodyAnalyses.id,photoIds:bodyAnalyses.photoIds,summary:bodyAnalyses.summary,disclaimer:bodyAnalyses.disclaimer,consentAt:bodyAnalyses.consentAt,createdAt:bodyAnalyses.createdAt}).from(bodyAnalyses).where(eq(bodyAnalyses.userId,c.get("user").id)).orderBy(desc(bodyAnalyses.createdAt))));
bodyRoutes.post("/analyze",async c=>{
 const body=(await c.req.json().catch(()=>({})))??{};
 const {photoIds,consent}=body;
 if(consent!==true)return c.json({error:{code:"CONSENT_REQUIRED",message:"Confirme que autoriza o envio temporário das fotos ao provedor de IA antes de continuar."}},400);
 if(!Array.isArray(photoIds)||photoIds.length<2||photoIds.length>6||photoIds.some((id:any)=>typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))return c.json({error:{code:"INVALID_PHOTOS",message:"Selecione de 2 a 6 fotos suas para comparar."}},400);
 if(!process.env.OPENAI_API_KEY)return c.json({error:{code:"AI_NOT_CONFIGURED",message:"Análise por IA indisponível: configure OPENAI_API_KEY. As fotos permanecem no armazenamento privado."}},503);
 const uid=c.get("user").id,now=Date.now(),recent=(analysisAttempts.get(uid)??[]).filter(t=>now-t<60*60*1000);if(recent.length>=5)return c.json({error:{code:"AI_RATE_LIMITED",message:"Limite de 5 análises por hora atingido."}},429);
 const photos=await db.select().from(bodyPhotos).where(and(eq(bodyPhotos.userId,uid),inArray(bodyPhotos.id,photoIds))).orderBy(asc(bodyPhotos.takenAt));
 if(photos.length!==photoIds.length)return c.json({error:{code:"PHOTO_ACCESS_DENIED",message:"Uma ou mais fotos não pertencem à sua conta."}},403);
 if(photos.reduce((total,p)=>total+p.fileSize,0)>24*1024*1024)return c.json({error:{code:"ANALYSIS_TOO_LARGE",message:"Selecione fotos que somem no máximo 24 MB."}},413);
 const content:any[]=[{type:"text",text:"Compare estas fotos em ordem cronológica, observando somente mudanças visíveis de postura, enquadramento e aparência geral. Não estime percentual de gordura, peso, medidas, idade ou condição médica. Não faça diagnóstico, não prescreva dieta ou treino. Seja respeitoso, objetivo e reconheça limitações de iluminação, pose e distância. Responda em português do Brasil, em até 180 palavras, como observações não médicas. Não identifique a pessoa."}];
 try {
  for(const photo of photos){
   const bytes=await readFile(join(storageDir,photo.storageKey));
   content.push({type:"image_url",image_url:{url:`data:${photo.mimeType};base64,${bytes.toString("base64")}`}});
  }
  analysisAttempts.set(uid,[...recent,now]);
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL??"gpt-4.1-mini",messages:[{role:"user",content}],max_tokens:350,temperature:0.3})});
  if(!response.ok)throw new Error(`AI provider returned ${response.status}`);
  const result:any=await response.json(),summary=result.choices?.[0]?.message?.content;
  if(typeof summary!=="string"||!summary.trim())throw new Error("Empty AI response");
  const disclaimer="Análise visual automatizada e não médica. Fotos podem variar por iluminação, pose e enquadramento. Não substitui avaliação profissional.";
  const [saved]=await db.insert(bodyAnalyses).values({userId:c.get("user").id,photoIds,summary:summary.trim(),disclaimer,consentAt:new Date()}).returning({id:bodyAnalyses.id,summary:bodyAnalyses.summary,disclaimer:bodyAnalyses.disclaimer,createdAt:bodyAnalyses.createdAt});
  return c.json(saved,201);
 } catch(err) {
  console.error("BODY_ANALYSIS_FAILED");
  return c.json({error:{code:"AI_PROVIDER_ERROR",message:"Não foi possível concluir a análise. Suas fotos continuam privadas."}},502);
 }
});
bodyRoutes.get("/profile",async c=>{const [u]=await db.select({heightCm:users.heightCm,weightKg:users.weightKg}).from(users).where(eq(users.id,c.get("user").id)).limit(1);return c.json(u??{heightCm:null,weightKg:null});});
bodyRoutes.patch("/profile",async c=>{
 const b=await c.req.json();if(!b||typeof b!=="object"||Array.isArray(b))return c.json({error:{code:"INVALID_PROFILE",message:"Dados de perfil inválidos."}},400);const heightCm=b.heightCm, weightKg=b.weightKg;
 if(!("heightCm" in b)&&!("weightKg" in b))return c.json({error:{code:"EMPTY_UPDATE",message:"Informe altura ou peso para atualizar."}},400);
 if("heightCm" in b&&heightCm!==null&&(!Number.isInteger(heightCm)||heightCm<80||heightCm>250))return c.json({error:{code:"INVALID_HEIGHT",message:"Altura deve estar entre 80 e 250 cm."}},400);
 if("weightKg" in b&&weightKg!==null&&(typeof weightKg!=="number"||weightKg<20||weightKg>400))return c.json({error:{code:"INVALID_WEIGHT",message:"Peso deve estar entre 20 e 400 kg."}},400);
 const update:any={};if("heightCm" in b)update.heightCm=heightCm;if("weightKg" in b)update.weightKg=weightKg===null?null:String(weightKg);
 const [u]=await db.update(users).set(update).where(eq(users.id,c.get("user").id)).returning({id:users.id,heightCm:users.heightCm,weightKg:users.weightKg});
 return c.json(u);
});
