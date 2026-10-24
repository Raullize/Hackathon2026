# D30-001 — Modelo do caso e motor de prazos

**Status:** concluído na branch `feat/d30-001-domain`.

## Objetivo

Calcular, numa função pura e testada (`computeCaseStatus(case, events, today)`), o
estado, a cor, o "Dia X de 30/60", o vencimento, os selos, os resultados e os eventos
permitidos de um caso, com os contratos Zod, o modelo Prisma e a migration prontos para
o D30-002.

Spec: [`../../spec-driven-development/dia-30-mvp-spec.md`](../../spec-driven-development/dia-30-mvp-spec.md),
seções 4 a 7, 9 e 18.

## Requisitos relacionados

- RF-012 (prazo de 30 dias)
- RF-013 (prazo de 60 dias)
- RF-014 (cores)
- RF-015 (silêncio e data passada)
- RF-016 (exceções e encerramento: regra de domínio)
- RF-017 (transições: matriz de domínio; o endpoint fica no D30-002)
- RF-018 (correção: aplicação no cálculo; o endpoint fica no D30-002)
- RF-033 (extração de intake: contrato)
- RF-034 (descoberta tardia: cálculo do selo)
- RF-035 (registro de cobrança: contrato do evento)
- RNF-012 (sem cron)
- RNF-014 (datas sem hora, dias inteiros, sem dependência nova)

## Critérios de aceite

- [x] Os exemplos numéricos da seção 5.5 da spec passam como testes em tabela.
- [x] Bordas: dia 30 amarelo e dia 31 vermelho; faltam 8 (verde) e 7 (amarelo); no D60,
  15 e 14; `reportDate = requestedAt + 30` cumpriu e `+ 31` não; `treatmentStartedAt =
  reportDate + 60` cumpriu e `+ 61` não.
- [x] Silêncio: 6 dias verde, 7 dias amarelo; "Ciente" e `CORRECTION` não zeram; data
  agendada hoje não dá selo; data de ontem sem registro dá o selo "Data passou sem
  registro" e amarelo; vermelho com silêncio continua vermelho, com o selo.
- [x] Exceção não muda a cor; `CASE_CLOSED_EXCEPTION` registra "cumpriu até o
  encerramento" ou "não cumpriu"; caso fechado não tem cor.
- [x] Laudo inconclusivo leva a `EXAM_TO_RESCHEDULE` sem reiniciar os 30 dias.
- [x] Correção de `requestedAt` ou `reportDate` muda o cálculo; correção de
  `malignancy` é rejeitada.
- [x] Matriz de transições: todo par (estado, evento) fora da tabela 4.3 é rejeitado
  com um erro de domínio que o D30-002 traduz em `409`.
- [x] `LATE_ENTRY`: `CASE_CREATED.recordedAt > requestedAt + 30` gera o selo, sem
  reiniciar o prazo.
- [x] `CONTACT_LOGGED` aceita canais do enum, não muda estado e não zera silêncio.
- [x] `caseIntakeSuggestionSchema` tem `requestedAt`, `trigger`, `examLabel`,
  `evidenceQuote` e `provider`, sem nome/CNS/data de nascimento.
- [x] Golden fixture da Maria: em `T`, dia 18 de 30, verde; em `T+7`, dia 25, faltam 5,
  amarelo, com os selos de data passada e de silêncio; depois do laudo maligno com
  `reportDate = T+7`, 30 dias cumpriu e D60 vencendo em `T+67`.
- [x] Teste que quebra de propósito: uma versão com vencimento em `requestedAt + 29`
  roda contra as asserções da Maria e de borda e **reprova**.
- [x] Limites em `DEADLINE_RULES`, numa constante central, marcados `[SUPOSIÇÃO]` no
  comentário.
- [x] `computeCaseStatus` e o domínio não importam Prisma nem Nest.
- [x] Schema Prisma com `Case`, `CaseEvent`, `ReportExtraction`, `PatientAccessToken` e
  `DemoClockState`; `prisma validate` passa e a migration é gerada.
- [x] Contratos Zod em `packages/contracts` (datas `YYYY-MM-DD`, `CaseEventInput` como
  `discriminatedUnion('type')`, `CaseView` com `source` e `LATE_ENTRY`,
  `reportSuggestionSchema`, `caseIntakeSuggestionSchema`, `CONTACT_LOGGED`) exportados e
  com build verde.
