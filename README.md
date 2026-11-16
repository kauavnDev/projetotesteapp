# Forge o seu amanhã

Aplicativo pessoal em português do Brasil para acompanhar **Rotina, Dinheiro, Corpo e Mente**, com ranking compartilhado entre usuários convidados.

## Estrutura

- `apps/mobile`: Expo SDK 51, Expo Router, Reanimated 3, Zustand, câmera e notificações locais.
- `apps/api`: Hono em Node ESM, build esbuild, Drizzle ORM, PostgreSQL, autenticação bcryptjs/JWT e endpoints privados.
- `apps/admin`: Next.js 14 + Tailwind; painel web de usuário e área administrativa condicional.
- `packages/shared`: schemas Zod e tipos compartilhados.
- `apps/api/drizzle`: migração SQL inicial versionada.

## Requisitos e instalação

- Node.js 20 ou 22; pnpm 9.12.3 (via Corepack ou instalação oficial).
- PostgreSQL 15+ ou Neon.
- Configure as variáveis de ambiente a partir do modelo:

```bash
cp .env.example .env
# preencha DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET e ADMIN_EMAILS
pnpm install
```

Gere segredos fortes, por exemplo `openssl rand -base64 48`. `ADMIN_EMAILS` deve conter **somente os dois e-mails** autorizados, separados por vírgula. Não compartilhe nem versione `.env`.

## Desenvolvimento

```bash
pnpm --filter @forge/shared build
pnpm db:migrate
pnpm dev
```

- API: `http://localhost:8787/health`
- Painel web: `http://localhost:3000`
- Expo: `pnpm --filter @forge/mobile dev`

No mobile, o tema claro/escuro acompanha parcialmente o tema do sistema; o painel web tem alternância própria. A adaptação visual completa do tema em todas as telas móveis ainda precisa de QA e refinamento.

O aplicativo web aceita login de usuários e administradores. Cadastro de conta pode ser feito pelo aplicativo móvel via `POST /v1/auth/register`.

## Banco e migrações

A migração inicial está em `apps/api/drizzle/0000_forge_baseline.sql`. Para banco vazio:

```bash
pnpm db:migrate
```

A pasta contém o SQL baseline e o journal necessários para aplicar a migração inicial pelo Drizzle. O comando `db:generate` está declarado, mas **não foi validado neste ambiente e o snapshot inicial do Drizzle ainda não foi gerado**. Não o use para gerar mudanças até instalar as dependências e criar/validar esse snapshot; caso contrário, o gerador pode interpretar o schema atual como uma primeira migração completa. Por enquanto, novas alterações devem ser preparadas como migrações SQL versionadas e registradas no journal, ou aguardar a geração do snapshot inicial.

Não rode a migração inicial manualmente e depois novamente pelo Drizzle. Em bancos existentes, faça backup e valide o estado da tabela `__drizzle_migrations` antes de aplicar.

## Funcionalidades implementadas no código

- Cadastro/login, hash bcrypt, access token de 15 minutos, refresh token de 30 dias com hash no banco e rotação/revogação.
- Autorização recalculada no servidor a partir do e-mail e `ADMIN_EMAILS`; contas desativadas são bloqueadas.
- Hábitos com frequência, dias, horário, cor, conclusão diária e sequência calculada.
- Poupança com depósito, retirada (motivo de no mínimo 12 caracteres), edição/exclusão, saldo e pontos acumulados (R$ 1 líquido = 1 ponto). Operações financeiras são serializadas por lock transacional por usuário.
- Metas com valor-alvo, data limite e progresso baseado no saldo poupado.
- Ranking e ledger de pontos.
- Diário privado de mente com humor e reflexões editáveis.
- Alarmes locais recorrentes e exceções de data vinculadas a um alarme base. O app agenda os próximos 30 dias no dispositivo ao abrir a tela de alarmes.
- Frase do dia e CRUD administrativo de frases (texto, cor, autor e animação).
- Administração de usuários (nome/estado ativo), frases e métricas.
- Perfil corporal, upload de fotos JPG/PNG/WebP com validação do conteúdo/tamanho, visualização autenticada e exclusão por proprietário.
- Análise visual por IA somente quando `consent: true`, fotos pertencem ao usuário e `OPENAI_API_KEY` está configurada. A instrução proíbe estimar medidas, gordura ou fazer diagnóstico; o resultado é explicitamente não médico.

## Fotos privadas e análise por IA: configuração importante

