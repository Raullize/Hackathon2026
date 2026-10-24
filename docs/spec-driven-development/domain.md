# Domínio — CareFlow (Dia 30)

> **Contexto do projeto.** Recorte escolhido pelo time em 23/10/2026 para o tema
> [Saúde Conectada 2026](../tema-saude-conectada.md). Os números e as fontes estão em
> [`pitch/EVIDENCE.md`](../pitch/EVIDENCE.md); a operação nas unidades, em
> [`pitch/OPERATIONS.md`](../pitch/OPERATIONS.md).
> `[SUPOSIÇÃO]` = inferência nossa. `[DECISÃO PENDENTE]` = o time ainda precisa decidir.

## Em uma frase

O CareFlow organiza, num calendário compartilhado, os prazos legais de cada pessoa com
suspeita de câncer, da UBS ao início do tratamento, e avisa quem precisa agir antes
do prazo vencer. Linha piloto: **câncer de mama**. O motor de prazos serve para
qualquer câncer.

**Enquadramento:** a navegadora já existe por lei (Lei 14.758/2023, art. 13; Lei
14.450/2022; Portaria GM/MS 6.592/2025). O problema não é criar a função, é dar a ela
uma ferramenta. O CareFlow é essa ferramenta.

> "A lei criou a navegadora. Ninguém deu a ela uma ferramenta. O CareFlow é a
> ferramenta."

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

- **Calendário (Kanban) da navegadora:** cada paciente é um card verde, amarelo ou
  vermelho, na semana em que vence o próximo prazo legal.
- **Por que calendário e não relógio:** um contador regressivo foca na urgência de
  forma abstrata e gera ansiedade. Um calendário dá previsibilidade, ajuda a planejar
  e se encaixa no trabalho real da navegação.
- **O médico fica fora do CareFlow:** ele pede o exame pelo caminho de sempre (e-SUS PEC,
  requisição do SISCAN, papel). Nada muda na rotina dele: **zero trabalho novo para o
  médico**. A navegadora é a única usuária do CareFlow.
- **Paciente por SMS e e-mail:** mensagens claras sobre o prazo, o próximo passo e os
  direitos. Exemplo: "Dia 18 de 30. Próximo passo: biópsia em 25/10."
  - **Escopo atual:** SMS e e-mail. O envio é simulado na demo.
  - **Pitch/visão:** integração direta por WhatsApp, SMS e e-mail. **WhatsApp não está
    implementado nesta fase**; ele é apresentado como roadmap, não como entrega.
- **IA sem clichê (não é chatbot):** nos bastidores, a IA lê o laudo em texto livre
  (por exemplo, o resultado da biópsia) e **sugere** um JSON estruturado. A navegadora
  confere e confirma; só então o sistema muda o estado do caso e dispara os alertas.
- **Antecipa o atraso, em vez de medir depois:** a ferramenta acompanha suspeita →
  exame → laudo → tratamento e avisa os responsáveis antes do vencimento. O aviso vem
  da conta das datas e dos prazos legais.

> [!WARNING]
> **Laudo enviado para IA externa.** O laudo é dado pessoal sensível de saúde (LGPD,
> art. 11). Mandar o texto para um provedor de IA externo (hoje, o Gemini) é
> compartilhar esse dado com terceiro.
>
> - Na demo: **só laudos fictícios**.
> - Antes de usar com paciente real: tirar nome, CPF/CNS e outros identificadores do
>   texto antes do envio, ou usar um provedor com contrato que cubra dado de saúde
>   `[DECISÃO PENDENTE]`.
> - A IA só sugere; a navegadora confirma.

## Público

Personas de trabalho, a validar na entrevista (regulamento, item 6.4).

| Persona | Contexto | Dor principal | O que precisa |
| --- | --- | --- | --- |
| **Navegadora** | Função já prevista em lei; acompanha as pessoas com suspeita de câncer do município. **Única usuária com login.** | Não vê onde cada caso travou e descobre o atraso tarde | Uma ferramenta para ver, na semana, quem está perto do prazo, lançar eventos e cobrar o próximo passo |
| Médico assistente | Pede o exame pelo caminho de sempre (e-SUS PEC, SISCAN, papel); **não usa o CareFlow** | Já tem trabalho suficiente; não quer mais uma ferramenta | **Zero trabalho novo**: nada muda na rotina dele |
| Equipe da UBS | Recebe a mulher de volta e faz busca ativa quando a navegadora aciona; **não registra no CareFlow** | Perde o seguimento quando a informação não volta | Ser acionada pela navegadora e receber a paciente com o próximo passo claro |
| Paciente | Saiu da UBS com uma suspeita (por exemplo, mamografia BI-RADS 4 ou 5) | Espera sem informação e não conhece os direitos | **Só recebe**: mensagem e link de leitura; não envia nada |
| Gestor municipal e regulação | Respondem pelos prazos legais e pela fila | Só veem o atraso meses depois, no faturamento | Receber alerta e cobrança da navegadora; **não operam o sistema** |
| Prestador e hospital | Fazem exames, laudos e tratamento | O retorno não chega à UBS | **Não têm conta no CareFlow**: a navegadora lança os eventos e cobra o retorno |

