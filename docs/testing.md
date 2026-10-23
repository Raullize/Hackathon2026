# Testes

## Princípio

Teste prova comportamento, não plumbing. Um teste só é evidência se falhar
quando a regra de negócio for removida ou quebrada.

## Camadas

| Camada | Ferramenta | O que cobre |
| --- | --- | --- |
| Unitário backend | Jest | AuthService e ChatService |
| E2E backend | Jest + Supertest | health, auth, chat 401/200, validação Zod |
| Frontend | Vitest + Testing Library | render do placeholder e componentes shadcn |
| Smoke | Node + fetch | fluxo real health → auth → chat |

## Comandos

```bash
pnpm test                 # unitários backend + frontend
pnpm test:backend         # só Jest
pnpm test:e2e             # e2e da API
pnpm test:frontend        # só Vitest
pnpm --filter @hackathon/backend test -- --coverage
pnpm smoke                # requer API rodando
```

## Banco nos e2e

Os e2e usam o `DATABASE_URL` configurado. O seed cria o usuário demo, mas os
testes criam usuários com e-mail único para não depender de estado anterior.

Antes de rodar:

```bash
docker compose up -d db
pnpm db:deploy
```

## Gemini nos testes

- Unitários do `ChatService` usam mocks.
- E2E força `LLM_PROVIDER=mock` no setup.
- CI não precisa de `GEMINI_API_KEY`.
- O provider Gemini é testado por contrato, sem chamada real.

## Evidência de entrega

Ao fechar uma story, registrar em `docs/deliveries/`:

- comando exato;
- resultado (passou/falhou, contagem);
- cobertura relevante ao código alterado;
- link/ID do CI;
- o que não foi testado e por quê.

Cobertura global não substitui teste de comportamento.

## O que não testar agora

- Detalhes internos de componentes shadcn.
- Renderização trivial sem regra de negócio.
- Chamadas reais ao Gemini em CI.
- E2E de telas que ainda não existem.
