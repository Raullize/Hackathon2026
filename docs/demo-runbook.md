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
- [ ] `DEMO_MODE=true` no `.env` (nunca em produção) e API reiniciada.
- [ ] Login seed funciona: `demo@careflow.dev` / `demo1234`.
- [ ] Barra "Demo" aparece no calendário; se não aparecer, `/api/demo/status` está 404 (flag desligada).
- [ ] Extração de laudo ou intake responde com `provider: "mock"` ou `"gemini"`.
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

### 3. Casos sem token

```bash
curl -i 'http://localhost:3000/api/cases?scope=open'
```

Esperado: `401`.

### 4. Casos, alertas e métricas

```bash
curl 'http://localhost:3000/api/cases?scope=open' -H "Authorization: Bearer $TOKEN"
curl 'http://localhost:3000/api/alerts' -H "Authorization: Bearer $TOKEN"
curl 'http://localhost:3000/api/metrics' -H "Authorization: Bearer $TOKEN"
```

Esperado: `200` com 8 casos abertos, 8 alertas e os indicadores do dia.

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

## Reset da demo

Com `DEMO_MODE=true`, use a barra **Recarregar demo** no calendário ou:

```bash
curl -X POST http://localhost:3000/api/demo/reset \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: `201` com `{"cases":11}`. O reset zera o relógio, apaga casos,
eventos, laudos e links, e recarrega os 11 casos fictícios. O usuário de login
não é apagado.

Reset total do banco, só se o schema/seed de usuário estiver quebrado:

```bash
docker compose down -v
docker compose up -d db
pnpm db:deploy
pnpm db:seed
```

O `db:seed` agora também recarrega os 11 casos fictícios. Isso apaga dados
locais. Não usar em produção.

## Erros comuns

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| `401` nas rotas autenticadas | sem token ou token expirado | refazer login |
| Barra de demo não aparece | `DEMO_MODE=false` | ligar a flag no `.env` e reiniciar |
| `404` em `/api/demo/reset` | `DEMO_MODE=false` | ligar a flag; em produção é intencional |
| `503` no ready | PostgreSQL fora | `docker compose ps` e logs |
| Extração sempre mock | sem chave, provider mock ou quota | conferir `.env` e logs |
| `404` do Gemini | modelo indisponível para a chave | deixar fallback ou trocar `GEMINI_MODEL` |
| Porta 5432 ocupada | outro Postgres local | usar `POSTGRES_PORT=55432` |
| Migration pendente | banco novo | `pnpm db:deploy` |

## Plano B

1. Usar `LLM_PROVIDER=mock` e assumir no pitch que a demo é offline.
2. Rodar o vídeo de backup.
3. Mostrar Swagger e os testes verdes.
4. Apresentar mockups/roadmap, deixando claro o que é visão e o que é implementado.
