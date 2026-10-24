# D30-006 — Seed, reset e roteiro da demo

**Status:** implementado na branch `feat/d30-006-demo-seed`.

## Objetivo

Deixar a demo repetível: seed fictício com 11 casos, reset transacional e barra
de relógio para a apresentação.

## Requisitos relacionados

- RF-031
- RNF-010 (dados fictícios)
- RNF-021 (modo demo desligado por padrão)

## Critérios de aceite

- [x] Seed com 11 casos fictícios, incluindo Maria (dia 18), caso vermelho com
  exceção e caso de descoberta tardia (Nora).
- [x] `POST /api/demo/reset` apaga dados de casos e recarrega o seed na mesma
  transação.
- [x] Reset zera o relógio antes de calcular as datas do seed.
- [x] Endpoint respeita `DEMO_MODE`; com a flag desligada responde 404.
- [x] Barra de demo no calendário com `+1 dia`, `+7 dias`, reset do relógio e
  recarga do seed; some quando o modo demo está desligado.
- [x] Roteiro da demo usa a barra e o reset.
- [x] Lint, typecheck, unit, e2e e build verdes.

## Plano

1. Modelar os casos e eventos fictícios relativos ao `Clock`.
2. Implementar `DemoSeedService` com limpeza e recarga transacionais.
3. Expor `POST /api/demo/reset` no controller de demo.
4. Adicionar `DemoBar` ao calendário, condicionada ao `GET /api/demo/status`.
5. Atualizar runbook, KANBAN e delivery.

## Arquivos previstos

- `backend/src/demo/demo-seed.service.ts`
- `backend/src/demo/demo.{controller,module,service,spec}.ts`
- `frontend/src/features/cases/demo-bar.tsx`
- `frontend/src/features/cases/calendar-page.tsx`
- `docs/tasks/D30-006/`
- `docs/deliveries/0008-d30-006-seed-reset.md`
- `docs/demo-runbook.md`
- `docs/backlog/KANBAN.md`

## Riscos

- O seed não deve depender de internet, Gemini ou Gemini real.
- `DEMO_MODE=true` não pode subir em produção; o env já bloqueia.
- O reset apaga somente tabelas do MVP; não toca usuários.
- Datas relativas podem cair em fim de semana; o roteiro já alerta sobre isso.

## Evidência esperada

- Comando: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
- Resultado: 65 backend + 4 frontend, 19 e2e, build verde.
- Manual: `POST /api/demo/reset` → 11 casos; 8 abertos, 3 concluídos; 8 alertas.
