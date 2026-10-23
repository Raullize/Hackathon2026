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
| AI-001 | Validar a chave Gemini real | `docs/deliveries/0001-bootstrap.md` — `provider: "gemini"` com `gemini-3.5-flash-lite` |

## Ready

| ID | Story | Critério de aceite |
| --- | --- | --- |
| PITCH-001 | Preencher pitch com o tema do evento | problema, solução, impacto, negócio e demo sem números inventados |

## Backlog

| ID | Story | Observação |
| --- | --- | --- |
| FEAT-001 | Implementar telas de auth no frontend | depois do tema; reutilizar shadcn e contratos |
| FEAT-002 | Implementar tela de chat autenticada | depois do tema; usar `/api/chat` |
| FEAT-003 | Definir domínio e seeders reais | preencher `spec-driven-development/domain.md` primeiro |
| OPS-001 | Deploy e compose de produção | somente depois do hackathon |

## WIP limit

Uma story em execução por pessoa. Se surgir trabalho novo, vai para `Backlog`.
