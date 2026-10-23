# Frontend

Arquitetura React pronta para o evento, **sem telas de produto**. A ideia é
gastar o tempo do hackathon no domínio, não em configuração.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- shadcn/ui (Radix)
- React Router 7
- TanStack Query 5
- React Hook Form + Zod
- Vitest + Testing Library

## Como rodar

A partir da raiz:

```bash
pnpm dev:frontend
```

O frontend lê `VITE_API_URL` do `.env` da raiz (via `envDir` no Vite).
Padrão: `http://localhost:3000/api`.

## Estrutura

```
src/
├── app/                 # app, router, providers
├── components/
│   ├── layout/          # shell da aplicação
│   └── ui/              # componentes shadcn
├── features/
│   ├── auth/            # README com o padrão de feature
│   └── chat/
├── lib/
│   ├── api-client.ts    # fetch tipado + ApiError
│   ├── env.ts           # VITE_API_URL validada com Zod
│   └── utils.ts         # cn()
├── test/                # setup do Vitest
└── main.tsx
```

## shadcn/ui

Componentes já instalados: `button`, `card`, `input`, `label`, `textarea`,
`skeleton`, `sonner`, `dropdown-menu`, `avatar` e `separator`.

Para adicionar outro, rode dentro de `frontend/`:

```bash
pnpm dlx shadcn@latest add dialog
```

O alias `@/` aponta para `src/`.

## Como adicionar uma feature

1. Crie `src/features/<nome>/` com `api/`, `components/` e `hooks/`.
2. Use os schemas de `@hackathon/contracts` para validar entradas.
3. Use `apiFetch` de `@/lib/api-client.ts` para chamar a API.
4. Registre a rota em `src/app/router.tsx`.
5. Adicione estados de loading, erro e vazio.

Regras: features não importam código interno de outras features; o compartilhado
fica em `components/`, `lib/` ou `packages/contracts`.

## O que ainda não existe

- Login e cadastro
- Tela de chat
- Rotas protegidas
- Contexto de autenticação
- Integração real com a API

Essas telas entram depois da definição do tema. A fundação e os componentes já
estão prontos.

## Testes

```bash
pnpm --filter @hackathon/frontend test
pnpm --filter @hackathon/frontend test:watch
pnpm --filter @hackathon/frontend build
```

O teste atual valida que o placeholder e os componentes shadcn renderizam.
