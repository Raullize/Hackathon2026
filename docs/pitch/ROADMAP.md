# Roadmap

> Cada item está marcado como **implementado**, **protótipo** ou **visão**.
> Detalhe das histórias em [`KANBAN.md`](../backlog/KANBAN.md).

## Hoje (implementado, na `main`)

- **Implementado:** monorepo, contratos Zod e CI.
- **Implementado:** auth completa (cadastro/login/me/logout).
- **Implementado:** health, Swagger e testes.
- **Implementado (documentação):** spec do MVP do CareFlow, requisitos RF-011 a RF-035,
  ADR 0006 e roteiro da demo.

## Próximas 30 horas (evento)

Ordem dos PRs; cada um com testes escritos antes.

- **Protótipo (D30-001):** contratos Zod, modelo Prisma e `computeCaseStatus` com as
  regras de prazo.
- **Protótipo (D30-002):** API de casos e eventos, `Clock` e endpoints de demo.
- **Protótipo (D30-003):** `ReportExtractor` (mock, Gemini e filtro) e o fluxo de
  confirmação do laudo.
- **Protótipo (D30-007):** extração de intake do pedido (texto; PDF só UI).
- **Protótipo (D30-004):** telas de login, intake, calendário e detalhe do caso,
  responsivas de 360px a 1440px.
- **Protótipo (D30-005):** alertas, mensagens (SMS/e-mail; WhatsApp só visão), cobrança,
  link da paciente e Concluídos com as métricas.
- **Protótipo (D30-006):** seed, reset e roteiro da demo.
- Gravar o vídeo da demo e ensaiar o pitch.

Se o tempo apertar, corta-se nesta ordem: métricas, escada para os outros
destinatários, link público. Nunca se corta o calendário nem o fluxo
laudo → IA → confirmação.

`[DADO FALTANDO]` Atualizar este bloco com o que entrou na `main` até a hora do pitch.

## Próximos 30 dias

- **Visão:** piloto manual em Charqueadas com a navegadora (fase 1 de `OPERATIONS.md`).
- **Visão:** entrevistas com navegadora, regulação e gestor para validar prazos,
  limites do amarelo e quem paga.
- **Visão:** decidir a regra de LGPD para laudo real (anonimização ou provedor com
  contrato para dado de saúde).
- **Visão:** integração real de SMS e e-mail.
- **Visão:** deploy, observabilidade e custos.

## Próximos 90 dias

- **Visão:** importação dos laudos alterados do SISCAN e dos encaminhamentos do
  GERCON (fase 2) `[SUPOSIÇÃO: viabilidade a confirmar]`.
- **Visão:** integração com WhatsApp, além de SMS e e-mail.
- **Visão:** outros tipos de câncer com o mesmo motor de prazos.
- **Visão:** modelo de negócio validado com usuários.
- **Visão:** RNDS em HL7 FHIR, via Portal de Serviços do DATASUS, com credenciamento
  do estabelecimento. `[DADO FALTANDO]` Modelo RNDS específico para laudo de mama ainda
  não confirmado; não prometer API do SISCAN ou do PEC.

## Visão

Uma rede em que a navegadora vê o prazo de cada pessoa com suspeita de câncer e a
paciente tem um link de leitura do próprio caso, com troca de eventos pela RNDS (fase
3). Isso é visão, não entrega.

## Regra de honestidade

Cada item deve estar marcado como **implementado**, **protótipo** ou **visão**.
