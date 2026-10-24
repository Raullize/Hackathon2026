# CareFlow — Frontend

Interface principal da navegadora: login, intake assistido, calendário de prazos e
detalhe do caso.

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
pnpm dev
```

O frontend abre em `http://localhost:5173` e usa o proxy do Vite para `/api` em
`http://localhost:3000`. O cookie de sessão fica no navegador.

## Rotas

| Rota | Tela |
| --- | --- |
| `/login` | Login da navegadora |
| `/` | Calendário de casos abertos |
| `/casos/novo` | Intake e cadastro |
| `/casos/:id` | Detalhe, timeline e ações |

## Estrutura

```
src/
├── app/                 # router, providers, rota protegida
├── components/
│   ├── layout/          # AppShell
│   └── ui/              # shadcn: button, card, input, select, dialog, etc.
├── features/
│   ├── auth/            # AuthProvider e login
│   └── cases/           # calendário, intake e detalhe
├── lib/                 # api-client, env, utils
└── test/                # setup do Vitest
```

## shadcn/ui

Componentes instalados: `button`, `card`, `input`, `label`, `textarea`, `skeleton`,
`sonner`, `dropdown-menu`, `avatar`, `separator`, `badge`, `select`, `dialog`,
`tabs`.

Para adicionar outro, rode em `frontend/`:

```bash
pnpm dlx shadcn@latest add dialog
```

## Testes

```bash
pnpm --filter @careflow/frontend test
pnpm --filter @careflow/frontend build
```

Os testes atuais cobrem o agrupamento do calendário e formatação de datas.
