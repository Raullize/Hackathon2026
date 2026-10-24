# CareFlow — Backend

API NestJS do starter: autenticação JWT, chat com Gemini, health checks e
Swagger.

## Stack

- NestJS 11 + TypeScript
- Prisma 6 + PostgreSQL 17
- Zod + `nestjs-zod` (sem class-validator nos DTOs)
- JWT (`@nestjs/jwt`), Argon2id
- Swagger
- Gemini via `@google/genai`, com mock fallback
- Jest + Supertest

## Como rodar

A partir da raiz:

```bash
pnpm setup
pnpm dev:backend
```

Ou manualmente:

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm --filter @careflow/contracts build
pnpm --filter @careflow/backend db:generate
pnpm --filter @careflow/backend db:deploy
pnpm --filter @careflow/backend db:seed
pnpm dev:backend
```

API: http://localhost:3000/api  
Swagger: http://localhost:3000/docs

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev:backend` | API em watch mode |
| `pnpm --filter @careflow/backend build` | Build |
| `pnpm --filter @careflow/backend test` | Unitários |
| `pnpm --filter @careflow/backend test:e2e` | E2E (precisa do banco) |
| `pnpm db:migrate` | Migration de desenvolvimento |
| `pnpm db:deploy` | Aplica migrations existentes |
| `pnpm db:seed` | Usuário demo |
| `pnpm db:studio` | Prisma Studio |

## Endpoints

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | não | Cria conta e devolve token |
| POST | `/api/auth/login` | não | Login e token |
| GET | `/api/auth/me` | sim | Usuário autenticado |
| POST | `/api/auth/logout` | sim | Limpa cookie |
| POST | `/api/chat` | sim | Chat com histórico |
| GET | `/api/health` | não | Liveness |
| GET | `/api/health/ready` | não | Readiness + PostgreSQL |

Auth aceita `Authorization: Bearer <token>` ou o cookie `access_token`.

## Exemplos

### Registrar

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo","email":"demo2@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@careflow.dev","password":"demo1234"}'
```

Guarde o `accessToken` retornado.

### Chat sem token (401)

```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"oi"}]}'
```

### Chat autenticado (200)

```bash
TOKEN="cole-o-token-aqui"

curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"Qual é o próximo passo?"}]}'
```

Limites: até 20 mensagens, 4.000 caracteres por mensagem e 16.000 no total.
O chat tem rate limit mais rígido que o restante da API.

### Health

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/ready
```

## Chat e Gemini

```env
LLM_PROVIDER=mock
# ou
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_MAX_OUTPUT_TOKENS=512
GEMINI_TEMPERATURE=0.7
LLM_TIMEOUT_MS=20000
```

- Sem chave ou com `LLM_PROVIDER=mock`, responde com `provider: "mock"`.
- Com Gemini, tenta o modelo configurado e, se ele não existir ou a chave não
  tiver permissão, tenta `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` e
  `gemini-2.5-flash-lite` em sequência.
- Em quota, timeout ou erro, cai para mock e registra um aviso sem expor a chave.
- O prompt genérico fica em `src/chat/prompts/system.md`.

## Estrutura

```
src/
├── auth/           # controller, service, repositório, guard, DTOs
├── chat/           # controller, service, providers, prompt
├── common/         # filtro de exceção, decorators e tipos
├── config/         # validação de env com Zod
├── health/         # liveness e readiness
├── prisma/         # PrismaService global
├── app.module.ts
├── bootstrap.ts
└── main.ts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
test/               # e2e + setup
```

## Decisões

- Validação de entrada é Zod, compartilhada via `@careflow/contracts`.
- Auth simples: um access token de 8h, sem refresh token.
- Chat stateless; não há tabela de conversa nesta fase.
- Erros seguem `{ statusCode, error, message, path, timestamp }`.
- O domínio não importa Prisma: repositórios fazem a tradução.

## Troubleshooting

- **401 no chat:** confira o header `Authorization` e se o token não expirou.
- **Banco indisponível:** `docker compose ps` e `docker compose logs db`.
- **Migration pendente:** `pnpm db:deploy`.
- **Modelo 404:** troque `GEMINI_MODEL` ou deixe o fallback agir.
