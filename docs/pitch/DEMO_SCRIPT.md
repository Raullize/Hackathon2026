# Roteiro da demo — 5 minutos

## Regra

Nunca apresentar como implementado algo que é roadmap. Separar claramente
“Hoje” de “Visão”.

## Estrutura

| Tempo | Bloco | O que mostrar |
| --- | --- | --- |
| 0:00–0:30 | Problema | Público, dor e evidência |
| 0:30–1:00 | Solução | Proposta de valor em uma frase |
| 1:00–2:30 | Demo | Login, chat autenticado e fallback |
| 2:30–3:15 | Arquitetura | Stack, auth, Gemini e qualidade |
| 3:15–4:15 | Impacto e negócio | Beneficiários, métricas e receita |
| 4:15–4:45 | Roadmap | Hoje vs. próximos 30/90 dias |
| 4:45–5:00 | Fechamento | Time e pedido |

## Caminho técnico atual

1. `GET /api/health/ready` — banco up.
2. Login com `demo@hackathon.dev` / `demo1234`.
3. `POST /api/chat` sem token — mostrar 401.
4. `POST /api/chat` com token — mostrar 200 e `provider`.
5. Abrir Swagger em `/docs` e mostrar os schemas.

Detalhes em [`../demo-runbook.md`](../demo-runbook.md).

## Plano B

- `LLM_PROVIDER=mock`.
- Vídeo gravado.
- Slides em PDF.
- Swagger + testes verdes.

## Perguntas prováveis

- O que funciona de verdade hoje?
- O que é mock?
- Como o Gemini é protegido?
- Qual o custo por usuário?
- O que vocês fariam com mais 30 dias?

## O que não dizer

- “Está tudo pronto” quando parte é roadmap.
- Métricas sem fonte.
- “Usamos IA” sem explicar o fluxo e os limites.
