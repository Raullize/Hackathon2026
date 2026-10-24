# Testes

## Princípio

Teste prova comportamento, não plumbing. Um teste só é evidência se falhar
quando a regra de negócio for removida ou quebrada.

## Camadas

| Camada | Ferramenta | O que cobre |
| --- | --- | --- |
| Unitário backend | Jest | domínio de prazos, casos, alertas, métricas, auth, demo e extrações |
| E2E backend | Jest + Supertest | health, auth, casos, eventos, alertas, métricas, paginação e link público |
| Frontend | Vitest + Testing Library | login, utilitários de calendário e interações de formulário |
| Smoke | Node + fetch | fluxo real health → auth → casos → alertas → métricas |

## Comandos

```bash
pnpm test                 # unitários backend + frontend
pnpm test:backend         # só Jest
pnpm test:e2e             # e2e da API
pnpm test:frontend        # só Vitest
pnpm --filter @careflow/backend test -- --coverage
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

- Unitários das extrações usam mocks, sem chamada real ao Gemini.
- E2E força `LLM_PROVIDER=mock` no setup.
- CI não precisa de `GEMINI_API_KEY`.
- O provider Gemini é testado por contrato, sem chamada real.
- `confidence` da extração é enum (`high|medium|low`), nunca número. O teste cobre
  também o rebaixamento quando o `evidenceQuote` não é literal.
- O Gemini não fornece confiança calibrada; logprobs não estão habilitados no
  `gemini-3.5-flash-lite` (teste de 2026-10-23 retornou 400). Não testar como
  probabilidade.
- Intake: texto sem PII, schema `caseIntakeSuggestionSchema` e confirmação humana; PDF
  não é extraído no MVP.
- `LATE_ENTRY`: caso cadastrado após `requestedAt + 30` recebe selo e não reinicia o
  prazo.
- `CONTACT_LOGGED`: canal do enum, não muda estado e não zera silêncio.

## Responsividade

- Testing Library cobre a troca de breakpoint por classe/estado.
- O layout real é validado no checklist manual: 360×640, 768×1024, 1280×800 e
  1440×900.
- Critérios: sem overflow horizontal fora da rolagem do calendário, alvos de toque
  com 44×44px e link da paciente em uma coluna no celular.

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
- E2E de browser/Playwright (validação visual é manual por enquanto).
