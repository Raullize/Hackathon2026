# Feature: chat

## Status

Placeholder de arquitetura. Nenhuma tela ou integração foi implementada de
propósito.

## Quando implementar

1. Use `POST /api/chat` via `apiFetch`; o endpoint exige autenticação.
2. Envie `messages` no formato definido em `@hackathon/contracts`.
3. Trate `provider: "mock"` como resposta válida para demo/offline.
4. Adicione a rota em `src/app/router.tsx` dentro da área autenticada.

## Regras

- Não chame o Gemini direto no browser; a chave fica só no backend.
- Mostre estados de carregamento, erro e resposta vazia.
- Não registre o conteúdo das mensagens em logs de produção.
