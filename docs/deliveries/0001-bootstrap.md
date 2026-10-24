# 0001 — Bootstrap do starter

- **Data:** 2026-10-22/23
- **Branch:** `chore/bootstrap-hackathon-starter`
- **Escopo:** fundação full-stack, auth, chat autenticado, health, CI e docs.

## Entregue

- Monorepo pnpm com `backend/`, `frontend/` e `packages/contracts/`.
- PostgreSQL 17 via Docker Compose, Prisma 6, migration inicial e seed demo.
- Auth: register, login, me, logout; Argon2id; JWT 8h; Bearer e cookie.
- Chat `POST /api/chat` protegido por JWT; Gemini com fallback mock.
- Health `/api/health` e `/api/health/ready`.
- Swagger em `/docs`.
- Frontend Vite + React + Tailwind 4 + shadcn, sem telas de produto.
- CI com lint, typecheck, unit, e2e, build.
- Scripts `setup.sh` e `smoke.mjs`.
- Docs, ADRs, requisitos, kanban, runbook e templates de pitch.

## Fora de escopo

- Notes/CRUD de exemplo.
- Telas de login, chat ou dashboard.
- Refresh token, roles, OAuth, e-mail e persistência de conversa.
- Compose de produção e deploy.

## Evidência local

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Setup completo | `pnpm setup` | ok (DB, install, contracts, migrate, seed) |
| Dev | `pnpm dev` | API 200 em `/api/health`, web 200 em `/` |
| Instalação | `pnpm install` | ok |
| Lint | `pnpm lint` | ok |
| Typecheck | `pnpm typecheck` | ok (contracts, backend, frontend) |
| Unitários | `pnpm test` | 8 passaram (backend) + 1 (frontend) |
| E2E | `pnpm test:e2e` | 4 passaram |
| Build | `pnpm build` | ok (backend + frontend) |
| Migração | `prisma migrate dev --name init` | aplicada |
| Seed | `pnpm db:seed` | `demo@careflow.dev` criado |
| Smoke | `pnpm smoke` | health, ready, register, login, chat 401/200 |
| Swagger | `GET /docs` | 200 |
| Gemini real | `POST /api/chat` com `LLM_PROVIDER=gemini` | `provider: "gemini"`, `model: "gemini-3.5-flash-lite"` |

Observações:

- O PostgreSQL local usa a porta `55432` porque `5432` e `5433` já estavam
  ocupadas na máquina de desenvolvimento.
- A chave Gemini real foi exercitada. O `gemini-2.5-flash-lite` retornou 404
  para esta chave nova, o `gemini-3.1-flash-lite` retornou 403 e o
  `gemini-3.5-flash-lite` respondeu com sucesso. O fallback agora cobre os três.
- O CI foi criado, mas a execução remota depende de push autorizado.

## Pendências

- Rodar o workflow no GitHub após push.
- Implementar o domínio e as telas no evento.

## Próximo passo

Preencher `docs/spec-driven-development/domain.md` quando o tema for anunciado.
