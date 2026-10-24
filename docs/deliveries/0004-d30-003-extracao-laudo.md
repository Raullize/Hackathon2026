# 0004 — D30-003: extração de laudo

- **Data:** 2026-10-24
- **Story:** D30-003
- **Status:** implementado na branch `feat/d30-003-report-extraction`; commit pendente de autorização
- **Escopo:** filtro de identificadores, extração mock/Gemini, armazenamento e confirmação.

## Entregue

- `POST /api/cases/:id/report-extractions` autenticado.
- `IdentifierFilter` para CPF, CNS e nome.
- `MockReportExtractor` com regras de malignidade, data e evidência.
- `GeminiReportExtractor` com JSON, timeout, fallback de modelo e validação Zod.
- `ReportExtraction` persistido com provider, fallbackReason, suggestion e demoRawText.
- `REPORT_CONFIRMED` consome a extração na mesma transação do evento, calcula `changedFields` e impede reutilização.
- Detalhe do caso inclui as extrações.

## Evidência

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Lint | `pnpm lint` | ok |
| Typecheck | `pnpm typecheck` | ok |
| Unitários | `pnpm test` | 58 backend + 1 frontend |
| E2E | `pnpm test:e2e` | 14 passaram |
| Build | `pnpm build` | ok |

## Observações

- A extração não altera o estado do caso; só a confirmação da navegadora altera.
- `confidence` continua sendo rótulo heurístico, não probabilidade.
- O teste com Gemini real não foi executado nesta etapa; o mock e os fallbacks estão cobertos.

## Pendências

- D30-007: intake do pedido.
- D30-004/005/006: UI, alertas/mensagens/link/métricas e seed.
