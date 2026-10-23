# Requisitos não funcionais

## Segurança

- Senhas com Argon2id; nunca em texto puro ou log.
- JWT com segredo de no mínimo 32 caracteres; expiração de 8h.
- `GEMINI_API_KEY` somente no backend; nunca em `VITE_*`.
- `.env` fora do git; apenas `.env.example` versionado.
- Validação de entrada com Zod em auth e chat.
- Rate limit global e limite mais rígido no chat.
- Erros não expõem stack trace, token ou conteúdo de mensagem.
- Cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

## Confiabilidade

- `/health` para liveness, sem dependência.
- `/health/ready` verifica o PostgreSQL e retorna `503` se estiver fora.
- Chat cai para mock em falha do provedor, mantendo a demo viva.
- Timeout configurável para o Gemini (`LLM_TIMEOUT_MS`).

## Manutenibilidade

- Contratos Zod compartilhados em `packages/contracts`.
- Domínio não importa Prisma; repositórios fazem a tradução.
- Um módulo por responsabilidade: auth, chat, health, prisma.
- Testes unitários e e2e para os comportamentos críticos.
- CI com lint, typecheck, testes e build.

## Performance

- Chat limita histórico a 20 mensagens e 16.000 caracteres.
- `GEMINI_MAX_OUTPUT_TOKENS` padrão em 512 para controlar custo/latência.
- Frontend com build Vite e code splitting disponível quando houver telas.

## Desenvolvimento

- Node 24, pnpm 11 e Docker.
- `pnpm setup` idempotente.
- Comandos reais no README, sem dependência de passos manuais ocultos.
- Código e commits em inglês; docs e UI em português.
