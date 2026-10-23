# ADR 0001 — Monorepo com pnpm e pastas na raiz

- **Status:** aceito
- **Data:** 2026-10-22

## Contexto

O time precisa compartilhar schemas Zod entre API e frontend e rodar tudo com um
comando. O repositório começa vazio e o tempo até o evento é curto.

## Decisão

Usar pnpm workspaces com:

```
backend/
frontend/
packages/contracts/
```

As pastas ficam na raiz, sem `apps/`, para reduzir níveis e manter o template
simples.

## Consequências

- Um único `pnpm install`, lockfile e comando de build.
- Contratos compartilhados sem publicação em registry.
- `backend` e `frontend` têm READMEs próprios.
- Se o projeto crescer, é possível mover para `apps/` sem mudar a arquitetura.