## Porta de entrada do caso

O médico **não precisa avisar a navegadora** e não registra nada. A navegadora fica
sabendo do caso por fontes que já existem:

1. **Fila da regulação (GERCON/SISREG):** por onde passa o pedido de biópsia ou de
   consulta especializada. `[SUPOSIÇÃO: confirmar na entrevista]`
2. **SISCAN, módulo Seguimento:** lista mulheres com exame alterado de mama
   (BI-RADS 4/5), com atualização mensal; funciona como rede de segurança.
3. **Resultados BI-RADS 4/5 enviados pelos prestadores à UBS:** modelo de Porto
   Alegre, descrito em `pitch/EVIDENCE.md`, seção 8.

A navegadora confere a fonte, cadastra o caso e começa a cobrar o próximo passo. O
funcionamento em Charqueadas ainda precisa ser confirmado na entrevista
`[SUPOSIÇÃO: confirmar na entrevista]`.

No futuro, a importação do SISCAN e da RNDS (FHIR) reduz a digitação; o médico
continua sem trabalho novo.

### Protocolo de entrada da UBS

O canal pode variar por UBS/região; o protocolo não.

| Item | Regra do piloto |
| --- | --- |
| Canal principal | E-mail institucional (recomendado) ou WhatsApp institucional |
| Quem envia | Recepção/administração da UBS, com substituto definido |
| Prazo | Pedido até 14h → envio até 17h do mesmo dia útil; depois disso → próximo dia útil até 10h |
| Conferência | Navegadora olha a caixa 2× por dia |
| Formato | Assunto e campos padrão: paciente, CNS, data do pedido, gatilho, exame e UBS |
| Fallback | Fila da regulação, lista de BI-RADS 4/5 do prestador e SISCAN |
| Registro | `source` do caso e data de recebimento |

**A regulação agenda. A navegadora registra o evento, acompanha e cobra o próximo
passo quando necessário. O CareFlow não é um sistema de agendamento; é o relógio que
prova se a data combinada está sendo cumprida.**

### Cobrança e notificação

- **Cobrança interna:** navegadora → UBS, regulação e prestador, por ligação, e-mail
  ou WhatsApp institucional. SMS não é o canal natural para profissionais.
- **Notificação da paciente:** SMS e e-mail, simulados no MVP; WhatsApp é visão.
- **No MVP:** nenhum canal externo envia de verdade. A interface mostra a prévia e
  registra a ação; a ligação é manual e real.
- **Registro:** `CONTACT_LOGGED` com canal, observação e horário; não muda estado nem
  zera o silêncio.

## Fluxo principal (MVP)

1. A navegadora registra a suspeita a partir da porta de entrada: gatilho (mamografia
   BI-RADS 4/5 ou suspeita clínica) e data do pedido dos exames. Ela pode colar o texto
   do pedido; a IA pré-preenche `requestedAt`, gatilho e exame, e ela confirma. Começa
   o prazo de 30 dias. O médico não precisa avisar. PDF é interface no MVP; só texto é
   funcional.
2. O caso vira um card no calendário, na semana do vencimento, com a cor do risco.
3. A navegadora lança cada etapa quando fica sabendo (exame agendado, exame feito,
   laudo pronto); o card e o próximo passo são atualizados.
4. O laudo chega em texto livre. A IA sugere um JSON (exame, resultado, malignidade,
   data do laudo), e a navegadora confere e confirma.
5. Com a confirmação: laudo maligno encerra o prazo de 30 dias (registrando se foi
   cumprido) e começa o de 60 dias, contado da data do laudo. Laudo benigno fecha o
   caso e devolve a paciente para a UBS.
