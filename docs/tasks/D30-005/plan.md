# D30-005 — Alertas, mensagens, link e métricas

**Status:** implementado na branch `feat/d30-005-alerts-public-metrics`; commit pendente de autorização.

## Objetivo

Fechar a operação da navegadora e a visão da paciente: mensagens simuladas,
alertas calculados, link público e métricas.

## Requisitos relacionados

- RF-024 a RF-029
- RNF-006 a RNF-009 (link da paciente)
- RNF-026/RNF-027 (canais)

## Critérios de aceite

- [x] Mensagens por evento e lembrete de silêncio, sem palavras proibidas.
- [x] `GET /api/alerts` calculado na leitura, com chave estável e "Ciente".
- [x] `POST /api/cases/:id/access-tokens` gera token de 32 bytes, guarda hash, revoga o anterior e mostra uma vez.
- [x] `GET /api/public/p/:token` é público, somente leitura, 404 igual e rate limit próprio.
- [x] Link após fechamento vale por 30 dias e depois retorna 404.
- [x] `GET /api/metrics` com numerador/denominador.
- [x] Tela de alertas, Concluídos com métricas e visão pública da paciente.
- [x] Detalhe mostra mensagens, alertas e geração de link.
- [x] Lint, typecheck, unit, e2e e build verdes.

## Fora desta story

- Seed/reset da demo (D30-006).
- Envio real de SMS/e-mail/WhatsApp.
- UI de correção de evento.

## Evidência

- `pnpm test`: 65 backend + 4 frontend.
- `pnpm test:e2e`: 19.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: verdes.
