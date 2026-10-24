# Kanban oficial

Fonte da próxima demanda. Uma story por linha; nada entra em `Done` sem
evidência em `docs/deliveries/`.

## Done

| ID | Story | Evidência |
| --- | --- | --- |
| BOOT-001 | Monorepo pnpm com `backend`, `frontend` e `packages/contracts` | `docs/deliveries/0001-bootstrap.md` |
| BOOT-002 | PostgreSQL de desenvolvimento + Prisma + migration + seed | idem |
| BOOT-003 | Auth com Zod, Argon2id, JWT, Bearer/cookie e e2e | idem |
| BOOT-004 | Chat autenticado com Gemini e fallback mock | idem |
| BOOT-005 | Health, Swagger e envelope de erro | idem |
| BOOT-006 | Frontend com Vite, Tailwind e shadcn, sem telas | idem |
| BOOT-007 | CI, scripts de setup/smoke e READMEs | idem |
| DOCS-001 | Estrutura de docs, ADRs, requisitos e templates | idem |
| DOMAIN-001 | Analisar o tema Saúde Conectada 2026 | `docs/tema-saude-conectada.md` |
| AI-001 | Validar a chave Gemini real | `docs/deliveries/0001-bootstrap.md` — `provider: "gemini"` com `gemini-3.5-flash-lite` |
| D30-001 | Contratos, schema Prisma, migration e `computeCaseStatus` com testes de prazo, silêncio, selos, cores, transições, correções e descoberta tardia | `docs/deliveries/0002-d30-001-motor-de-prazos.md` |
| D30-002 | API de casos e eventos, `Clock`, `source`, descoberta tardia e endpoints de demo | `docs/deliveries/0003-d30-002-api-casos.md` |
| D30-003 | Extração de laudo com filtro, mock, Gemini, fallback e confirmação | `docs/deliveries/0004-d30-003-extracao-laudo.md` |
| D30-007 | Extração de intake do pedido (texto; sem PII; PDF só UI) | `docs/deliveries/0005-d30-007-intake.md` |
| D30-004 | Telas de login, intake, calendário e detalhe responsivas | `docs/deliveries/0006-d30-004-telas.md` |

## Ready

| ID | Story | Critério de aceite |
| --- | --- | --- |
| PITCH-001 | Preencher pitch com o tema do evento | problema, solução, impacto, negócio e demo sem números inventados |
| OPS-002 | Definir protocolo de entrada da UBS | canal oficial, responsável, SLA de mesmo dia, fallback e rotina de conferência; documentar em `OPERATIONS.md` |

## Backlog

Histórias do MVP Dia 30, na ordem dos PRs. Spec:
`docs/spec-driven-development/dia-30-mvp-spec.md`.

| ID | Story | Observação |
| --- | --- | --- |
| D30-005 | Alertas, mensagens (SMS/e-mail; WhatsApp só visão), link da paciente, cobrança e Concluídos com as métricas | RF-024 a RF-029, RF-035; ordem de corte: métricas, escada, link público |
| D30-006 | Seed, reset e roteiro da demo | RF-031; incluir caso de descoberta tardia; `docs/pitch/DEMO_SCRIPT.md` |
| ~~FEAT-001~~ | ~~Implementar telas de auth no frontend~~ | absorvida pelo D30-004 |
| ~~FEAT-003~~ | ~~Definir domínio e seeders reais~~ | substituída pelo D30-001 a D30-007 (domínio em `domain.md`, seed no D30-006) |
| OPS-001 | Deploy e compose de produção | somente depois do hackathon |

## Fora do MVP

| ID | Story | Motivo |
| --- | --- | --- |
| FEAT-002 | Implementar tela de chat autenticada | o produto não é chatbot; a IA estrutura laudos |

## Critério de Done das histórias D30

- Teste escrito antes, falhando, com a falha registrada.
- Suíte, lint, typecheck e build verdes.
- E2e dos endpoints novos.
- Checklist com print para as telas.
- Checklist responsivo em 360, 768, 1280 e 1440px, sem overflow horizontal.
- Evidência em `docs/deliveries/`.
- RF citado no PR.
- No máximo 50 arquivos por PR.

## WIP limit

Uma story em execução por pessoa. Se surgir trabalho novo, vai para `Backlog`.
