# D30-002 — API de casos, eventos, Clock e demo

**Status:** implementado na branch `feat/d30-002-cases-api`; commit pendente de autorização.

## Objetivo

Expor a API autenticada de casos e eventos, com `Clock` de `America/Sao_Paulo`,
descoberta tardia, registro de cobrança e endpoints de relógio de demo.

## Requisitos relacionados

- RF-011 (cadastro de caso)
- RF-017 (transições)
- RF-018 (correção)
- RF-030 (relógio de demo)
- RF-034 (descoberta tardia)
- RF-035 (registro de cobrança)

## Critérios de aceite

- [x] `POST /api/cases` cria caso `SUSPECTED`, com `source` e `CASE_CREATED`.
- [x] `GET /api/cases?scope=open|closed` retorna `{ today, cases }`.
- [x] `GET /api/cases/:id` retorna `CaseDetail` sem PII.
- [x] `POST /api/cases/:id/events` valida Zod, aplica transição e retorna 201.
- [x] Transição inválida/caso fechado → 409; payload/data inválida → 400; inexistente → 404.
- [x] `LATE_ENTRY` e `CONTACT_LOGGED` funcionam pela API.
- [x] `source` aparece na criação e no `CaseView`.
- [x] `Clock` usa `America/Sao_Paulo` e offset de demo.
- [x] `GET /api/demo/status`, `POST /api/demo/clock/advance` e `POST /api/demo/clock/reset`; sem `DEMO_MODE`, 404.
- [x] `DEMO_MODE` e `REPORT_EXTRACTION_TIMEOUT_MS` no env.
- [x] Lint, typecheck, unit, e2e e build verdes.

## Fora desta story

- Extração de laudo (D30-003), intake (D30-007), link da paciente (D30-005), alertas/mensagens/métricas (D30-005) e reset do seed (D30-006).

## Evidência

- `pnpm test`: 49 backend + 1 frontend.
- `pnpm test:e2e`: 13.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: verdes.
