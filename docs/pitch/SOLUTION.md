# Solução

> Detalhe técnico em [`dia-30-mvp-spec.md`](../spec-driven-development/dia-30-mvp-spec.md);
> operação nas unidades em [`OPERATIONS.md`](./OPERATIONS.md).
> `[SUPOSIÇÃO]` = inferência nossa. `[DECISÃO PENDENTE]` = o time ainda precisa decidir.

## Proposta de valor

Para a navegadora da UBS e para a mulher com suspeita de câncer de mama, o Dia 30 é um
calendário compartilhado dos prazos de 30 e 60 dias da lei: mostra quem está perto de
vencer, avisa quem precisa agir antes do prazo estourar e diz à paciente o próximo
passo e os direitos dela.

## Como funciona

1. A UBS registra a suspeita (BI-RADS 4/5 ou suspeita clínica) e a data do pedido dos
   exames. Começa o prazo de 30 dias.
2. O caso vira um card verde, amarelo ou vermelho, na semana em que vence o prazo
   aberto. O silêncio também é alerta: etapa sem notícia deixa o caso amarelo.
3. O laudo chega em texto livre. A IA **sugere** um JSON (exame, resultado, data do
   laudo); a navegadora confere, edita e confirma. Só então o caso muda de estado.
4. Laudo maligno confirmado fecha o prazo de 30 dias (cumpriu ou não) e abre o de 60,
   contado da data do laudo. Laudo benigno fecha o caso e devolve a paciente à UBS.
5. A paciente recebe a mensagem do próximo passo (WhatsApp simulado) e vê o próprio
   caso num link só de leitura, sem a palavra "câncer".
6. Se o prazo aperta ou vence, o alerta sobe a escada: navegadora, regulação,
   coordenação e, em falta de vaga, a 2ª CRS.

## O que está implementado hoje

Conferir contra o repositório antes de subir ao palco; esta lista só vale para o que
estiver na `main`.

- **Base (starter, na `main`):** monorepo, contratos Zod, auth (cadastro/login/me/logout),
  chat com Gemini e fallback mock, health, Swagger, rate limit, testes e CI.
- **Especificação do Dia 30 (na `main`):** spec, requisitos RF-011 a RF-032, ADR 0006,
  plano da D30-001 e roteiro da demo.

## O que é roadmap/protótipo

- **Protótipo em construção (D30-001 a D30-006):** motor de prazos, API de casos e
  eventos, extração de laudo com confirmação, calendário, alertas, mensagens, link da
  paciente, métricas e seed. `[DADO FALTANDO]` Atualizar esta lista com o que estiver
  pronto quando o pitch começar.
- **Visão:** importação do SISCAN e do GERCON, WhatsApp real, acesso por papel, relógio
  real e outros tipos de câncer (`OPERATIONS.md`, seção 8).

## Diferenciais

- **Antecipa, não mede depois.** O aviso vem da conta das datas e dos prazos legais,
  não de um modelo de previsão. O Painel-Oncologia mede o atraso depois que ele
  aconteceu.
- **Cobre o trecho que ninguém mede:** começa na suspeita, não no laudo. O INCA mede a
  Lei dos 30 dias só da biópsia ao laudo.
- **IA sem clichê.** Não é chatbot: a IA estrutura o laudo e a navegadora confirma
  (human-in-the-loop). Filtro de CPF, CNS e nome antes de chamar o Gemini, e
  fallback para a regra local.
- **Um calendário para todos.** O mesmo prazo para UBS, regulação, hospital e
  paciente. Calendário, e não contador regressivo: dá previsibilidade em vez de
  ansiedade.
- **Posicionamento:** o e-SUS registra. O GERCON organiza a fila. A OCI paga o pacote.
  O Dia 30 cobra o prazo.

## Demo

Ver [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

## Ligação com o pitch

Este documento alimenta **Funcionalidade**, **Inovação** e **Apresentação**.