Por padrão, os arquivos ficam em `PRIVATE_UPLOAD_DIR` (padrão `.private-uploads`), fora das pastas públicas, com diretórios `0700`, arquivos `0600`, nomes aleatórios e entrega apenas por rota autenticada do próprio usuário. O diretório é ignorado pelo Git.

**Esse armazenamento local é adequado para desenvolvimento e teste em um único servidor com disco persistente. Não é um bucket gerenciado, não oferece redundância e pode ser efêmero em plataformas serverless.** Para produção, configure `PRIVATE_UPLOAD_DIR` para um volume persistente privado ou implemente um bucket privado S3/R2/Supabase Storage com credenciais próprias, políticas de acesso privado, backup, retenção e URLs assinadas. Não exponha esse diretório como estático.

A análise envia as imagens escolhidas ao provedor configurado apenas após consentimento explícito a cada solicitação. Configure `OPENAI_API_KEY` e, opcionalmente, `OPENAI_MODEL`. Sem a chave, a rota retorna `503 AI_NOT_CONFIGURED`; isso não é uma análise testada. Não use a funcionalidade como avaliação médica.

## Segurança e configuração

Variáveis necessárias:

- `DATABASE_URL`
- `DB_POOL_MAX` (opcional; padrão 10)
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` (mínimo de 32 caracteres cada)
- `ADMIN_EMAILS` (exatamente os dois e-mails autorizados)
- `CORS_ORIGINS` (origens exatas permitidas, separadas por vírgula)
- `APP_TIME_ZONE` (padrão `America/Sao_Paulo`)
- `UPLOAD_MAX_MB`, `PRIVATE_UPLOAD_DIR`
- `OPENAI_API_KEY` e `OPENAI_MODEL` (opcionais para IA)
- `NEXT_PUBLIC_API_URL` e `EXPO_PUBLIC_API_URL`

O rate limit de login em memória protege uma instância. Em produção com múltiplas instâncias, substitua por Redis/KV compartilhado e configure `CF-Connecting-IP` ou `X-Real-IP` somente a partir de proxy confiável. A aplicação não confia em `X-Forwarded-For` arbitrário. Configure CORS com origens explícitas. Configure também o limite de tamanho de requisição no proxy reverso (upload até `UPLOAD_MAX_MB` + multipart overhead); a validação de tamanho do arquivo ocorre após o parse multipart.

## Testes e validação

```bash
node --test scripts/*.test.mjs
pnpm verify:static
pnpm test
pnpm lint
pnpm build
```

No ambiente desta retomada, **7 testes estáticos de contrato passaram**, **11 verificações estáticas passaram** e o parser do TypeScript transpôs 27 arquivos TS/TSX sem erros de sintaxe. Isso não substitui typecheck, build, Vitest, testes de API ou integração real. O arquivo `pnpm-lock.yaml` ainda não foi gerado porque o ambiente de desenvolvimento atual não tem acesso ao registry; `pnpm` não está instalado localmente e o Corepack não conseguiu baixá-lo (`EAI_AGAIN`). Execute `pnpm install` em ambiente com rede e versione o lockfile antes de CI. Ainda é necessário executar os comandos acima com dependências instaladas, configurar PostgreSQL/Neon e fazer QA integrado em Android/iOS e navegadores. Sem `DATABASE_URL`, chaves, serviço de armazenamento privado persistente e credenciais EAS, não há como declarar migração, upload em produção, análise por IA, notificações em aparelho físico ou deploy validados.

Consulte `QA_CHECKLIST.md` antes de qualquer publicação. Nenhum deploy é executado por este projeto.

## Deploy (quando autorizado)

1. Provisionar PostgreSQL/Neon e armazenamento privado persistente; configurar secrets no host da API.
2. Executar `pnpm db:migrate` no ambiente de destino antes de iniciar a API.
3. Construir API com `pnpm --filter @forge/api build` e iniciar com `pnpm --filter @forge/api start`.
4. Construir web com `pnpm --filter @forge/admin build`, configurando `NEXT_PUBLIC_API_URL`.
5. Configurar `EXPO_PUBLIC_API_URL` e credenciais EAS; validar permissões de câmera/notificações e build Android/iOS.
6. Validar CORS, allowlist admin, rotação de refresh token, rate limit compartilhado, backup e restauração do armazenamento privado.

Deploy e qualquer gasto exigem autorização explícita do proprietário.
