# @careflow/contracts (CareFlow)

Schemas Zod compartilhados entre `backend` e `frontend`. Esta é a fonte da
verdade dos formatos de entrada e saída da API.

## O que tem aqui

- `auth.ts`: cadastro, login, usuário público e resposta de autenticação.
- `common.ts`: envelope de erro e resposta de health.
- `cases.ts`: casos, eventos, alertas, métricas, link público e paginação.

## Build

O pacote é consumido pelo build (`dist/`), então rode antes de subir os apps:

```bash
pnpm --filter @careflow/contracts build
```

O `pnpm dev` da raiz faz o build inicial dos contratos. Para alterar schemas
com rebuild contínuo, rode `pnpm --filter @careflow/contracts dev` em paralelo.

## Regra

Schemas de contrato ficam aqui, não duplicados em cada app. Tipos TypeScript
devem ser inferidos com `z.infer`, não escritos à mão.
