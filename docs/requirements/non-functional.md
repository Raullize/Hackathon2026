# Requisitos não funcionais

## Segurança

- Senhas com Argon2id; nunca em texto puro ou log.
- JWT com segredo de no mínimo 32 caracteres; expiração de 8h.
- `GEMINI_API_KEY` somente no backend; nunca em `VITE_*`.
- `.env` fora do git; apenas `.env.example` versionado.
- Validação de entrada com Zod em auth e chat.
- Rate limit global e limite mais rígido no chat.
- Erros não expõem stack trace, token ou conteúdo de mensagem.
- Cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

## Confiabilidade

- `/health` para liveness, sem dependência.
- `/health/ready` verifica o PostgreSQL e retorna `503` se estiver fora.
- Chat cai para mock em falha do provedor, mantendo a demo viva.
- Timeout configurável para o Gemini (`LLM_TIMEOUT_MS`).

## Manutenibilidade

- Contratos Zod compartilhados em `packages/contracts`.
- Domínio não importa Prisma; repositórios fazem a tradução.
- Um módulo por responsabilidade: auth, chat, health, prisma.
- Testes unitários e e2e para os comportamentos críticos.
- CI com lint, typecheck, testes e build.

## Performance

- Chat limita histórico a 20 mensagens e 16.000 caracteres.
- `GEMINI_MAX_OUTPUT_TOKENS` padrão em 512 para controlar custo/latência.
- Frontend com build Vite e code splitting disponível quando houver telas.

## Dia 30 — LGPD e dados pessoais

Detalhes em [`../spec-driven-development/dia-30-mvp-spec.md`](../spec-driven-development/dia-30-mvp-spec.md).

- **RNF-001** Demo só com dados e laudos fictícios. Nenhum dado pessoal real no
  repositório, no seed, nos testes ou nos prints de `docs/deliveries/`.
- **RNF-002** Filtro de identificadores antes de qualquer extrator de laudo, inclusive
  na demo: CPF, CNS e o nome da paciente viram `[CPF]`, `[CNS]` e `[NOME]`. O filtro
  reduz o risco, mas não garante anonimização.
- **RNF-003** O texto bruto do laudo só é guardado com `DEMO_MODE=true`, num campo
  marcado para ser apagado (`demoRawText`), que o reset de demo apaga. A regra de
  produção é `[DECISÃO PENDENTE]` (aviso de LGPD em `domain.md`).
- **RNF-004** Texto de laudo (bruto ou filtrado), token da paciente, `fullName` e CNS
  nunca aparecem em log, em mensagem de erro ou em resposta da API.
- **RNF-005** Mensagens e visão da paciente sem as palavras "câncer", "cancer",
  "tumor", "maligno" e "carcinoma", provado por teste.

## Dia 30 — Link da paciente

- **RNF-006** Token de 32 bytes aleatórios por caso; o banco guarda só o hash SHA-256; o
  token é mostrado uma única vez.
- **RNF-007** Rate limit próprio em `GET /api/public/p/:token`, separado do limite geral:
  10 requisições a cada 60 s por IP `[SUPOSIÇÃO]`; excedeu, `429`.
- **RNF-008** Resposta `404` idêntica para token inexistente, revogado ou expirado, sem
  revelar qual é o caso.
- **RNF-009** O link vale até 30 dias depois do fechamento do caso `[SUPOSIÇÃO]`.

## Dia 30 — Modo demo

- **RNF-010** `DEMO_MODE=true` liga o módulo `demo` (`/api/demo/*`), o deslocamento do
  relógio e o `demoRawText`. Sem ele, as rotas de demo retornam `404` e o deslocamento é
  ignorado.
- **RNF-011** `DEMO_MODE=true` com `NODE_ENV=production` falha na validação do
  ambiente, porque o reset apaga as tabelas do Dia 30 `[DECISÃO PENDENTE]`.
- **RNF-012** Sem cron e sem `@nestjs/schedule`: estado, cores, alertas, mensagens e
  métricas são calculados na leitura (ADR 0006).

## Dia 30 — Datas e fuso

- **RNF-013** Fuso `America/Sao_Paulo`. "Hoje" é calculado só no `Clock`, com
  `Intl.DateTimeFormat`; o frontend usa o `today` que a API devolve, nunca a data do
  navegador.
- **RNF-014** Datas sem hora: `YYYY-MM-DD` nos contratos Zod, `@db.Date` no Prisma e
  contas com número inteiro de dias. Sem dependência nova de datas.
- **RNF-015** Teste de virada: 23h30 local (02h30 UTC do dia seguinte) ainda é o mesmo
  dia.

## Dia 30 — Extração de laudo

- **RNF-016** Timeout configurável da extração pelo Gemini
  (`REPORT_EXTRACTION_TIMEOUT_MS`, padrão 8000 ms `[SUPOSIÇÃO]`). Ao estourar, cai para o
  mock (regra local), registrando o motivo.
- **RNF-017** A saída do extrator é validada por Zod; saída inválida cai para o mock.
- **RNF-018** A extração tem rate limit mais rígido que a API geral, como o chat.

## Dia 30 — Acessibilidade e celular

- **RNF-019** A cor nunca aparece sozinha: sempre com rótulo em texto ("No prazo",
  "Atenção", "Vencido") e ícone.
- **RNF-020** O card é um `<button>` focável, com `aria-label` (iniciais, dia e prazo).
  Calendário, detalhe e confirmação do laudo funcionam só com teclado, com foco
  visível.
- **RNF-021** Contraste mínimo WCAG AA no texto de cards e selos `[SUPOSIÇÃO]`.
- **RNF-022** Abaixo de 768px, o calendário vira uma lista vertical agrupada por semana.
  O link da paciente é pensado primeiro para celular, sem rolagem horizontal.

## Desenvolvimento

- Node 24, pnpm 11 e Docker.
- `pnpm setup` idempotente.
- Comandos reais no README, sem dependência de passos manuais ocultos.
- Código e commits em inglês; docs e UI em português.
