# ADR 0003 — Auth JWT simples

- **Status:** aceito
- **Data:** 2026-10-22

## Contexto

O hackathon precisa de login/cadastro funcionando rápido, com segurança
razoável, sem complexidade de refresh token ou OAuth.

## Decisão

- Um access token JWT com expiração de 8h.
- Senhas com Argon2id.
- Login devolve `accessToken` e seta cookie `HttpOnly`.
- O guard aceita `Authorization: Bearer` ou o cookie.
- Sem refresh token, roles ou verificação de e-mail.

## Consequências

- Fluxo simples de implementar e demonstrar no Swagger.
- Sessão expira em 8h; o usuário refaz login.
- Em produção, avaliar refresh token, rotação e revogação.
- O cookie usa `SameSite=Lax` e `Secure` quando `NODE_ENV=production`.
