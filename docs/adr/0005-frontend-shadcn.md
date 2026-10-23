# ADR 0005 — Frontend com shadcn e sem telas

- **Status:** aceito
- **Data:** 2026-10-22

## Contexto

O tema ainda é desconhecido. Construir telas agora seria desperdício e criaria
código que o time teria que apagar.

## Decisão

- Vite + React 19 + TypeScript + Tailwind 4.
- shadcn/ui local em `frontend/src/components/ui`.
- React Router, TanStack Query, React Hook Form e Zod configurados.
- `api-client.ts` tipado e `env.ts` validado.
- Apenas um placeholder; nenhuma tela de produto.

## Consequências

- O time começa o evento direto no domínio.
- Componentes shadcn prontos para acelerar a UI.
- Sem contexto de auth ou guards até o tema ser definido.
- Se houver mais de um app, shadcn pode ser extraído para `packages/ui` depois.
