# ADR 0002 — NestJS 11, Prisma 6 e Zod

- **Status:** aceito
- **Data:** 2026-10-22

## Contexto

Precisamos de uma API madura, ORM produtivo e validação compartilhada com o
frontend. As versões mais novas do ecossistema ainda têm riscos de integração.

## Decisão

- NestJS **11.2.7** e `@nestjs/swagger` **11.4.7**.
- Prisma **6.19.3** (o Prisma 8 está em RC).
- Zod **4.6.7** com `nestjs-zod` **5.5.0**.
- TypeScript **5.9.3**.

## Motivos

- `nestjs-zod` declara suporte a Nest 10/11; a integração com Nest 12 ainda não
  está declarada.
- Prisma 6 é estável e tem o fluxo `prisma-client-js` conhecido.
- Zod permite compartilhar os schemas via `packages/contracts` e evita
  class-validator nos DTOs.

## Consequências

- Validação única no backend e no frontend.
- Swagger gerado a partir dos DTOs Zod.
- Versões pinadas para evitar surpresa no dia do evento.
- `class-validator`/`class-transformer` não são usados.
