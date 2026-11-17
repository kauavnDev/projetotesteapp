# Checklist de QA do Forge

## Validação automatizada concluída em 17/11/2026

- [x] pnpm install com lockfile versionado.
- [x] 7 testes Node de contrato passaram.
- [x] 11 verificações estáticas passaram.
- [x] Snapshot Drizzle gerado e drift check sem migração adicional.
- [x] Migração baseline aplicada em PostgreSQL 16 limpo.
- [x] 13 testes Vitest passaram, incluindo integração de unicidade diária.
- [x] TypeScript passou nos workspaces.
- [x] Build esbuild da API e build Next.js do painel passaram.
- [ ] Build nativo Expo/APK e teste em Android físico.

## Automação e ambiente

- [ ] Dev Container abre no GitHub Codespaces usando somente o navegador Android.
- [ ] PostgreSQL 16 do Codespaces fica saudável.
- [ ] pnpm install, build do pacote shared, static checks, typecheck e builds passam.
- [ ] pnpm db:migrate aplica a baseline em banco PostgreSQL limpo.
- [ ] Teste de integração confirma as tabelas e a unicidade de conclusão diária.
- [ ] pnpm-lock.yaml é versionado e a CI passa a usar instalação congelada.

## Android e sessão

- [ ] Confirmar qual Expo Go é compatível com SDK 51 ou gerar development build EAS.
- [ ] Cadastro, login, refresh token após 15 minutos, rotação e logout.
- [ ] Fechar/reabrir app e documentar comportamento da sessão em memória.
- [ ] Testar navegação, layout, teclado, telas pequenas e tema claro/escuro.

## Rotina

- [ ] CRUD de hábitos, frequência/dias, horário, cor e streak.
- [ ] Check repetido é idempotente; desmarcação remove o registro e os pontos.
- [ ] Frequência personalizada exige pelo menos um dia.
- [ ] Fuso horário e mudança de data perto da meia-noite.

## Alarmes e notificações

- [ ] Permissões Android, canal de notificação e lembrete com app fechado.
- [ ] Recorrência diária/semanal e exceção de data substitui o horário base, inclusive quando move o lembrete para um dia fora da recorrência.
- [ ] Exceção desativada suprime somente a ocorrência daquela data; alarme base desativado não agenda notificações.
- [ ] Desativar/editar/excluir alarmes reprograma notificações.
- [ ] Reabrir app após vários dias e renovar janela de 30 dias.
- [ ] Confirmar limitações do Android para alarmes exatos e economia de bateria.

## Dinheiro e metas

- [ ] Depósitos e retiradas com centavos, motivo detalhado obrigatório e saldo não negativo.
- [ ] Editar/excluir lançamentos recalcula saldo e pontos.
- [ ] Operações concorrentes não geram saldo negativo.
- [ ] R$ 1 líquido = 1 ponto; saldo de metas e ranking consistentes.
- [ ] CRUD de metas e prazo.

## Corpo e privacidade

- [ ] Perfil altura/peso valida limites.
- [ ] Upload JPG/PNG/WebP, arquivo disfarçado/corrompido e tamanho excedido.
- [ ] Foto de outro usuário retorna 404/403; diretório fica fora do webroot.
- [ ] Diretórios 0700, arquivos 0600, acesso autenticado e cache privado.
- [ ] Timeline, seleção, comparação antes/depois e exclusão.
- [ ] Análise sem consentimento falha; sem chave retorna 503; com chave e consentimento valida provedor.
- [ ] Confirmar que a análise não estima medidas, percentual de gordura nem diagnóstico.
- [ ] Política de retenção/exclusão de análises ligadas a fotos removidas.

## Mente e painel web

- [ ] CRUD do diário e isolamento entre usuários.
- [ ] Login web, refresh token e logout.
- [ ] Painel usuário em celular/desktop.
- [ ] Edição/exclusão web de hábitos, finanças, poupança, metas e diário.\n- [ ] Rotação diária das frases motivacionais e CRUD administrativo.
- [ ] Timeline de fotos e alarmes na interface web.
- [ ] Admin: allowlist de exatamente dois e-mails, CRUD de frases, usuários e métricas.
- [ ] Usuário comum recebe 403 em todas as rotas admin; contas desativadas perdem acesso.

## Deploy — bloqueado sem autorização

- [ ] Banco gerenciado, secrets, CORS e rate limit compartilhado.
- [ ] Bucket/volume privado persistente e backup/restauração.
- [ ] Limites de upload no proxy, retenção e exclusão de dados.
- [ ] Teste Android/iOS físico e build EAS.
- [ ] Nenhum deploy de produção ou gasto sem autorização explícita.
