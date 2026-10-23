# Hackathon 2026 — Starter

Template full-stack para chegar no evento com o ambiente pronto e gastar o
tempo no tema, não em boilerplate.

## Stack

- **Backend:** NestJS 11, TypeScript, Prisma 6, PostgreSQL 17, Zod, JWT, Swagger.
- **Frontend:** React 19, Vite 8, TypeScript, Tailwind 4, shadcn/ui, React Router, TanStack Query.
- **IA:** Gemini via `@google/genai`, com fallback mock para demo/offline.
- **Infra local:** Docker Compose apenas para o PostgreSQL.
- **Qualidade:** Jest + Supertest, Vitest + Testing Library, ESLint e GitHub Actions.

## Estrutura

```
backend/               API NestJS
frontend/              arquitetura React + shadcn, sem telas de produto
packages/contracts/    schemas Zod compartilhados
docs/                  arquitetura, requisitos, kanban, ADRs, pitch e delivery
scripts/               setup e smoke test
compose.yml            PostgreSQL de desenvolvimento
```

## Pré-requisitos

- Node.js 24
- pnpm 11
- Docker com Compose

## Quickstart

```bash
pnpm setup
pnpm dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs
- Frontend: http://localhost:5173
- Login seed: `demo@hackathon.dev` / `demo1234`

O `pnpm setup` cria `.env` a partir de `.env.example`, sobe o PostgreSQL, instala
dependências, aplica migrations, roda o seed e gera o Prisma Client.

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm setup` | Prepara o ambiente do zero |
| `pnpm dev` | Contracts + backend + frontend em paralelo |
| `pnpm dev:backend` | Só a API |
| `pnpm dev:frontend` | Só o frontend |
| `pnpm build` | Build de contracts, backend e frontend |
| `pnpm lint` | ESLint em backend, frontend, contracts e scripts |
| `pnpm typecheck` | TypeScript em todos os pacotes |
| `pnpm test` | Testes unitários de backend e frontend |
| `pnpm test:e2e` | Testes e2e da API com PostgreSQL |
| `pnpm smoke` | Smoke test com a API rodando |
| `pnpm db:migrate` | Cria/aplica migration em desenvolvimento |
| `pnpm db:deploy` | Aplica migrations existentes |
| `pnpm db:seed` | Roda o seed de demonstração |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm docker:up` | Sobe só o PostgreSQL |
| `pnpm docker:down` | Derruba os containers |

## Auth e chat

- `POST /api/auth/register` — cria conta e devolve `accessToken`.
- `POST /api/auth/login` — autentica e devolve `accessToken`.
- `GET /api/auth/me` — requer Bearer ou cookie `access_token`.
- `POST /api/auth/logout` — limpa o cookie.
- `POST /api/chat` — **requer autenticação**; sem token retorna `401`.
- `GET /api/health` e `GET /api/health/ready` — liveness e readiness.

O chat é stateless: o cliente envia o histórico em `messages`. O backend usa
Gemini quando `LLM_PROVIDER=gemini` e há `GEMINI_API_KEY`; em falha, quota ou
modelo indisponível, responde com mock.

## Gemini

O padrão é `LLM_PROVIDER=mock`, então o projeto funciona sem chave. Para usar o
modelo real:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=sua-chave
GEMINI_MODEL=gemini-3.5-flash-lite
```

O `gemini-3.5-flash-lite` é o modelo mais barato disponível para chaves novas
no momento. O `gemini-2.5-flash-lite` é mais barato no papel, mas pode retornar
404 para projetos novos; o backend tenta `gemini-3.5-flash-lite`,
`gemini-3.1-flash-lite` e `gemini-2.5-flash-lite` em sequência. O free tier tem
limites variáveis; falhas de quota caem para mock.

## Documentação

- [`docs/README.md`](docs/README.md) — índice.
- [`docs/architecture.md`](docs/architecture.md) — arquitetura e fluxos.
- [`docs/testing.md`](docs/testing.md) — estratégia de testes.
- [`docs/demo-runbook.md`](docs/demo-runbook.md) — checklist de demo.
- [`backend/README.md`](backend/README.md) — API, endpoints e exemplos.
- [`frontend/README.md`](frontend/README.md) — arquitetura do frontend.
- [`packages/contracts/README.md`](packages/contracts/README.md) — contratos Zod.

## Segurança

- `.env` não é versionado; apenas `.env.example`.
- `GEMINI_API_KEY` fica no backend, nunca em variável `VITE_`.
- Senhas usam Argon2id.
- Auth com JWT de 8h, sem refresh token nesta fase.
- Rate limit global e limite mais rígido no chat.
- Logs não devem conter token, senha ou conteúdo de mensagem.

## Troubleshooting

**Porta 5432 ocupada:** o projeto usa `POSTGRES_PORT=55432` por padrão. Se
alterar, atualize `DATABASE_URL` e rode `docker compose up -d db`.

**`prisma migrate` falha:** confirme que o banco está saudável com
`docker compose ps` e que `.env` existe.

**Chat sempre em mock:** verifique `LLM_PROVIDER`, `GEMINI_API_KEY` e os logs do
backend. A resposta traz `provider: "mock"` quando o fallback foi usado.
