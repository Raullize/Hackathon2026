# 0002 — D30-001: modelo do caso e motor de prazos

- **Data:** 2026-10-24
- **Story:** D30-001
- **Status:** concluído na branch `feat/d30-001-domain`; tag não criada
- **Escopo:** contratos Zod, schema Prisma, migration e domínio de prazos.

## Entregue

- `packages/contracts/src/cases.ts` com enums, `CaseEventInput`, `CaseView`, `CaseDetail`, `ReportSuggestion`, `CaseIntakeSuggestion` e views.
- Schema Prisma com `Case`, `CaseEvent`, `ReportExtraction`, `PatientAccessToken` e `DemoClockState`; `prisma validate` ok.
- Migration `20261024064337_dia30_cases` aplicada.
- Domínio puro em `backend/src/cases/domain`:
  - `dates.ts` e `deadline-rules.ts`;
  - `transitions.ts` com matriz, `allowedEventTypes` e erro de transição;
  - `corrections.ts` com campos corrigíveis e última correção vencendo;
  - `compute-case-status.ts` com D30/D60, cores, silêncio, selos, `LATE_ENTRY`, `CONTACT_LOGGED` e outcomes;
  - fixture golden da Maria.
- Testes: 35 testes de domínio, incluindo bordas, silêncio, exceção, correção, descoberta tardia, outcomes e golden fixture.

## Evidência

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Prisma | `prisma validate` | schema válido |
| Migration | `prisma migrate dev --name dia30_cases` | aplicada |
| Domínio | `pnpm --filter @careflow/backend test -- src/cases/domain` | 35 passaram |
| Teste de mutação | `D30.days=29` temporário | 7 falhas esperadas; restaurado |
| Suíte | `pnpm test` | 43 backend + 1 frontend |
| E2E | `pnpm test:e2e` | 4 passaram |
| Qualidade | `pnpm lint`, `pnpm typecheck`, `pnpm build` | verdes |

## Observações

- `Case` foi aceito pelo Prisma 6.19.3; não foi necessário usar `CareCase`.
- O domínio não importa Prisma nem Nest.
- `recordedAt` é tratado como data local (`YYYY-MM-DD`) no domínio; a conversão do timestamp fica na camada de aplicação/D30-002.
- O seed com casos fictícios e reset ficam no D30-006.
- API, Clock, endpoints e e2e de casos ficam no D30-002.

## Pendências

- D30-002: API de casos/eventos, Clock, descoberta tardia e demo.
- D30-003: extração de laudo.
- D30-007: extração de intake.
- D30-004/005/006: UI, alertas/mensagens/link/métricas e seed.
