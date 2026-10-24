# 0007 — D30-005: alertas, mensagens, link e métricas

- **Data:** 2026-10-24
- **Story:** D30-005
- **Status:** implementado e commitado em `2241ebf` na branch `feat/d30-005-alerts-public-metrics`
- **Escopo:** mensagens, alertas, link público, métricas e telas de acompanhamento.

## Entregue

- Templates de mensagens por evento, incluindo silêncio, sem palavras proibidas.
- `GET /api/alerts` calculado na leitura, com destinatário, ação, chave estável e "Ciente".
- `POST /api/cases/:id/access-tokens` com token de 32 bytes, hash SHA-256, revogação do anterior e exibição única.
- `GET /api/public/p/:token` público, somente leitura, com rate limit e 404 uniforme.
- Janela de 30 dias após o fechamento do caso.
- `GET /api/metrics` com numerador, denominador e valor.
- Tela de Alertas.
- Aba Concluídos com mini painel de métricas.
- Visão pública da paciente sem PII e sem a palavra "câncer".
- Detalhe com mensagens, alertas e botão de geração de link.

## Evidência

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Lint | `pnpm lint` | ok |
| Typecheck | `pnpm typecheck` | ok |
| Unitários | `pnpm test` | 65 backend + 4 frontend |
| E2E | `pnpm test:e2e` | 19 passaram |
| Build | `pnpm build` | ok |

## Observações

- SMS/e-mail são simulados; não há envio real.
- O token do link só é exibido uma vez e não é registrado em log.
- A visão pública não mostra nome, CNS, CPF, cor vermelha nem termos proibidos.
- Não há tabela de alertas nem job: tudo é calculado na leitura.

## Pendências

- D30-006: seed, reset e roteiro da demo.
- Deploy e compose de produção ficam para depois do hackathon.
