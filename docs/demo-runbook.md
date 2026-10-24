# Runbook da demo

Procedimento operacional para a apresentação de 5 minutos. A demo não deve
depender de internet, do Gemini ou de dados criados na hora.

## Pré-demo (30 min antes)

- [ ] `pnpm setup` já executado e `.env` presente.
- [ ] `docker compose up -d db` e `docker compose ps` com `healthy`.
- [ ] `pnpm build` verde.
- [ ] `pnpm test` e `pnpm test:e2e` verdes.
- [ ] API sobe com `pnpm dev:backend`.
- [ ] `curl http://localhost:3000/api/health/ready` retorna `database: "up"`.
- [ ] Login seed funciona: `demo@careflow.dev` / `demo1234`.
- [ ] Chat autenticado responde. Se Gemini falhar, `provider: "mock"` é aceitável.
- [ ] Swagger abre em `http://localhost:3000/docs`.
- [ ] Mensagens de **SMS/e-mail** aparecem simuladas na tela; WhatsApp é apenas visão.
- [ ] Layout testado em desktop e em 360px de largura, sem overflow horizontal.
- [ ] Vídeo de backup gravado e slides em PDF.
- [ ] Notebook carregado; hotspot de celular como plano B.

## Roteiro técnico (API)

### 1. Health

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/ready
```

### 2. Login

```bash
LOGIN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@careflow.dev","password":"demo1234"}')

TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).accessToken)" "$LOGIN")
```

### 3. Chat sem token

```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"oi"}]}'
```

Esperado: `401`. Esse é o ponto de autenticação obrigatória.

### 4. Chat autenticado

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"Explique o fluxo de auth em 2 frases."}]}'
```

Esperado: `200` com `message` e `provider`.

### 5. Swagger

Abrir `/docs`, mostrar os endpoints, o Bearer auth e os schemas Zod. Não é
preciso executar tudo ao vivo.

## Alternância Gemini/mock

No `.env`:

```env
LLM_PROVIDER=mock
# ou
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
```

Reinicie a API após alterar. O mock é o plano B oficial; ele não é uma falha da
demo.

## Reset do banco

```bash
docker compose down -v
docker compose up -d db
pnpm db:deploy
pnpm db:seed
```

Isso apaga dados locais. Não usar em produção.

## Erros comuns

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| `401` no chat | sem token ou token expirado | refazer login |
| `503` no ready | PostgreSQL fora | `docker compose ps` e logs |
| Chat sempre mock | sem chave, provider mock ou quota | conferir `.env` e logs |
| `404` do Gemini | modelo indisponível para a chave | deixar fallback ou trocar `GEMINI_MODEL` |
| Porta 5432 ocupada | outro Postgres local | usar `POSTGRES_PORT=55432` |
| Migration pendente | banco novo | `pnpm db:deploy` |

## Plano B

1. Usar `LLM_PROVIDER=mock` e assumir no pitch que a demo é offline.
2. Rodar o vídeo de backup.
3. Mostrar Swagger e os testes verdes.
4. Apresentar mockups/roadmap, deixando claro o que é visão e o que é implementado.
