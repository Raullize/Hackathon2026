# Domínio — Dia 30

> **Contexto do projeto.** Recorte escolhido pelo time em 23/10/2026 para o tema
> [Saúde Conectada 2026](../tema-saude-conectada.md). Os números e as fontes estão em
> [`pitch/EVIDENCE.md`](../pitch/EVIDENCE.md); a operação nas unidades, em
> [`pitch/OPERATIONS.md`](../pitch/OPERATIONS.md).
> `[SUPOSIÇÃO]` = inferência nossa. `[DECISÃO PENDENTE]` = o time ainda precisa decidir.

## Em uma frase

O Dia 30 organiza, num calendário compartilhado, os prazos legais de cada pessoa com
suspeita de câncer, da UBS ao início do tratamento, e avisa quem precisa agir antes
do prazo vencer. Linha piloto: **câncer de mama**. O motor de prazos serve para
qualquer câncer.

## Problema

- **Qual problema:** a informação se perde nas transições de cuidado entre a UBS e o
  hospital. A lei dá 30 dias para os exames de diagnóstico e 60 dias para o primeiro
  tratamento, mas o SUS só descobre que o prazo estourou meses depois, analisando
  dados de faturamento. O atraso é medido depois que já aconteceu.
- **Quem sofre:** a mulher com suspeita de câncer de mama (e, no geral, quem tem
  suspeita de câncer); a equipe da UBS, que perde o seguimento; a regulação e o
  gestor municipal, que respondem pelos prazos (risco legal `[SUPOSIÇÃO]`).
- **Como é resolvido hoje:** o Painel-Oncologia é retroativo, começa a contar no
  laudo e usa sistemas com prazo de envio de até um ano. O SISCAN tem um módulo de
  seguimento mensal, feito para coordenadores. Porto Alegre mantém uma equipe de
  vigilância para as mamografias alteradas. Nas nossas buscas, nada conta o prazo da
  suspeita até o tratamento para todos verem (`EVIDENCE.md`, seção 8).
- **Evidência de que importa** (detalhes e fontes em `EVIDENCE.md`, seção 12):
  - RS: só **44,4%** das mulheres com câncer de mama começaram o tratamento em até
    60 dias (2020–2024). Paraná: 60,3% (INCA 2025) 🟢.
  - Brasil, 2024: **52,2%** passaram de 60 dias (INCA 2025) 🟢.
  - O INCA só mede a Lei dos 30 dias por um "indicador proxy": o tempo da biópsia ao
    laudo 🟢.
  - Porto Alegre, que monitora as mamografias alteradas: **32%** dos casos de mama
    sem informação de tempo até o tratamento (jan–ago/2024) 🟢.
  - RS: 1.536 mortes por câncer de mama em 2023, cerca de 4 por dia 🟢.

## Solução

- **Calendário (Kanban) para a UBS:** cada paciente é um card verde, amarelo ou
  vermelho, na semana em que vence o próximo prazo legal.
- **Por que calendário e não relógio:** um contador regressivo foca na urgência de
  forma abstrata e gera ansiedade. Um calendário dá previsibilidade, ajuda a planejar
  e se encaixa no trabalho real da UBS.
- **Paciente pelo WhatsApp:** mensagens claras sobre o prazo, o próximo passo e os
  direitos. Exemplo: "Dia 18 de 30. Próximo passo: biópsia em 25/10."
- **IA sem clichê (não é chatbot):** nos bastidores, a IA lê o laudo em texto livre
  (por exemplo, o resultado da biópsia) e devolve um JSON estruturado. Com isso, o
  sistema muda o estado do caso e dispara os alertas.
- **Avisar antes, não medir depois:** a ferramenta acompanha suspeita → exame → laudo
  → tratamento e avisa os responsáveis antes do vencimento.

## Público

Personas de trabalho, a validar na entrevista (regulamento, item 6.4).

| Persona | Contexto | Dor principal | O que precisa |
| --- | --- | --- | --- |
| Navegadora ou enfermeira da UBS/regulação | Acompanha as pessoas com suspeita de câncer do município | Não vê onde cada caso travou e descobre o atraso tarde | Ver, na semana, quem está perto do prazo e qual é o próximo passo |
| Paciente | Saiu da UBS com uma suspeita (por exemplo, mamografia BI-RADS 4 ou 5) | Espera sem informação e não conhece os direitos | Saber o próximo passo, a data e o prazo que a lei garante |
| Gestor municipal e regulação | Respondem pelos prazos legais do município | Só veem o atraso meses depois, no faturamento | Ver os casos em risco antes do vencimento e onde a rede trava |
| Prestador e hospital | Fazem exames, laudos e tratamento | O retorno não chega à UBS | Registrar etapas e laudos de forma simples |

## Fluxo principal (MVP)

1. A UBS registra a suspeita: gatilho (mamografia BI-RADS 4/5 ou suspeita clínica) e
   data do pedido dos exames. Começa o prazo de 30 dias.
