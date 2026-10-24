# CareFlow — Frontend

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
2. Use os schemas de `@careflow/contracts` para validar entradas.
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

## Responsividade

A aplicação deve ser responsiva de **360px a 1440px**, em todos os fluxos:

- calendário vira lista vertical abaixo de 768px;
- link da paciente é mobile-first, em uma coluna, sem overflow horizontal;
- formulários, diálogos e detalhe empilham no celular;
- alvos de toque com pelo menos 44×44px;
- usar breakpoints do Tailwind, não largura fixa.

Validar em 360×640, 768×1024, 1280×800 e 1440×900.

## Testes

```bash
pnpm --filter @careflow/frontend test
pnpm --filter @careflow/frontend test:watch
pnpm --filter @careflow/frontend build
```

O teste atual valida que o placeholder e os componentes shadcn renderizam.
