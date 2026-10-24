# Feature: auth

## Status

Placeholder de arquitetura. Nenhuma tela ou integração foi implementada de
propósito.

## Quando implementar

1. Crie `api/` com chamadas usando `apiFetch` de `@/lib/api-client`.
2. Reutilize os schemas de `@careflow/contracts` com React Hook Form + Zod.
3. Crie `components/` para formulários e `hooks/` para mutations/queries.
4. Adicione as rotas em `src/app/router.tsx` e proteja rotas privadas.

## Regras

- Não importe código interno de outra feature; use contratos ou `lib/`.
- Token/cookie é responsabilidade da camada de API, não dos componentes.
- Toda tela deve ter estados de loading, erro e vazio.