- [x] `reportSuggestionSchema.confidence` é enum `high|medium|low`, nunca número; a
  spec e o ADR 0008 deixam claro que é heurística, não probabilidade do Gemini.
- [x] Suíte, lint, typecheck e build verdes; evidência em `docs/deliveries/`.

## Plano

1. Rodar `prisma validate` com um model `Case` mínimo para confirmar que o nome é
   aceito no Prisma 6.19.3. Se não for, usar `CareCase` com `@@map("cases")` e
   registrar em `progress.txt`.
2. Escrever os testes das funções de data (`toDayNumber`, `addDays`, `diffDays`) e vê-los
   falhar. Implementar o mínimo.
3. Escrever os testes em tabela de `computeCaseStatus` para os relógios de 30 e 60 dias
   (seção 5.5 e bordas) e vê-los falhar. Registrar a falha. Implementar o mínimo, com
   `DEADLINE_RULES`.
4. Escrever os testes de silêncio, data agendada e selos (seção 6) e vê-los falhar.
   Implementar.
5. Escrever os testes de exceção, encerramento e resultados (`outcome30`, `outcome60`) e
   vê-los falhar. Implementar.
6. Escrever os testes de `CORRECTION` (valor corrigido, correção mais recente, campo não
   corrigível) e vê-los falhar. Implementar.
7. Escrever a matriz de transições e os `allowedEventTypes` por estado e vê-los falhar.
   Implementar `assertTransition`/`applyEvent`.
8. Montar a golden fixture da Maria (linha do tempo em arquivo) e o teste que quebra de
   propósito. Confirmar que o teste quebrado reprova.
9. Escrever os contratos Zod em `packages/contracts/src/cases.ts`, exportar no
   `index.ts` e rodar o build do pacote.
10. Escrever o schema Prisma completo (seção 9 da spec) e gerar a migration com
    `pnpm db:migrate`.
11. Refatorar só com tudo verde. Rodar `pnpm lint`, `pnpm typecheck`, `pnpm test` e
    `pnpm build`.
12. Registrar a evidência em `docs/deliveries/` e atualizar `progress.txt`.

## Arquivos previstos

- `packages/contracts/src/cases.ts`
- `packages/contracts/src/case-intake.ts`
- `packages/contracts/src/index.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/<timestamp>_dia30_cases/migration.sql`
- `backend/src/cases/domain/dates.ts` e `dates.spec.ts`
- `backend/src/cases/domain/deadline-rules.ts`
- `backend/src/cases/domain/compute-case-status.ts` e `compute-case-status.spec.ts`
- `backend/src/cases/domain/silence.spec.ts`
- `backend/src/cases/domain/transitions.ts` e `transitions.spec.ts`
- `backend/src/cases/domain/corrections.ts` e `corrections.spec.ts`
- `backend/src/cases/domain/case.types.ts`
- `backend/src/cases/domain/__fixtures__/maria.timeline.ts`
- `backend/src/cases/domain/golden-maria.spec.ts`
- `docs/tasks/D30-001/progress.txt`
- `docs/deliveries/<NNNN>-d30-001-motor-de-prazos.md`

## Riscos

- `Case` pode ser nome reservado no Prisma: verificado no passo 1.
- `pnpm db:migrate` precisa do PostgreSQL de desenvolvimento rodando
  (`pnpm docker:up`).
- O domínio tem muitas regras para um PR só. Se passar de 50 arquivos ou ficar grande
  demais para revisar, separar os contratos Zod e o schema Prisma num PR anterior e
  dizer no PR.
- As regras de silêncio por `recordedAt` e a remarcação são `[DECISÃO PENDENTE]` na
  spec; se o time mudar de ideia, o impacto fica nos testes da seção 6.

## Evidência esperada

- Comando: `pnpm --filter @careflow/backend test -- src/cases/domain`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Resultado: contagem de testes passando; a falha inicial de cada teste registrada em
  `progress.txt`; o teste que quebra de propósito reprovando a versão errada.
- CI: ID do run, quando houver push autorizado.
