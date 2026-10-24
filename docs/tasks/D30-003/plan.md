# D30-003 — Extração de laudo

**Status:** implementado na branch `feat/d30-003-report-extraction`; commit pendente de autorização.

## Objetivo

Receber o texto do laudo, remover identificadores, sugerir campos estruturados com
Gemini ou regra local, guardar a extração e permitir que a navegadora confirme.

## Requisitos relacionados

- RF-019 (sugestão de laudo)
- RF-020 (confirmação do laudo)
- RF-021 (filtro de identificadores)
- RNF-016, RNF-017 e RNF-018
- RNF-028 e RNF-029 (`confidence` heurístico)

## Critérios de aceite

- [x] `POST /api/cases/:id/report-extractions` valida `{ reportText }` com Zod.
- [x] Filtro remove CPF, CNS e nome antes de qualquer extrator.
- [x] Mock por palavra-chave e regex de data.
- [x] Gemini com JSON validado, timeout e fallback mock.
- [x] Evidência que não aparece literalmente cai para `invalid_output`.
- [x] Extração guardada com provider, fallbackReason, suggestion e `demoRawText` só em demo.
- [x] Extração não muda o estado do caso.
- [x] `REPORT_CONFIRMED` consome a extração uma única vez e registra `changedFields`.
- [x] Segunda confirmação → 409.
- [x] Detalhe do caso lista extrações.
- [x] Lint, typecheck, unit, e2e e build verdes.

## Fora desta story

- Intake do pedido (D30-007).
- UI de confirmação (D30-004).

## Evidência

- `pnpm test`: 58 backend + 1 frontend.
- `pnpm test:e2e`: 14.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: verdes.
