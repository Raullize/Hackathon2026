# Solução

> Detalhe técnico em [`dia-30-mvp-spec.md`](../spec-driven-development/dia-30-mvp-spec.md);
> operação nas unidades em [`OPERATIONS.md`](./OPERATIONS.md).
> `[SUPOSIÇÃO]` = inferência nossa. `[DECISÃO PENDENTE]` = o time ainda precisa decidir.

## Proposta de valor

Para a navegadora e para a mulher com suspeita de câncer de mama, o CareFlow é um
calendário compartilhado dos prazos de 30 e 60 dias da lei: mostra quem está perto de
vencer, avisa quem precisa agir antes do prazo estourar e diz à paciente o próximo
passo e os direitos dela.

A navegadora **já existe por lei** (Lei 14.758/2023, art. 13; Lei 14.450/2022;
Portaria GM/MS 6.592/2025). O problema não é criar a função, é dar a ela uma
ferramenta. O médico **fica fora do CareFlow** e pede o exame pelo caminho de sempre:
**zero trabalho novo para o médico**.

> "A lei criou a navegadora. Ninguém deu a ela uma ferramenta. O CareFlow é a
> ferramenta."

## Como funciona

1. A **navegadora** registra a suspeita (BI-RADS 4/5 ou suspeita clínica) e a data do
   pedido dos exames, a partir da fila da regulação, do SISCAN ou do resultado que
   chega à UBS. O médico não precisa avisar. Começa o prazo de 30 dias.
2. O caso vira um card verde, amarelo ou vermelho, na semana em que vence o prazo
   aberto. O silêncio também é alerta: etapa sem notícia deixa o caso amarelo.
3. O laudo chega em texto livre. A IA **sugere** um JSON (exame, resultado, data do
   laudo); a navegadora confere, edita e confirma. Só então o caso muda de estado.
4. Laudo maligno confirmado fecha o prazo de 30 dias (cumpriu ou não) e abre o de 60,
   contado da data do laudo. Laudo benigno fecha o caso e devolve a paciente à UBS.
5. A paciente **só recebe**: mensagem simulada de SMS/e-mail e um link de leitura, sem
   a palavra "câncer". Ela não envia nada. O WhatsApp é visão de pitch, não integração
   atual.
6. Se o prazo aperta ou vence, o alerta sobe a escada para a navegadora, a regulação,
   a coordenação e, em falta de vaga, a 2ª CRS. Esses destinatários **não registram
   nada** no sistema; a navegadora cobra cada um por ligação, e-mail ou WhatsApp
   institucional. No MVP, os canais são simulados; a ligação é real.
7. Se o caso for cadastrado depois de `requestedAt + 30`, entra vermelho com o selo
   **“Descoberta tardia”**; o prazo não reinicia e a coordenação é alertada.

## O que está implementado hoje

Conferir contra o repositório antes de subir ao palco; esta lista só vale para o que
estiver na `main`.

- **Base (starter, na `main`):** monorepo, contratos Zod, auth (cadastro/login/me/logout),
  chat com Gemini e fallback mock, health, Swagger, rate limit, testes e CI.
- **Especificação do CareFlow (na `main`):** spec, requisitos RF-011 a RF-035, ADR 0006,
  plano da D30-001 e roteiro da demo.

## O que é roadmap/protótipo

- **Protótipo em construção (D30-001 a D30-007):** motor de prazos, API de casos e
  eventos, intake, extração de laudo com confirmação, calendário, alertas, mensagens,
  cobrança, link da paciente, métricas e seed. `[DADO FALTANDO]` Atualizar esta lista com o que estiver
  pronto quando o pitch começar.
- **Visão:** importação do SISCAN e do GERCON, envio real de SMS/e-mail, WhatsApp como
  visão, relógio real e outros tipos de câncer (`OPERATIONS.md`, seção 8).
- **Visão de interoperabilidade:** RNDS em HL7 FHIR, via Portal de Serviços do DATASUS,
  com credenciamento do estabelecimento. `[DADO FALTANDO]` Não há modelo RNDS
  específico confirmado para laudo de mamografia/anatomopatológico; não prometer API do
  SISCAN ou do PEC (o LEDI do e-SUS é só envio ao SISAB).

## Diferenciais

- **Antecipa, não mede depois.** O aviso vem da conta das datas e dos prazos legais,
  não de um modelo de previsão. O Painel-Oncologia mede o atraso depois que ele
  aconteceu.
- **Cobre o trecho que ninguém mede:** começa na suspeita, não no laudo. O INCA mede a
  Lei dos 30 dias só da biópsia ao laudo.
- **IA sem clichê.** Não é chatbot: a IA estrutura o laudo e a navegadora confirma
  (human-in-the-loop). Filtro de CPF, CNS e nome antes de chamar o Gemini, e
  fallback para a regra local.
- **Um calendário para a navegadora.** Ela vê o prazo e cobra UBS, regulação e
  hospital; a paciente tem um link de leitura. Calendário, e não contador regressivo:
  dá previsibilidade em vez de ansiedade.
- **Zero trabalho novo para o médico.** Ele continua pedindo o exame pelo e-SUS PEC,
  SISCAN ou papel; a navegadora faz a ponte.
- **Responsivo de 360px a 1440px**, com calendário em lista no celular e link da
  paciente mobile-first.
- **Posicionamento:** o e-SUS registra. O GERCON organiza a fila. A OCI paga o pacote.
  O CareFlow cobra o prazo.

## Demo

Ver [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) e o texto falado em
[`PITCH_SCRIPT.md`](./PITCH_SCRIPT.md).

## Ligação com o pitch

Este documento alimenta **Funcionalidade**, **Inovação** e **Apresentação**.