6. A paciente recebe a mensagem do novo passo (SMS/e-mail simulados na demo; WhatsApp
   é visão de pitch, não integração atual).
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
- **A IA só sugere:** nenhum caso muda de estado pela leitura da IA sem a confirmação
  da navegadora.
- **`confidence` é heurística:** o Gemini não fornece uma probabilidade calibrada. O
  campo é um rótulo (`high|medium|low`) que serve para orientar a revisão humana e não
  decide nada sozinho.
- **Descoberta tardia:** se `CASE_CREATED.recordedAt > requestedAt + 30`, o caso entra
  vermelho com selo `LATE_ENTRY`, alerta imediato para coordenação e o prazo **não
  reinicia**.
- **Origem do caso:** todo `CASE_CREATED` registra `source` (`UBS_BRIDGE`,
  `REGULATION`, `SISCAN`, `PROVIDER` ou `OTHER`).
- **Cobrança registrada:** `CONTACT_LOGGED` guarda canal, nota e horário; não muda
  estado e não zera o silêncio.
- **Métricas de entrada:** tempo entre pedido e cadastro e % de casos com descoberta
  tardia.
- **Mensagens para a paciente não usam a palavra "câncer".**
- **Demo só com dados fictícios.**

## MVP proposto (24 h)

| Parte | Proposta | Situação no repositório |
| --- | --- | --- |
| Frontend (React) | Calendário com um card por paciente, na semana do vencimento, responsivo de 360px a 1440px | React + Vite + shadcn configurados, ainda sem telas |
| Backend (NestJS) | Motor de regras sem cron, clock derivado (ADR 0006): uma função pura calcula prazos, cores e alertas na leitura, e um `Clock` com deslocamento de demo simula a passagem dos dias | NestJS pronto. Sem dependência nova |
| IA | LLM recebe o laudo em texto livre e sugere um JSON; a navegadora confirma. `confidence` é rótulo heurístico, não probabilidade | Provedor Gemini com fallback mock já existe (ADR 0004) |
| Banco | PostgreSQL + Prisma (decidido) | Já configurado no starter, com migrations e CI |
| Paciente | Disparos de SMS e e-mail simulados; WhatsApp apenas na visão do pitch | Nada pronto |

## Fora de escopo do MVP

- Integração real com e-SUS, SISCAN, GERCON e RNDS (fases futuras em `OPERATIONS.md`).
- Envio real nesta demo. A integração real prevista é por **SMS e e-mail**.
- **WhatsApp:** não integrado; aparece apenas como visão/roadmap no pitch final, junto
  de SMS e e-mail.
- Agendar vagas: o CareFlow não cria vaga, mostra quem está perto do prazo.
- Dados reais de pacientes.

## Perguntas abertas

- `[DECISÃO PENDENTE]` **Laudo fora da demo:** anonimizar antes de enviar para a IA
  externa ou usar provedor com contrato para dado de saúde (ver o aviso na seção
  Solução).
- **Dia zero do prazo de 30 dias:** data do pedido dos exames ou da suspeita
  registrada? Combinar com a gestão.
- `[DADO FALTANDO]` Onde Charqueadas faz mamografia e biópsia hoje, quem exerce a
  navegação no município e como a navegadora fica sabendo dos casos.

## Decisões tomadas

| Data | Decisão | Motivo |
| --- | --- | --- |
| 23/10/2026 | Calendário (Kanban) em vez de relógio regressivo | Contador regressivo gera ansiedade; calendário dá previsibilidade |
| 23/10/2026 | Banco: PostgreSQL + Prisma | Já configurado no starter, com migrations e CI |
| 23/10/2026 | A IA só sugere; a navegadora confirma antes de o caso mudar de estado | Erro na leitura de um laudo de câncer é grave |
| 23/10/2026 | O CareFlow "antecipa" o atraso; não usar "preditivo" | O aviso vem da conta das datas, não de um modelo de previsão |
| 23/10/2026 | Não usar a frase "O SUS não tem relógio" | — |
| 23/10/2026 | Sem cron: clock derivado, com o estado calculado na leitura (ADR 0006) | Evita dependência nova, deixa a demo andar na hora e as regras testáveis com data fixa |

## Métricas de sucesso

- Percentual de casos com diagnóstico em até 30 dias.
- Percentual de casos com tratamento em até 60 dias (base: RS, 44,4% em mama,
  2020–2024).
- Percentual de casos sem informação (meta: zero; Porto Alegre teve 32% em 2024).
- Na demo: um caso fictício percorre o fluxo inteiro e o alerta chega antes do
  vencimento.