2. O caso vira um card no calendário, na semana do vencimento, com a cor do risco.
3. Cada etapa concluída (exame agendado, exame feito, laudo pronto) atualiza o card e
   o próximo passo.
4. O laudo chega em texto livre. A IA devolve um JSON (exame, resultado, malignidade,
   data do laudo) e o sistema atualiza o caso.
5. Laudo maligno: encerra o prazo de 30 dias (registrando se foi cumprido) e começa o
   de 60 dias, contado da data do laudo. Laudo benigno: fecha o caso e devolve a
   paciente para a UBS.
6. A paciente recebe a mensagem do novo passo (WhatsApp simulado na demo).
7. Antes do vencimento, o alerta vai para quem precisa agir (escada de alerta em
   `OPERATIONS.md`).

## Regras de negócio

- **30 dias:** exames de diagnóstico quando a principal hipótese é câncer, contados do
  pedido fundamentado do médico (Lei 12.732/2012, art. 2º, § 3º, incluído pela Lei
  13.896/2019).
- **60 dias:** primeiro tratamento, contado do dia do laudo patológico (Lei
  12.732/2012, art. 2º). Conta como início a cirurgia ou o começo da radioterapia ou
  da quimioterapia.
- **Gatilho da linha de mama:** mamografia BI-RADS 4 ou 5 (critério da OCI 2 de mama)
  ou suspeita clínica (lista da OCI 1 de mama).
- **Cores:** verde (no prazo), amarelo (perto de vencer ou sem atualização), vermelho
  (vencido). Os limites do amarelo ainda serão definidos.
- **Silêncio é alerta:** etapa sem atualização vira amarelo, mesmo sem atraso
  confirmado.
- **Descartado também volta:** caso benigno fecha com o resultado e volta para a UBS.
- **Exceção com motivo:** recusa, ausência, contraindicação, pendência clínica,
  transporte ou falta de vaga ficam registrados e não escondem o atraso.
- **Mensagens para a paciente não usam a palavra "câncer".**
- **Demo só com dados fictícios.**

## MVP proposto (24 h)

| Parte | Proposta | Situação no repositório |
| --- | --- | --- |
| Frontend (React) | Calendário com um card por paciente, na semana do vencimento | React + Vite + shadcn configurados, ainda sem telas |
| Backend (NestJS) | Motor de regras. Cron jobs (`@nestjs/schedule`) varrem o banco, simulam a passagem dos dias na demo, calculam os prazos e mudam os status | NestJS pronto. `@nestjs/schedule` não está instalado: é dependência nova, pedir OK antes |
| IA | LLM recebe o laudo em texto livre e devolve JSON | Provedor Gemini com fallback mock já existe (ADR 0004) |
| Banco | A proposta cita SQLite | O starter usa PostgreSQL + Prisma, com migrations e CI `[DECISÃO PENDENTE]` |
| Paciente | Disparos de WhatsApp simulados | Nada pronto |

## Fora de escopo do MVP

- Integração real com e-SUS, SISCAN, GERCON e RNDS (fases futuras em `OPERATIONS.md`).
- Envio real de WhatsApp.
- Agendar vagas: o Dia 30 não cria vaga, mostra quem está perto do prazo.
- Dados reais de pacientes.

## Perguntas abertas

- `[DECISÃO PENDENTE]` **Banco:** a proposta cita SQLite, mas o starter já tem
  PostgreSQL + Prisma com migrations e CI. Recomendação: manter PostgreSQL e não
  refazer a base.
- `[DECISÃO PENDENTE]` **A IA decide sozinha?** A proposta muda o estado
  automaticamente quando a IA lê malignidade. Recomendação: a IA sugere e a
  navegadora confirma com um clique. Erro na leitura de um laudo de câncer é grave, e
  a banca vai perguntar.
- `[DECISÃO PENDENTE]` **Laudo em LLM externa:** é dado sensível de saúde (LGPD,
  art. 11). Na demo, só dados fictícios. Fora da demo, anonimizar ou ter contrato que
  cubra o dado.
- `[DECISÃO PENDENTE]` **"Preditivo":** hoje o alerta vem da conta das datas, não de
  um modelo de previsão. Ou o pitch diz "antecipa", ou o produto ganha algo de fato
  preditivo.
- `[DECISÃO PENDENTE]` **Frase do pitch:** "O SUS não tem relógio" continua boa com a
  interface de calendário?
- **Dia zero do prazo de 30 dias:** data do pedido dos exames ou da suspeita
  registrada? Combinar com a gestão.
- `[DADO FALTANDO]` Onde Charqueadas faz mamografia e biópsia hoje, e se tem
  navegadora.

## Métricas de sucesso

- Percentual de casos com diagnóstico em até 30 dias.
- Percentual de casos com tratamento em até 60 dias (base: RS, 44,4% em mama,
  2020–2024).
- Percentual de casos sem informação (meta: zero; Porto Alegre teve 32% em 2024).
- Na demo: um caso fictício percorre o fluxo inteiro e o alerta chega antes do
  vencimento.
