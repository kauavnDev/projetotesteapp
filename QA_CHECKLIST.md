# Checklist de QA antes de produção

## Ferramentas e build
- [ ] `pnpm install` com rede e lockfile gerado/commitado.
- [ ] `pnpm --filter @forge/shared build`, `pnpm lint`, `pnpm test` e `pnpm build` sem erros.
- [ ] Verificar build Expo SDK 51 em Android e iOS.

## Banco e autenticação
- [ ] Aplicar `pnpm db:migrate` em PostgreSQL limpo e confirmar todas as tabelas/índices.
- [ ] Cadastro, login, bcrypt, access 15 min, refresh 30 dias, rotação concorrente e logout.
- [ ] Testar allowlist com exatamente dois e-mails; usuário comum recebe 403 em todas as rotas admin.
- [ ] Desativar conta e confirmar bloqueio de access e refresh tokens.
- [ ] Testar rate limit atrás de proxy confiável e CORS com origem permitida/não permitida.

## Rotina, dinheiro e metas
- [ ] CRUD de hábitos, frequência/dias, check diário idempotente (POST repetido não alterna estado), desmarcação via DELETE e streak em timezone configurado.
- [ ] Testar depósitos de R$ 0,50 + R$ 0,50 = 1 ponto; retirada e exclusão/edit com saldo recalculado.
- [ ] Confirmar retiradas sem motivo detalhado (mínimo 12 caracteres) são rejeitadas.
- [ ] Confirmar operações concorrentes não produzem saldo negativo.
- [ ] CRUD de metas e progresso com poupança líquida.
- [ ] Diário da mente: CRUD e isolamento entre usuários.

## Alarmes e notificações
- [ ] Permissões Android/iOS, canal Android e notificações com app fechado.
- [ ] Confirmar recorrência diária/semanal e re-agendamento ao abrir a tela.
- [ ] Confirmar exceção de data substitui o horário base sem duplicar notificação.
- [ ] Testar fuso horário, horário de verão, app encerrado por vários dias e limite de 30 dias.

## Corpo e privacidade
- [ ] Upload JPG/PNG/WebP válido, arquivo disfarçado, arquivo corrompido e tamanho excedido.
- [ ] Acessar/deletar foto de outro usuário deve retornar 404/403.
- [ ] Verificar diretório fora do webroot, permissões 0700/0600, volume persistente e backup.
- [ ] Análise sem consentimento deve falhar; sem chave retorna 503; com chave e consentimento testa provedor.
- [ ] Confirmar a resposta não faz diagnóstico nem estima medidas/percentual de gordura.
- [ ] Testar exclusão de foto referenciada por análise e política de retenção.

## Admin e interfaces
- [ ] CRUD de frases com texto, cor, animação e autor.
- [ ] Ativar/desativar usuário e validar sessão revogada no próximo request.
- [ ] Métricas agregadas e ranking consistentes.
- [ ] Testar painel web em mobile/desktop e aplicativo móvel em aparelho físico.
- [ ] Validar acessibilidade, temas claro/escuro, feedback tátil e animações.

## Deploy
- [ ] Configurar secrets sem versionar `.env`.
- [ ] Configurar storage privado persistente/bucket privado; armazenamento local efêmero não é aceitável.
- [ ] Configurar rate limit compartilhado Redis/KV para múltiplas instâncias.
- [ ] Backup e restauração do banco e fotos; política de retenção e exclusão.
- [ ] Nenhum deploy sem autorização explícita.
