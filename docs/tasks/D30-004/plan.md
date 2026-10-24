# D30-004 — Telas de login, intake, calendário e detalhe

**Status:** implementado na branch `feat/d30-004-frontend`; commit pendente de autorização.

## Objetivo

Dar à navegadora a interface principal do CareFlow: login, cadastro por intake,
calendário de prazos e detalhe com ações.

## Requisitos relacionados

- RF-022 (calendário)
- RF-023 (card e detalhe)
- RF-032 (login)
- RF-033 (intake)
- RF-034 (descoberta tardia)
- RNF-019 a RNF-025 (acessibilidade/responsividade)

## Critérios de aceite

- [x] Login e logout com cookie, rota protegida e redirecionamento.
- [x] Intake: colar pedido, pré-preencher com IA, revisar e criar caso.
- [x] Calendário com Vencidos, 9 semanas e Depois.
- [x] Card com iniciais, dia, cor/rótulo, próximo passo, vencimento e selos.
- [x] Detalhe com relógio, timeline, extrações e ações permitidas.
- [x] Agendar/realizar exame, receber/confirmar laudo, tratamento, exceção, cobrança e encerramento.
- [x] Layout responsivo de 360px a 1440px.
- [x] Vite proxy `/api` e cliente tipado.
- [x] Testes de utilitários do calendário, lint, typecheck e build.

## Fora desta story

- Alertas, mensagens, link da paciente, métricas e Concluídos (D30-005).
- Seed/reset da demo (D30-006).
- UI de correção de evento e "Ciente" de alerta.

## Evidência

- `pnpm test`: 61 backend + 4 frontend.
- `pnpm test:e2e`: 15.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: verdes.
