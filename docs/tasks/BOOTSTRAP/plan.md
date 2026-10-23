# BOOTSTRAP — Starter full-stack

## Objetivo

Entregar um template com auth, chat autenticado, health, CI e documentação,
pronto para receber o tema do hackathon.

## Critérios de aceite

- [x] `pnpm setup` e `pnpm dev` funcionam em clone limpo.
- [x] Cadastro/login/me/logout com Zod, Argon2id e JWT.
- [x] Chat exige autenticação; sem token retorna 401.
- [x] Gemini com fallback mock.
- [x] Health e Swagger.
- [x] Frontend com shadcn, sem telas de produto.
- [x] CI e scripts.
- [x] Documentação e ADRs.
- [ ] Push/execução remota do CI (requer autorização).

## Plano executado

1. Fundação do monorepo e contratos Zod.
2. PostgreSQL, Prisma, migration e seed.
3. Auth e testes unitários/e2e.
4. Chat autenticado, Gemini e mock.
5. Frontend Vite + Tailwind + shadcn.
6. CI, scripts, READMEs e docs.
7. Smoke test local.

## Pendências

- Testar `GEMINI_API_KEY` real.
- Executar CI após push autorizado.
- Implementar telas e domínio no evento.
