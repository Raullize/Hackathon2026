# 0008 — D30-006: seed, reset e roteiro da demo

- **Data:** 2026-10-24
- **Story:** D30-006
- **Status:** implementado e commitado em `122e9d7` + `4c8ad63` na branch `feat/d30-006-demo-seed`
- **Escopo:** seed fictício repetível, reset transacional e barra de demo.

## Entregue

- `DemoSeedService` com 11 casos fictícios relativos ao dia atual do `Clock`.
- `pnpm db:seed` também cria os 11 casos, além do usuário de login.
- Cenários cobertos: Maria no dia 18 e verde; Joana vermelha com exceção
  `NO_CAPACITY`; Clara em `EXAM_DONE`; Lúcia com laudo aguardando confirmação;
  Beatriz em tratamento; Teresa com 60 dias vencido; Vera encerrada; Nora com
  descoberta tardia de 13 dias.
- `POST /api/demo/reset` limpa `report_extractions`, `patient_access_tokens`,
  `case_events` e `cases`, zera o relógio e recarrega o seed na mesma operação.
- `DemoBar` no calendário: `+1 dia`, `+7 dias`, reset do relógio e recarga da
  demo. A barra desaparece quando o modo demo está desligado.
- Runbook atualizado para usar `DEMO_MODE=true` e a barra.

## Evidência

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Lint | `pnpm lint` | ok |
| Typecheck | `pnpm typecheck` | ok |
| Unitários | `pnpm test` | 65 backend + 4 frontend |
| E2E | `pnpm test:e2e` | 19 passaram |
| Build | `pnpm build` | ok |
| Reset manual | `POST /api/demo/reset` | 11 casos |
| Leitura | `GET /api/cases?scope=open` / `closed` | 8 abertos / 3 concluídos |
| Alertas | `GET /api/alerts` | 8 |
| Métricas | `GET /api/metrics` | 3/6 diagnóstico, 1/2 tratamento, 1/11 tardio |
| Link público | `GET /api/public/p/:token` | 200, 3 direitos, 3 mensagens |

## Observações

- `TREATMENT_STARTED` é status concluído no domínio; por isso o seed tem 8
  abertos e 3 concluídos.
- O reset não apaga o usuário de login.
- `POST /api/demo/reset` só existe com `DEMO_MODE=true`; em produção o env
  impede a combinação.
- O seed não cria laudos reais nem chamadas externas.

## Pendências

- Vídeo e ensaio do pitch.
- Deploy e compose de produção ficam para depois do hackathon.
