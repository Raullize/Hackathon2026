# D30-007 — Extração de intake do pedido

**Status:** implementado na branch `feat/d30-007-case-intake`; commit pendente de autorização.

## Objetivo

Receber o texto do pedido/encaminhamento e sugerir `requestedAt`, `trigger`,
`examLabel` e `evidenceQuote`, sem criar caso e sem enviar PII à IA.

## Requisitos relacionados

- RF-033 (extração de intake)
- RNF-034 (sem PII)

## Critérios de aceite

- [x] `POST /api/case-intake/extractions` autenticado e validado com Zod.
- [x] Sanitização remove CPF, CNS e nome rotulado (`Paciente:`/`Nome:`).
- [x] Mock identifica BI-RADS 4/5, suspeita clínica, data e exame.
- [x] Gemini com JSON validado, timeout e fallback mock.
- [x] Evidência não literal cai para `invalid_output`.
- [x] Resposta não cria caso e não retorna PII.
- [x] PDF fica fora do MVP; entrada é texto.
- [x] Lint, typecheck, unit, e2e e build verdes.

## Evidência

- `pnpm test`: 61 backend + 1 frontend.
- `pnpm test:e2e`: 15.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: verdes.
