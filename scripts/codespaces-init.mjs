import { randomBytes } from "node:crypto";
import { mkdir, access, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root=process.cwd();
const codespace=process.env.CODESPACE_NAME;
const domain=process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const host=(port)=>codespace&&domain
  ? `https://${codespace}-${port}.${domain}`
  : `http://localhost:${port}`;
const apiUrl=`${host(8787)}/v1`;
const adminOrigin=host(3000);

async function writeIfMissing(relativePath,content){
 const file=resolve(root,relativePath);
 await mkdir(dirname(file),{recursive:true});
 try{await access(file);console.log(`Mantido arquivo existente: ${relativePath}`);return false;}
 catch{}
 await writeFile(file,content,{encoding:"utf8",flag:"wx",mode:0o600});
 console.log(`Criado: ${relativePath}`);
 return true;
}

const admins=process.env.FORGE_ADMIN_EMAILS??"admin1@example.com,admin2@example.com";
const apiEnv=[
 "DATABASE_URL=postgres://forge:forge_local_only@db:5432/forge",
 `JWT_ACCESS_SECRET=${randomBytes(48).toString("base64url")}`,
 `JWT_REFRESH_SECRET=${randomBytes(48).toString("base64url")}`,
 `ADMIN_EMAILS=${admins}`,
 `CORS_ORIGINS=${adminOrigin},http://localhost:3000`,
 "APP_TIME_ZONE=America/Sao_Paulo",
 "DB_POOL_MAX=10",
 "PORT=8787",
 "UPLOAD_MAX_MB=8",
 "PRIVATE_UPLOAD_DIR=.private-uploads",
 "OPENAI_MODEL=gpt-4.1-mini",
 "OPENAI_API_KEY="
].join("\n")+"\n";

await writeIfMissing("apps/api/.env",apiEnv);
await writeIfMissing("apps/admin/.env.local",`NEXT_PUBLIC_API_URL=${apiUrl}\n`);
await writeIfMissing("apps/mobile/.env",`EXPO_PUBLIC_API_URL=${apiUrl}\n`);

console.log("\nConfiguração local do Forge preparada.");
console.log(`API para o celular: ${apiUrl}`);
console.log(`Painel web: ${adminOrigin}`);
console.log("ATENÇÃO: apps/api/.env usa e-mails de exemplo por padrão. Substitua ADMIN_EMAILS pelos dois e-mails corretos antes de criar as contas.");
console.log("Para conectar o Android, torne as portas 8787 e 8081 públicas apenas durante o teste; depois volte para Private. Use somente dados fictícios.");
if(!codespace||!domain)console.log("Codespaces não detectado: ajuste EXPO_PUBLIC_API_URL e NEXT_PUBLIC_API_URL manualmente para o endereço real da API.");
