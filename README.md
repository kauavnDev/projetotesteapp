# Forge o seu amanhã

Aplicativo pessoal em português do Brasil para acompanhar **Rotina, Dinheiro, Corpo e Mente**, com ranking compartilhado entre pessoas convidadas.

## Stack

- Monorepo pnpm + Turborepo.
- apps/mobile: Expo SDK 51, Expo Router, Reanimated 3, Zustand, câmera e notificações locais.
- apps/api: Hono em Node ESM, esbuild, Drizzle ORM e PostgreSQL.
- apps/admin: Next.js 14 + Tailwind, painel web de usuário e administração condicional.
- packages/shared: schemas Zod e regras compartilhadas.
- Autenticação bcryptjs + jose: access token de 15 minutos e refresh token de 30 dias, com hash/rotação no banco.

## Testar usando somente Android

O repositório inclui um Dev Container para abrir o projeto no GitHub Codespaces, sem instalar Node ou PostgreSQL no celular.

1. Abra [o repositório Forge](https://github.com/kauavnDev/projetotesteapp) no Chrome.
2. No botão **Code**, abra **Codespaces** e crie um Codespace na branch main.
3. Aguarde a preparação do Dev Container. Ele instala pnpm/dependências e inicia um PostgreSQL 16 local no Codespace.
4. O script scripts/codespaces-init.mjs cria arquivos locais ignorados pelo Git e configura a URL encaminhada da API para o Android.
5. Abra a aba **Ports** do Codespaces e confira:
   - 8787 — API, privada por padrão. Mude para **Public** somente durante o teste no Android.
   - 8081 — Expo Metro, privada por padrão. Mude para **Public** enquanto o Expo Go precisar conectar.
   - 3000 — painel web, privada.
6. **Antes de criar contas**, edite apps/api/.env e substitua ADMIN_EMAILS pelos dois e-mails que terão acesso administrativo. O script usa e-mails de exemplo quando nenhum valor é fornecido.
7. No terminal do Codespace, aplique a migração e inicie os serviços em terminais separados:

~~~bash
pnpm db:migrate
~~~

Terminal 1 — API:

~~~bash
pnpm --filter @forge/api dev
~~~

Terminal 2 — painel web:

~~~bash
pnpm --filter @forge/admin dev
~~~

Terminal 3 — aplicativo Expo:

~~~bash
pnpm --filter @forge/mobile dev
~~~

Se o QR code não conectar ao celular, tente iniciar o Expo com pnpm --filter @forge/mobile dev -- --tunnel. O túnel pode exigir que o Expo instale o pacote auxiliar. Abra o painel web pela porta 3000 e use o Expo Go no Android para abrir o projeto.

**Compatibilidade Expo Go:** o projeto usa SDK 51. O Expo Go atual pode não aceitar essa versão antiga. Consulte [expo.dev/go](https://expo.dev/go) e selecione uma versão compatível com SDK 51, se ainda estiver disponível. Se não estiver, será necessário gerar um development/preview build com EAS; isso exige uma conta Expo e ainda não foi configurado nem testado neste projeto. Não atualize o SDK às pressas: a migração de versão precisa ser feita e validada separadamente.

**Segurança do Codespaces:** as portas 8787 e 8081 começam privadas. Torne-as públicas somente durante a conexão do Android/Expo Go e volte para Private ao terminar. Use apenas dados fictícios, fotos de teste e um Codespace temporário; não coloque fotos pessoais ou credenciais reais nesse ambiente.

## Requisitos para desenvolvimento local

- Node.js 20 ou 22.
- pnpm 9.12.3 via Corepack.
- PostgreSQL 15+ ou Neon.
- Android físico/emulador para testar câmera e notificações.

Copie os modelos de ambiente para os arquivos locais correspondentes:

~~~bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
~~~

Ajuste DATABASE_URL, os dois segredos JWT, ADMIN_EMAILS, CORS_ORIGINS, NEXT_PUBLIC_API_URL e EXPO_PUBLIC_API_URL. Em aparelho Android físico, localhost não aponta para o computador; use o endereço público encaminhado do Codespaces ou o IP LAN do computador. Os arquivos reais .env são ignorados pelo Git.

O arquivo pnpm-lock.yaml está versionado. Instale de forma reproduzível:

~~~bash
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install --frozen-lockfile
~~~

## Desenvolvimento

~~~bash
pnpm --filter @forge/shared build
pnpm db:migrate
pnpm dev
~~~

- API: http://localhost:8787/health
- Painel web: http://localhost:3000
- Expo: pnpm --filter @forge/mobile dev

A API carrega apps/api/.env quando iniciada pelo script do workspace. O Next.js carrega apps/admin/.env.local; Expo carrega apps/mobile/.env.

## Banco e migrações

A migração baseline ativa está em apps/api/drizzle/0000_forge_baseline.sql, registrada em apps/api/drizzle/meta/_journal.json. O Dev Container e a CI aplicam essa migração em PostgreSQL limpo.

~~~bash
pnpm db:migrate
~~~

O snapshot inicial do Drizzle está versionado em apps/api/drizzle/meta/0000_snapshot.json. A CI executa drizzle-kit generate para detectar drift e falha se uma alteração de schema gerar uma migração não revisada. Para novas mudanças, use pnpm db:generate, revise o SQL, o snapshot e o journal e versione todos juntos. Em banco existente, faça backup e confira __drizzle_migrations antes de aplicar; não rode o SQL manualmente e depois pelo Drizzle.

## Funcionalidades presentes no código

- Cadastro/login, hash bcrypt, access token de 15 minutos, refresh token de 30 dias com hash, rotação e revogação.
- Autorização recalculada no servidor a partir de ADMIN_EMAILS; contas desativadas são bloqueadas.
- Hábitos com frequência, dias, horário, cor, conclusão diária idempotente e sequência calculada.
- Poupança com depósitos, retiradas com motivo detalhado, edição/exclusão, saldo e pontos (R$ 1 líquido = 1 ponto); alterações financeiras usam lock transacional por usuário.
- Metas com valor-alvo, prazo e progresso baseado no saldo poupado.
- Ranking, ledger de pontos e frase do dia.
- Diário privado da mente com humor e reflexões editáveis.
- Alarmes locais recorrentes e exceções por data; o app agenda os próximos 30 dias no dispositivo quando a tela de alarmes é aberta.
- Perfil corporal com altura/peso, fotos privadas JPG/PNG/WebP, timeline/antes-depois no mobile e exclusão por proprietário.
- Análise visual por IA apenas com consent: true, fotos do próprio usuário e OPENAI_API_KEY configurada. A resposta é não médica e não deve estimar medidas, gordura ou diagnóstico.
- Administração de usuários, frases (texto, cor, autor, animação) e métricas, protegida por allowlist no servidor.

## Limitações conhecidas — não considerar como testadas

- A tela web concentra o acesso em uma página e ainda não oferece toda a edição/exclusão disponível no mobile; a timeline corporal e o agendamento de alarmes ainda precisam de uma experiência web completa.
- Notificações são locais no dispositivo; não há serviço de push remoto configurado.
- Fotos ficam em disco privado local por padrão. Isso serve para desenvolvimento/teste em um único servidor persistente, não para produção serverless. Produção exige bucket privado/volume persistente, backup, retenção e políticas de acesso.
- Análise por IA retorna 503 AI_NOT_CONFIGURED sem OPENAI_API_KEY. Não há chave incluída nem análise validada aqui.
- Expo Go pode não suportar mais SDK 51; um APK próprio depende de build EAS e conta Expo.
- O rate limit de login é em memória por instância. Produção com múltiplas instâncias precisa de Redis/KV compartilhado e proxy confiável.
- Ainda é necessário QA manual em Android real, permissões de câmera/notificações, rotação de sessão, isolamento de contas, CORS, upload e painel web.

## Testes

~~~bash
node --test scripts/*.test.mjs
pnpm verify:static
pnpm test
pnpm lint
pnpm build
pnpm db:migrate
~~~

Na execução de 17/11/2026, a CI passou: 7 testes Node de contrato, 11 verificações estáticas, 13 testes Vitest (incluindo integração real com PostgreSQL 16), migração baseline, typecheck de todos os workspaces e builds da API e do painel Next.js. O build nativo Expo/APK não faz parte dessa validação. Isso não substitui testes no Android físico nem valida provedor de IA ou armazenamento de produção.

## Segurança e deploy

Variáveis relevantes:

- DATABASE_URL, DB_POOL_MAX
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (mínimo de 32 caracteres, diferentes entre si)
- ADMIN_EMAILS (somente os dois e-mails autorizados)
- CORS_ORIGINS (origens exatas, separadas por vírgula)
- APP_TIME_ZONE, UPLOAD_MAX_MB, PRIVATE_UPLOAD_DIR
- OPENAI_API_KEY, OPENAI_MODEL (opcionais)
- NEXT_PUBLIC_API_URL, EXPO_PUBLIC_API_URL

Nunca versione .env, tokens, fotos ou credenciais. O rate limit atual usa memória local e só confia em cabeçalhos de IP quando o proxy os sobrescreve de forma confiável. Configure também limites de requisição no proxy reverso.

**Nenhum deploy de produção, compra de serviço ou gasto é realizado por este projeto sem autorização explícita.** Antes de publicar, configure banco, armazenamento privado persistente, secrets, rate limit compartilhado, backup/restauração, CORS e build Android/iOS; revise QA_CHECKLIST.md.
