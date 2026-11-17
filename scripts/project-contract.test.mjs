import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
test('workspace declares the required product stack',async()=>{
 const root=JSON.parse(await read('package.json'));
 const mobile=JSON.parse(await read('apps/mobile/package.json'));
 const api=JSON.parse(await read('apps/api/package.json'));
 const admin=JSON.parse(await read('apps/admin/package.json'));
 assert.match(root.packageManager,/^pnpm@9/);assert.match(mobile.dependencies.expo,/^~51/);assert.ok(mobile.dependencies['expo-router']);assert.ok(mobile.dependencies['react-native-reanimated']);assert.ok(api.dependencies.hono);assert.ok(api.devDependencies.esbuild);assert.match(admin.dependencies.next,/^14\./);
});
test('schema and baseline migration contain all required data domains',async()=>{
 const schema=await read('apps/api/src/db/schema.ts'),sql=await read('apps/api/drizzle/0000_forge_baseline.sql');
 for(const name of ['users','habits','habit_logs','savings_entries','goals','points_ledger','quotes','body_photos','body_analyses','alarms','refresh_tokens','mind_entries']){assert.ok(schema.includes(`pgTable("${name}"`),`schema missing ${name}`);assert.ok(sql.includes(`TABLE IF NOT EXISTS ${name}`),`migration missing ${name}`)}
});
test('admin authorization is recalculated from server-side allowlist and active state',async()=>{
 const auth=await read('apps/api/src/middleware/auth.ts');
 assert.ok(auth.includes('isAdminEmail(account.email)'));assert.ok(auth.includes('!account.active'));assert.ok(auth.includes('users.id'));
});
test('body images are private, owner-scoped and AI consent-gated',async()=>{
 const body=await read('apps/api/src/routes/body.ts');
 assert.ok(body.includes('sniffImage'));assert.ok(body.includes('eq(bodyPhotos.userId,c.get("user").id)'));assert.ok(body.includes('Cache-Control":"private, no-store'));assert.ok(body.includes('consent!==true'));assert.ok(body.includes('OPENAI_API_KEY'));
});
test('financial changes are serialized and points use net savings',async()=>{
 const core=await read('apps/api/src/routes/core.ts'),shared=await read('packages/shared/src/index.ts');
 assert.ok(core.includes('pg_advisory_xact_lock'));assert.ok(core.includes('calculateSavingsPoints(balance)'));assert.ok(shared.includes('Math.floor(netBalance+0.000001)'));
});
test('daily habit check uses conflict protection and explicit uncheck',async()=>{
 const core=await read('apps/api/src/routes/core.ts');
 assert.ok(core.includes('onConflictDoNothing()'));assert.ok(core.includes('coreRoutes.delete("/habits/:id/check"'));
});
test('alarm exceptions are attached to a base and scheduled locally',async()=>{
 const core=await read('apps/api/src/routes/core.ts'),mobile=await read('apps/mobile/app/alarms.tsx');
 assert.ok(core.includes('INVALID_OVERRIDE'));assert.ok(mobile.includes('parentAlarmId'));assert.ok(mobile.includes('scheduleNotificationAsync'));
});

test('Codespaces ports stay private and setup targets the tested branch',async()=>{
 const config=JSON.parse(await read('.devcontainer/devcontainer.json'));
 for(const port of ['3000','8787','8081']) assert.equal(config.portsAttributes[port].visibility,'private',`port ${port} must be private by default`);
 const readme=await read('README.md');
 assert.ok(readme.includes('forge/qa-foundation-2026-11-17'));
 assert.ok(readme.includes('Não escolha `main` ainda'));
 const init=await read('scripts/codespaces-init.mjs');
 assert.ok(init.includes('??""'));
 const apiEnv=await read('apps/api/.env.example');
 assert.match(apiEnv,/^ADMIN_EMAILS=$/m);
 const eas=JSON.parse(await read('apps/mobile/eas.json'));
 assert.equal(eas.build.preview.distribution,'internal');
 assert.equal(eas.build.preview.android.buildType,'apk');
 assert.equal(eas.build.development,undefined);
});
