# Forge V2 — implementação incremental

## Estado desta branch

Esta branch foi criada a partir de `forge/qa-foundation-2026-11-17` para manter a linha de QA anterior isolada e preparar uma revisão separada da V2.

### Entrega inicial de interface

- Nova rota web: `/v2`.
- Entrada motivacional com mensagens alternáveis e preferência de exibição na próxima abertura (armazenada localmente no navegador nesta prévia).
- Navegação para Visão geral, Rotina, Finanças, Corpo, Mente e Meu personagem.
- Rotina: criar hábitos, horários e marcar conclusão; indicadores recalculados em tela.
- Finanças: campos de entradas, despesas e meta de poupança com cálculos demonstrativos.
- Corpo: campos demonstrativos e aviso de privacidade para futuras fotos.
- Mente: seletor de humor e campo de reflexão demonstrativos.
- Avatar: editor manual inicial com cabelo, tom de pele, roupa, cor e nome.
- Tema escuro/claro e layout responsivo para celular.
- Animações discretas com respeito a `prefers-reduced-motion`.

## Limites explícitos desta prévia

A rota `/v2` é uma primeira entrega visual/interativa, não um lançamento de produção. Os formulários de finanças, corpo e mente e o avatar ainda usam estado local de sessão; apenas a preferência de entrada motivacional é mantida no armazenamento local do navegador. Não armazenar dados pessoais reais nesta prévia.

Ainda não implementado nesta branch:
- autenticação e sincronização dos módulos V2 com a API;
- persistência no servidor e isolamento multiusuário para os novos fluxos;
- upload de avatar/fotos, bucket privado, políticas RLS e exclusão de arquivos;
- geração de avatar por foto ou integração com provedor de IA;
- notificações, alarmes, metas avançadas e histórico;
- cobertura de testes E2E e validação em dispositivo Android real.

## Próximas etapas

1. Executar CI e corrigir falhas de TypeScript/build.
2. Integrar autenticação e preferências persistentes com API.
3. Evoluir os módulos para operações reais e testes de isolamento por usuário.
4. Configurar armazenamento privado e consentimento explícito antes de aceitar fotos.
5. Criar/selecionar projeto Supabase dedicado somente após revisão e confirmação de custo.
6. Configurar projeto Vercel separado apontando para `apps/admin` e validar preview sem publicar produção.
7. QA web, Android e acessibilidade; só então considerar lançamento.

## Serviços externos

Nenhuma chave, token, foto ou segredo é versionado. Não foram criados projetos pagos nem conectados bancos de dados existentes sem autorização. A geração de avatar por foto permanece desativada até seleção de fornecedor, avaliação de custo e consentimento.
