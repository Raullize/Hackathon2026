# Roteiro da demo — 5 minutos

## Regra

Nunca apresentar como implementado algo que é roadmap. Separar claramente
“Hoje” de “Visão”.

Tudo ao vivo; só o seed vem pronto. Personagem e dados são fictícios. Regras e
números do roteiro técnico em
[`../spec-driven-development/dia-30-mvp-spec.md`](../spec-driven-development/dia-30-mvp-spec.md),
seção 16.

`[DECISÃO PENDENTE]` Os 5 minutos são o pitch inteiro ou só a demo? A tabela abaixo
assume o pitch inteiro, com 3 minutos de demo.

## Estrutura

| Tempo | Bloco | O que mostrar |
| --- | --- | --- |
| 0:00–0:30 | Problema | "Em outubro, todo mundo pede a mamografia. O problema começa quando ela volta alterada." RS: só 44,4% das mulheres com câncer de mama começaram o tratamento em até 60 dias (INCA 2025) |
| 0:30–0:50 | Solução | "A lei dá 30 dias para diagnosticar e 60 para tratar. Mas ninguém tem um relógio." O Dia 30 antecipa o atraso num calendário compartilhado |
| 0:50–3:50 | Demo | Os 7 passos abaixo |
| 3:50–4:20 | Arquitetura e IA | A IA só sugere; a navegadora confirma. Filtro de identificadores, fallback para a regra local, sem cron |
| 4:20–4:45 | Impacto e roadmap | Métricas e "Hoje vs. Visão" |
| 4:45–5:00 | Fechamento | Time e pedido |

Frases e números: só os de [`EVIDENCE.md`](./EVIDENCE.md), seção 13, conferindo a
coluna de confiança.

## Antes de subir ao palco

1. `POST /api/demo/reset` (ou "Resetar" na barra de demo): seed recarregado e relógio
   zerado.
2. Conferir o dia da semana. Se a data simulada depois de "+7 dias" cair de segunda a
   quarta, o card de 60 dias da Maria não cai em "Depois" no passo 4 (spec, seção 20).
3. Login da navegadora aberto no calendário.
4. Segunda janela do navegador em modo celular, pronta para o link da paciente.
5. Laudo maligno fictício copiado (`backend/test/fixtures/reports/`).
6. Decidir `LLM_PROVIDER`: Gemini se a rede estiver boa; `mock` se houver dúvida.

## Demo (3 minutos)

| # | Passo | O que dizer |
| --- | --- | --- |
| 1 | Calendário aberto. Card da Maria Fictícia da Silva (M.F.S.), BI-RADS 5: "Dia 18 de 30", verde, "Biópsia agendada · prazo 30d vence <data>" | "Cada card é uma mulher, na semana em que vence o prazo da lei." |
| 2 | "+7 dias". Maria: dia 25, faltam 5, amarelo. A biópsia passou sem registro: selos "Data passou sem registro" e "Sem notícia". O alerta chega à navegadora | "Ninguém avisou que a biópsia aconteceu. O Dia 30 percebe antes do prazo vencer." |
| 3 | A navegadora cola o laudo maligno. A IA sugere o JSON, com o selo "Gemini" ou "regra local". Ela corrige a data do laudo para hoje e confirma | "A IA só sugere. Quem confirma é a navegadora." |
| 4 | "30 dias: cumpriu". O card de 60 dias cai na coluna "Depois", porque o laudo é de hoje | "Previsibilidade: a equipe já sabe quando vence o próximo prazo." |
| 5 | A mensagem neutra aparece no simulador. Abrir o link da paciente na janela de celular | "A paciente vê o próximo passo e os direitos dela. Sem a palavra câncer." |
| 6 | Caso vermelho com exceção "falta de vaga": escada de alerta até a 2ª CRS | "A exceção não esconde o atraso. O alerta sobe até quem pode abrir vaga." |
| 7 | Aba "Concluídos" com "30 dias: cumpriu/não cumpriu" e as métricas | "É assim que o município mede, no dia, o que hoje só aparece meses depois." |

Detalhes de setup em [`../demo-runbook.md`](../demo-runbook.md).

## Plano B

- `LLM_PROVIDER=mock`, assumido em voz alta no pitch: "aqui a extração está na regra
  local". O selo "regra local" já mostra isso na tela.
- Vídeo gravado da demo inteira.
- `POST /api/demo/reset` antes de subir ao palco (e de novo, se algo der errado no
  meio).
- Slides em PDF.
- Swagger + testes verdes.

## Hoje vs. Visão

| Hoje (protótipo) | Visão (fases em `OPERATIONS.md`, seção 8) |
| --- | --- |
| Dados e laudos fictícios | Piloto manual em Charqueadas |
| A navegadora cadastra o caso e cola o laudo | Importação do SISCAN e do GERCON `[SUPOSIÇÃO: viabilidade a confirmar]` |
| WhatsApp simulado na tela | Envio real |
| Só a navegadora faz login; os outros papéis são destinatários de alerta | Acesso por papel (UBS, regulação, prestador, gestor) |
| Relógio de demo ("+1 dia", "+7 dias") | Relógio real |
| Linha piloto: câncer de mama | O mesmo relógio para outros cânceres |

## Perguntas prováveis

- O que funciona de verdade hoje?
- O que é mock?
- Como o Gemini é protegido? (Filtro de CPF, CNS e nome antes do envio; só laudo
  fictício na demo; a IA só sugere.)
- E se a IA errar o laudo? (A navegadora confere e edita antes de confirmar.)
- O Dia 30 cria vaga? (Não. Mostra quem está mais perto do prazo e gera a prova para
  pedir a vaga.)
- Qual o custo por usuário?
- O que vocês fariam com mais 30 dias?

Respostas curtas em [`OPERATIONS.md`](./OPERATIONS.md), seção 9.

## O que não dizer

- “Está tudo pronto” quando parte é roadmap.
- Métricas sem fonte.
- “Usamos IA” sem explicar o fluxo e os limites.
- "Preditivo": o Dia 30 **antecipa**; o aviso vem da conta das datas.
- "O SUS não tem relógio".
- Comparar o "% sem informação" da demo com os 32% de Porto Alegre como se fossem a
  mesma medida.
