# CareFlow — Backend

API NestJS do CareFlow: autenticação JWT, casos, prazos, alertas, métricas,
extração assistida por IA e link público da paciente.

## Stack

- NestJS 11 + TypeScript
- Prisma 6 + PostgreSQL 17
- Zod + `nestjs-zod` (sem class-validator nos DTOs)
- JWT (`@nestjs/jwt`), Argon2id
- Swagger
- Gemini via `@google/genai`, com fallback para a regra local
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
| `pnpm db:seed` | Usuário demo + 11 casos fictícios |
| `pnpm db:studio` | Prisma Studio |

## Endpoints

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | não | Cria conta e devolve token |
| POST | `/api/auth/login` | não | Login e token |
| GET | `/api/auth/me` | sim | Usuário autenticado |
| POST | `/api/auth/logout` | sim | Limpa cookie |
| GET | `/api/cases` | sim | Lista casos, com busca e paginação |
| POST | `/api/cases` | sim | Cria caso |
| GET | `/api/cases/:id` | sim | Detalhe e linha do tempo |
| POST | `/api/cases/:id/events` | sim | Registra evento |
| POST | `/api/cases/:id/report-extractions` | sim | Sugere campos do laudo |
| POST | `/api/cases/:id/access-tokens` | sim | Gera link da paciente |
| POST | `/api/case-intake/extractions` | sim | Sugere campos do pedido |
| GET | `/api/alerts` | sim | Alertas calculados na leitura |
| GET | `/api/metrics` | sim | Indicadores de prazo e qualidade |
| GET | `/api/public/p/:token` | não | Visão pública da paciente |
| GET | `/api/health` | não | Liveness |
| GET | `/api/health/ready` | não | Readiness + PostgreSQL |

Auth aceita `Authorization: Bearer <token>` ou o cookie `access_token`.

## Exemplos

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@careflow.dev","password":"demo1234"}'
```

Guarde o `accessToken` retornado.

### Casos

```bash
TOKEN="cole-o-token-aqui"

curl 'http://localhost:3000/api/cases?scope=open' \
  -H "Authorization: Bearer $TOKEN"

curl 'http://localhost:3000/api/cases?scope=closed&page=1&pageSize=8' \
  -H "Authorization: Bearer $TOKEN"
```

### Health

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/ready
```

## IA e Gemini

```env
LLM_PROVIDER=mock
# ou
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
REPORT_EXTRACTION_TIMEOUT_MS=8000
```

- Sem chave ou com `LLM_PROVIDER=mock`, a extração responde com `provider: "mock"`.
- Com Gemini, tenta o modelo configurado e, se ele não existir ou a chave não
  tiver permissão, tenta `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` e
  `gemini-2.5-flash-lite` em sequência.
- Em quota, timeout ou erro, cai para a regra local e registra um aviso sem expor
  a chave.
- A IA apenas sugere. A navegadora confirma o laudo e o intake.

## Estrutura

```
src/
├── alerts/          # alertas calculados na leitura
├── auth/            # controller, service, repositório, guard, DTOs
├── case-intake/     # extração do pedido
├── cases/           # casos, eventos, domínio de prazos
├── clock/           # relógio America/Sao_Paulo
├── common/          # filtro de exceção, decorators e tipos
├── config/          # validação de env com Zod
├── demo/            # relógio e seed fictício
├── health/          # liveness e readiness
├── metrics/         # indicadores
├── patient-access/  # link público e tokens
├── prisma/          # PrismaService global
├── report-extraction/ # extração e confirmação de laudo
├── app.module.ts
├── bootstrap.ts
└── main.ts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
test/               # e2e + setup + fixtures
```

## Decisões

- Validação de entrada é Zod, compartilhada via `@careflow/contracts`.
- Auth simples: um access token de 8h, sem refresh token.
- O domínio não importa Prisma: repositórios fazem a tradução.
- Erros seguem `{ statusCode, error, message, path, timestamp }`.
- Prazos, cores, alertas e métricas são calculados na leitura; não há cron.

## Troubleshooting

- **401 em rotas autenticadas:** confira o header `Authorization` e se o token
  não expirou.
- **Banco indisponível:** `docker compose ps` e `docker compose logs db`.
- **Migration pendente:** `pnpm db:deploy`.
- **Modelo 404:** troque `GEMINI_MODEL` ou deixe o fallback agir.
