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

## Ready

| ID | Story | Critério de aceite |
| --- | --- | --- |
| PITCH-001 | Preencher pitch com o tema do evento | problema, solução, impacto, negócio e demo sem números inventados |
| D30-001 | Contratos Zod, modelo Prisma, migration e `computeCaseStatus` com os testes das regras de prazo | RF-012 a RF-018 (regras de domínio); plano em `docs/tasks/D30-001/plan.md` |

## Backlog

Histórias do MVP Dia 30, na ordem dos PRs. Spec:
`docs/spec-driven-development/dia-30-mvp-spec.md`.

| ID | Story | Observação |
| --- | --- | --- |
| D30-002 | API de casos e eventos, `Clock` e endpoints de demo | RF-011, RF-017, RF-018, RF-030; depois do D30-001; adiciona `DEMO_MODE` e `REPORT_EXTRACTION_TIMEOUT_MS` ao `env.ts` |
| D30-003 | `ReportExtractor` (mock, Gemini e filtro) e fluxo de confirmação do laudo | RF-019, RF-020, RF-021; nunca cortar |
| D30-004 | Telas de login, calendário e detalhe do caso | RF-022, RF-023, RF-032; absorve o FEAT-001; nunca cortar o calendário |
| D30-005 | Alertas, mensagens, link da paciente e Concluídos com as métricas | RF-024 a RF-029; ordem de corte: métricas, escada, link público |
| D30-006 | Seed, reset e roteiro da demo | RF-031; `docs/pitch/DEMO_SCRIPT.md` |
| ~~FEAT-001~~ | ~~Implementar telas de auth no frontend~~ | absorvida pelo D30-004 |
| ~~FEAT-003~~ | ~~Definir domínio e seeders reais~~ | substituída pelo D30-001 a D30-006 (domínio em `domain.md`, seed no D30-006) |
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
- Evidência em `docs/deliveries/`.
- RF citado no PR.
- No máximo 50 arquivos por PR.

## WIP limit

Uma story em execução por pessoa. Se surgir trabalho novo, vai para `Backlog`.
