# @hackathon/contracts

Schemas Zod compartilhados entre `backend` e `frontend`. Esta é a fonte da
verdade dos formatos de entrada e saída da API.

## O que tem aqui

- `auth.ts`: cadastro, login, usuário público e resposta de autenticação.
- `chat.ts`: mensagens, request e response do chat.
- `common.ts`: envelope de erro e resposta de health.

## Build

O pacote é consumido pelo build (`dist/`), então rode antes de subir os apps:

```bash
pnpm --filter @hackathon/contracts build
```

Em desenvolvimento, `pnpm dev` na raiz já inicia o pacote em modo watch.

## Regra

Schemas de contrato ficam aqui, não duplicados em cada app. Tipos TypeScript
devem ser inferidos com `z.infer`, não escritos à mão.
