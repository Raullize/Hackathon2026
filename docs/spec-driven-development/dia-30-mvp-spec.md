# Spec do MVP — Dia 30

> **Contexto.** Spec do MVP do Dia 30 para o hackathon Saúde Conectada 2026. O domínio
> está em [`domain.md`](./domain.md); os números e as fontes, em
> [`../pitch/EVIDENCE.md`](../pitch/EVIDENCE.md); a operação nas unidades, em
> [`../pitch/OPERATIONS.md`](../pitch/OPERATIONS.md). As decisões vêm da entrevista de
> 23/10/2026 (seção 22).
> `[SUPOSIÇÃO]` = inferência nossa. `[DADO FALTANDO]` = lacuna a fechar.
> `[DECISÃO PENDENTE]` = o time ainda precisa decidir. Quando há pendência, a spec
> escreve a opção mais conservadora, e é ela que vale até o time decidir.

## 1. Objetivo

Entregar, em 24 horas, um protótipo que conta os prazos legais de cada caso com
suspeita de câncer de mama:

- 30 dias do pedido dos exames até o laudo (Lei 12.732/2012, art. 2º, § 3º);
- 60 dias do laudo até o primeiro tratamento (Lei 12.732/2012, art. 2º).

Cada caso aparece como um card colorido num calendário, na semana em que vence o
prazo aberto. O protótipo avisa quem precisa agir antes do vencimento, usa a IA só
para **sugerir** a estrutura de um laudo em texto livre e mostra à paciente o próximo
passo e os direitos dela, sem a palavra "câncer".

A demo prova uma frase: **o Dia 30 antecipa o atraso, em vez de medir depois.** O
aviso vem da conta das datas, não de um modelo de previsão.

## 2. Escopo e fora de escopo

### Escopo

- Cadastro do caso pela navegadora, com dados fictícios. **A navegadora é a única
  usuária do sistema.** O médico não usa o Dia 30: ele pede o exame pelo caminho de
  sempre (e-SUS PEC, SISCAN, papel), com zero trabalho novo. A paciente só recebe
  mensagem e link de leitura.
- Motor de prazos: a função pura `computeCaseStatus(case, events, today)`, só no backend.
- Linha do tempo append-only (`CaseEvent`), com correção auditável.
- Calendário de 9 semanas, mais as colunas "Vencidos" e "Depois", a aba "Concluídos"
  e o detalhe do caso.
- Extração do laudo: a IA sugere, a navegadora edita e confirma.
- Alertas derivados na leitura, com a escada de destinatários.
- Simulador de mensagens nos canais SMS e e-mail: textos gerados por evento, sem envio
  real nesta fase.
- Link público da paciente, só leitura.
- Mini painel de métricas.
- Modo demo: relógio deslocável, reset e seed.

### Fora de escopo

- Integração com e-SUS, SISCAN, GERCON e RNDS (fases futuras em `OPERATIONS.md`).
  - **RNDS:** padrão HL7 FHIR, via Portal de Serviços do DATASUS; exige credenciamento
    do estabelecimento. `[DADO FALTANDO]` Modelo RNDS específico para laudo de mama
    ainda não confirmado.
  - **SISCAN e e-SUS PEC:** não há API pública de leitura confirmada; o LEDI do e-SUS
    é apenas de envio ao SISAB. Importação por relatório/exportação é
    `[SUPOSIÇÃO: viabilidade a confirmar]`.
- Envio real nesta demo. A integração real prevista é por **SMS e e-mail**.
- **WhatsApp:** não faz parte da integração implementada. Ele aparece apenas como
  **visão/roadmap** no pitch final, junto de SMS e e-mail.
- Roles e perfis: só a navegadora faz login. UBS, regulação, prestador, coordenação e
  2ª CRS aparecem apenas como **destinatários** dos alertas.
- Entidade `Patient` separada do caso `[DECISÃO PENDENTE: fase 1]`.
- Agendar vagas: o Dia 30 não cria vaga.
- Cron, filas e `@nestjs/schedule` (ADR 0006).
- Chatbot: a tela de chat (FEAT-002) sai do MVP. O produto não é chatbot; a IA
  estrutura laudos.
- Dados reais de pacientes e laudos reais.
- Playwright ou qualquer outra dependência nova de teste.

## 3. Glossário

| Termo | Significado |
| --- | --- |
| Caso (`Case`) | Uma pessoa com suspeita de câncer de mama, do pedido dos exames até o fechamento |
| Evento (`CaseEvent`) | Fato registrado na linha do tempo do caso. Append-only: nunca é editado nem apagado |
| Gatilho (`trigger`) | O que abriu o caso: `BIRADS_5`, `BIRADS_4` ou `CLINICAL_SUSPICION` |
| Dia zero (`requestedAt`) | Data do pedido dos exames, informada pela navegadora a partir do pedido que o médico/UBS fez no fluxo habitual. Não é a data do cadastro |
| `reportDate` | Data escrita no laudo. Fecha o relógio de 30 dias e abre o de 60 |
| `treatmentStartedAt` | Data do início do primeiro tratamento: cirurgia, quimioterapia ou radioterapia |
| Relógio aberto | O prazo que está correndo agora: `D30` ou `D60`. Caso fechado não tem relógio aberto |
| Vencimento (`dueDate`) | `requestedAt + 30` (D30) ou `reportDate + 60` (D60) |
| Dias restantes | `dueDate − hoje`, em dias inteiros. Negativo = vencido |
| Notícia | Evento de etapa que zera o silêncio (seção 6) |
| Silêncio | Dias seguidos sem notícia |
| Selo (`badge`) | Marca no card que não muda a cor por si só, exceto o silêncio (seção 6) |
| Exceção | Recusa, ausência, contraindicação, pendência clínica, transporte ou falta de vaga. Anota e põe selo; nunca suspende o prazo |
| Extração (`ReportExtraction`) | Sugestão da IA (ou da regra local) para um laudo colado. Fica no servidor até ser confirmada |
| Navegadora | Única usuária com login. Dona da lista de casos |
| Hoje | Data local em `America/Sao_Paulo`, calculada só pelo `Clock`, mais o deslocamento de demo |

## 4. Estados e transições

### 4.1 Tabela de estados

O equivalente no Conass vem do "dicionário mínimo de estados da jornada" do Módulo 4
da oficina da Rede de Prevenção e Controle do Câncer (`EVIDENCE.md`, seção 8): suspeita
ativa (30 dias) → diagnóstico pendente → diagnóstico conclusivo (inicia os 60 dias) →
plano definido → tratamento ativo → seguimento. O mapeamento é nosso.

| Enum | Rótulo na UI | Relógio aberto | Equivalente no Conass | Fechado? |
| --- | --- | --- | --- | --- |
| `SUSPECTED` | Suspeita registrada | D30 | Suspeita ativa | Não |
| `EXAM_SCHEDULED` | Exame agendado | D30 | Suspeita ativa `[SUPOSIÇÃO]` | Não |
| `EXAM_DONE` | Exame realizado | D30 | Diagnóstico pendente `[SUPOSIÇÃO]` | Não |
| `EXAM_TO_RESCHEDULE` | Aguardando agendamento | D30 | Diagnóstico pendente `[SUPOSIÇÃO]` | Não |
| `REPORT_PENDING_CONFIRMATION` | Laudo aguardando confirmação | D30 | Diagnóstico pendente | Não |
| `DIAGNOSIS_CONFIRMED` | Diagnóstico confirmado | D60 | Diagnóstico conclusivo (inicia os 60 dias) | Não |
| `TREATMENT_STARTED` | Tratamento iniciado | — | Tratamento ativo | Sim |
| `DISCARDED` | Descartado (volta para a UBS) | — | Seguimento `[SUPOSIÇÃO]` | Sim |
| `CLOSED_EXCEPTION` | Encerrado por exceção | — | Sem estado equivalente; usa a lista de exceções do Conass ("recusa, contraindicação, ausência, pendência clínica, transporte ou capacidade") | Sim |

"Plano definido" não tem estado no MVP: o caso vai de `DIAGNOSIS_CONFIRMED` direto
para `TREATMENT_STARTED`.

### 4.2 Eventos

| `type` | Muda estado? | Conta como notícia? | Payload (além de `occurredAt`) |
| --- | --- | --- | --- |
| `CASE_CREATED` | cria em `SUSPECTED` | Sim | `trigger`, `requestedAt` |
| `EXAM_SCHEDULED` | → `EXAM_SCHEDULED` | Sim | `examLabel`, `scheduledFor`, `location` |
| `EXAM_DONE` | → `EXAM_DONE` | Sim | `examLabel` |
| `REPORT_RECEIVED` | → `REPORT_PENDING_CONFIRMATION` | Sim | — |
| `REPORT_CONFIRMED` | → `DIAGNOSIS_CONFIRMED`, `DISCARDED` ou `EXAM_TO_RESCHEDULE` | Sim | `extractionId`, valores finais (seção 11.3) |
| `TREATMENT_STARTED` | → `TREATMENT_STARTED` | Sim | `treatmentType` (`SURGERY`, `CHEMOTHERAPY`, `RADIOTHERAPY`) |
| `EXCEPTION_NOTED` | Não | Sim | `reason`, `note` |
| `CASE_CLOSED_EXCEPTION` | → `CLOSED_EXCEPTION` | — (fecha o caso) | `reason` (`DEFINITIVE_REFUSAL`, `DEATH`), `note` |
| `CORRECTION` | Não | **Não** | `correctsEventId`, `changes`, `reason` |
| `ALERT_ACKNOWLEDGED` | Não | **Não** | `alertKey` |

- `EXCEPTION_NOTED.reason`: `REFUSAL`, `ABSENCE`, `CONTRAINDICATION`, `CLINICAL_PENDING`,
  `TRANSPORT`, `NO_CAPACITY` ("falta de vaga").
- `REPORT_RECEIVED` existe para que o estado `REPORT_PENDING_CONFIRMATION` tenha um
  evento de entrada. A extração (seção 11) não muda o estado. Na UI, o botão
  "Registrar laudo" manda `REPORT_RECEIVED` (se o caso ainda não estiver em
  `REPORT_PENDING_CONFIRMATION`) e, em seguida, cria a extração
  `[DECISÃO PENDENTE: a extração poderia gerar o REPORT_RECEIVED sozinha]`.

### 4.3 Transições

| De | Para (evento) |
| --- | --- |
| `SUSPECTED` | `EXAM_SCHEDULED`, `EXAM_DONE`, `REPORT_PENDING_CONFIRMATION` |
| `EXAM_SCHEDULED` | `EXAM_SCHEDULED` (remarcação, nova data), `EXAM_DONE`, `REPORT_PENDING_CONFIRMATION` |
| `EXAM_DONE` | `REPORT_PENDING_CONFIRMATION` |
| `EXAM_TO_RESCHEDULE` | `EXAM_SCHEDULED`, `EXAM_DONE`, `REPORT_PENDING_CONFIRMATION` |
| `REPORT_PENDING_CONFIRMATION` | `DIAGNOSIS_CONFIRMED`, `DISCARDED` ou `EXAM_TO_RESCHEDULE`, **só** por `REPORT_CONFIRMED` |
| `DIAGNOSIS_CONFIRMED` | `TREATMENT_STARTED` |
| Qualquer estado aberto | `CLOSED_EXCEPTION` (só por ação explícita da navegadora) |
| `TREATMENT_STARTED`, `DISCARDED`, `CLOSED_EXCEPTION` | Nenhuma. Caso fechado não reabre |

Regras:

- Avanço para a frente é livre até `REPORT_PENDING_CONFIRMATION`: pular etapas é
  permitido (o laudo pode chegar sem registro do agendamento).
- `REPORT_CONFIRMED.malignancy` decide o destino: `malignant` → `DIAGNOSIS_CONFIRMED`;
  `benign` → `DISCARDED`; `inconclusive` → `EXAM_TO_RESCHEDULE`.
- `EXCEPTION_NOTED`, `CORRECTION` e `ALERT_ACKNOWLEDGED` valem em qualquer estado
  aberto. `CORRECTION` também vale em caso fechado, porque corrige dado e não reabre
  nada `[SUPOSIÇÃO]`.
- Transição inválida → **409**. Payload inválido → **400**. Evento em caso fechado
  (exceto `CORRECTION`) → **409**.
- A remarcação (`EXAM_SCHEDULED` em `EXAM_SCHEDULED`) não está escrita nas decisões. Sem
  ela, um exame perdido deixaria o caso travado `[DECISÃO PENDENTE]`. Ela não suspende
  o prazo.
- `EXAM_SCHEDULED`/`EXAM_DONE` → `EXAM_TO_RESCHEDULE` direto (por exemplo, por ausência)
  **não** é permitido: a ausência vira `EXCEPTION_NOTED` e o exame é remarcado com
  `EXAM_SCHEDULED` `[DECISÃO PENDENTE]`.

### 4.4 Exceções e encerramento

- Exceção nunca suspende o prazo. Ela anota o motivo, a data e o texto, e põe o selo
  "Exceção: <motivo>" no card. A cor continua vindo do prazo.
- Ausência não fecha o caso.
- Recusa definitiva ou óbito podem fechar o caso com `CASE_CLOSED_EXCEPTION`, só por
  ação explícita da navegadora. O fechamento registra, para o relógio aberto naquele
  dia, "cumpriu até o encerramento" (data do fechamento ≤ vencimento) ou "não cumpriu"
  (data do fechamento > vencimento).

### 4.5 Correção

- `CORRECTION` aponta para o evento corrigido (`correctsEventId`), traz os novos valores
  (`changes`) e o motivo, que é obrigatório.
- Vale só para datas e dados do caso, nunca para transições. Campos corrigíveis:

| Evento corrigido | Campos |
| --- | --- |
| `CASE_CREATED` | `requestedAt`, `trigger` |
| `EXAM_SCHEDULED` | `scheduledFor`, `location`, `examLabel` |
| `EXAM_DONE` | `occurredAt`, `examLabel` |
| `REPORT_CONFIRMED` | `reportDate`, `examType`, `evidenceQuote` (nunca `malignancy`) |
| `TREATMENT_STARTED` | `occurredAt`, `treatmentType` |
| `EXCEPTION_NOTED` | `occurredAt`, `reason`, `note` |

- Corrigir `malignancy` ou o tipo de um evento → 400.
- O cálculo usa o valor corrigido. Se houver várias correções do mesmo evento, vale a
  mais recente (`recordedAt`).
- Os valores corrigidos passam pelas mesmas validações do evento original (por
  exemplo, `requestedAt` no futuro → 400).

## 5. Regras de prazo

Todas as contas usam datas sem hora (`YYYY-MM-DD`) e dias inteiros. "Hoje" vem do
`Clock` (seção 17).

### 5.1 Relógio de 30 dias

- Dia zero = `requestedAt`. O pedido é o dia 0, e os dias são corridos.
- `dia = hoje − requestedAt`. O card mostra "Dia X de 30".
- `vencimento30 = requestedAt + 30`. O dia 30 ainda está no prazo; o dia 31 é vencido.
- Cumprido quando `reportDate ≤ requestedAt + 30`, com laudo conclusivo (`malignant` ou
  `benign`).
- Laudo inconclusivo → `EXAM_TO_RESCHEDULE` ("Aguardando agendamento"), com o próximo
  passo "Repetir biópsia: agendar". O relógio de 30 dias **segue contando do
  `requestedAt` original**, sem reiniciar.
- `requestedAt` no passado é permitido (o caso pode entrar já amarelo ou vermelho). No
  futuro → 400.

### 5.2 Relógio de 60 dias

- Começa no `reportDate` do laudo maligno confirmado, e não na data da confirmação.
- `dia = hoje − reportDate`. O card mostra "Dia X de 60".
- `vencimento60 = reportDate + 60`.
- Cumprido quando `treatmentStartedAt ≤ reportDate + 60`. Tratamento = cirurgia,
  quimioterapia ou radioterapia (Lei 12.732/2012, art. 2º, § 1º).

### 5.3 Validação das datas

| Campo | Regra | Erro |
| --- | --- | --- |
| `requestedAt` | ≤ hoje | 400 |
| `reportDate` | ≥ `requestedAt` e ≤ hoje | 400 |
| `treatmentStartedAt` | ≥ `reportDate` e ≤ hoje `[SUPOSIÇÃO]` | 400 |
| `occurredAt` de qualquer evento | ≥ `requestedAt` e ≤ hoje `[SUPOSIÇÃO]` | 400 |
| `scheduledFor` | ≥ `requestedAt` (pode ser no passado, para registro atrasado) `[SUPOSIÇÃO]` | 400 |
| `birthDate` | < hoje | 400 |

### 5.4 Limites

Reunidos numa constante central, `DEADLINE_RULES`, em `backend/src/cases/domain`. Todos
são `[SUPOSIÇÃO]`, a combinar com a gestão.

| Constante | Valor |
| --- | --- |
| `D30.days` | 30 |
| `D30.warnWithinDays` | 7 (amarelo quando faltam 7 dias ou menos) |
| `D60.days` | 60 |
| `D60.warnWithinDays` | 14 (amarelo quando faltam 14 dias ou menos) |
| `silenceDays` | 7 |
| `escalateToRegulationWithinDays` | 3 |
| `closedLinkGraceDays` | 30 (seção 13) |

### 5.5 Exemplos numéricos

**Relógio de 30 dias**, `requestedAt = 2026-10-05`, `vencimento30 = 2026-11-04`:

| Hoje | Dia | Faltam | Cor (sem silêncio) |
| --- | --- | --- | --- |
| 2026-10-23 | 18 | 12 | Verde |
| 2026-10-27 | 22 | 8 | Verde |
| 2026-10-28 | 23 | 7 | Amarelo |
| 2026-11-01 | 27 | 3 | Amarelo, e o alerta sobe para a regulação |
| 2026-11-04 | 30 | 0 | Amarelo (ainda no prazo) |
| 2026-11-05 | 31 | −1 | Vermelho ("vencido há 1 dia") |

- `reportDate = 2026-11-04` → 30 dias: cumpriu.
- `reportDate = 2026-11-05` → 30 dias: não cumpriu.
- Laudo inconclusivo confirmado em 2026-10-30: o caso vai para `EXAM_TO_RESCHEDULE` e
  continua vencendo em 2026-11-04.

**Relógio de 60 dias**, `reportDate = 2026-10-30`, `vencimento60 = 2026-12-29`:

| Hoje | Dia | Faltam | Cor (sem silêncio) |
| --- | --- | --- | --- |
| 2026-11-30 | 31 | 29 | Verde |
| 2026-12-14 | 45 | 15 | Verde |
| 2026-12-15 | 46 | 14 | Amarelo |
| 2026-12-29 | 60 | 0 | Amarelo (ainda no prazo) |
| 2026-12-30 | 61 | −1 | Vermelho |

- `treatmentStartedAt = 2026-12-29` → 60 dias: cumpriu.
- `treatmentStartedAt = 2026-12-30` → 60 dias: não cumpriu.

## 6. Silêncio e selos

### 6.1 O que conta como notícia

Só os eventos de etapa zeram o silêncio: `CASE_CREATED`, `EXAM_SCHEDULED`, `EXAM_DONE`,
`REPORT_RECEIVED`, `REPORT_CONFIRMED`, `TREATMENT_STARTED` e `EXCEPTION_NOTED`.
`ALERT_ACKNOWLEDGED` e `CORRECTION` **não** zeram.

- `silêncio = hoje − data da última notícia`.
- A data da notícia é a data local de `recordedAt` (quando a equipe ficou sabendo), e
  não `occurredAt` `[DECISÃO PENDENTE]`. Motivo: um exame feito há 9 dias e registrado
  hoje é notícia de hoje; contar pelo `occurredAt` deixaria o caso amarelo logo depois
  da atualização.
- Silêncio de 7 dias ou mais = "Sem notícia há X dias".

### 6.2 Data agendada

- Uma data agendada no futuro (`scheduledFor` do `EXAM_SCHEDULED` vigente) suspende o
  silêncio até o dia seguinte a ela.
- Se `hoje > scheduledFor` e o caso continua em `EXAM_SCHEDULED` (sem `EXAM_DONE` nem
  laudo), o caso ganha **na hora** o selo "Data passou sem registro".
- Exemplo: `EXAM_SCHEDULED` registrado em 2026-10-20 para 2026-10-25.
  - Em 2026-10-25 (data de hoje): sem selo, silêncio suspenso.
  - Em 2026-10-26: selo "Data passou sem registro", mesmo que o silêncio tenha menos
    de 7 dias.
  - Em 2026-10-27, se a última notícia foi em 2026-10-20: selo "Data passou sem
    registro" e "Sem notícia há 7 dias".

### 6.3 Efeito na cor

"Falta de notícia" = silêncio de 7 dias ou mais (não suspenso) **ou** data passou sem
registro.

- Caso verde com falta de notícia → amarelo.
- Caso amarelo continua amarelo.
- Caso vermelho continua vermelho e ganha o selo.
- Caso fechado não tem silêncio.

### 6.4 Selos

| Selo | Quando aparece | Muda a cor? |
| --- | --- | --- |
| "Exceção: <motivo>" | Existe `EXCEPTION_NOTED` no caso aberto | Não |
| "Sem notícia há X dias" | Silêncio ≥ 7 dias e não suspenso | Verde → amarelo |
| "Data passou sem registro" | `hoje > scheduledFor` e o caso segue em `EXAM_SCHEDULED` | Verde → amarelo |
| "Laudo aguardando confirmação" | Estado `REPORT_PENDING_CONFIRMATION` | Não |

O selo de exceção mostra a exceção mais recente; o detalhe lista todas.

## 7. Cores, limites e ordem dos cards

### 7.1 Cor

Prioridade: **vermelho > amarelo > verde**.

| Cor | Rótulo em texto | Regra |
| --- | --- | --- |
| Vermelho | "Vencido" | Dias restantes < 0 no relógio aberto |
| Amarelo | "Atenção" | Dias restantes ≤ limite (7 no D30, 14 no D60), ou falta de notícia |
| Verde | "No prazo" | Nenhuma das anteriores |
| Sem cor | Resultado | Caso fechado: mostra só o resultado (seção 8.4) |

A cor nunca aparece sozinha: sempre vem com o rótulo em texto e um ícone.

### 7.2 Coluna do card

- O card fica na semana do **vencimento do prazo aberto**, não na da data agendada.
- Vermelho → coluna fixa "Vencidos", à esquerda.
- Vencimento depois da última semana da janela → coluna fixa "Depois", à direita.

### 7.3 Ordem dentro da coluna

1. Cor: vermelho, amarelo, verde.
2. Dias restantes, do menor para o maior (na coluna "Vencidos", o mais vencido primeiro).
3. Empate: `BIRADS_5`, depois `BIRADS_4`, depois `CLINICAL_SUSPICION`.
4. Desempate técnico, para a ordem ser estável: `requestedAt` mais antigo, depois `id`
   `[SUPOSIÇÃO]`.

Por que o BI-RADS 5 vem antes: pelo INCA, o risco de câncer é de 95% ou mais no BI-RADS
5 e de 2% a 94% no BI-RADS 4 (`EVIDENCE.md`, seção 12, "Risco de câncer por categoria",
INCA 2025, Quadro 2 🟢). `[DADO FALTANDO]` Risco equivalente para a suspeita clínica
sem mamografia; ela fica por último por falta de número, não por evidência de menor
risco.

## 8. Calendário e UI

### 8.1 Telas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login da navegadora (absorve o FEAT-001) | Pública |
| `/` | Calendário dos casos abertos | Navegadora |
| `/concluidos` | Aba "Concluídos" com o mini painel de métricas | Navegadora |
| `/casos/novo` | Cadastro do caso | Navegadora |
| `/casos/:id` | Detalhe do caso: linha do tempo, ações, extração, mensagens, alertas | Navegadora |
| `/alertas` | Lista de alertas | Navegadora |
| `/p/:accessToken` | Visão da paciente | Pública (token) |

### 8.2 Calendário

- Semana atual mais as 8 seguintes (9 colunas), com rolagem horizontal. A semana
  começa na segunda-feira.
- Coluna fixa "Vencidos" à esquerda e coluna fixa "Depois" à direita.
- O cabeçalho de cada semana mostra o intervalo (ex.: "26/10 – 01/11").
- O agrupamento por semana é feito no cliente, a partir do `dueDate` de cada caso e do
  `today` que a API devolve. O cliente nunca usa a data do navegador.
- Exemplo com hoje = sexta, 2026-10-30: a janela vai de 2026-10-26 (segunda) a
  2026-12-27 (domingo da 9ª semana). Um vencimento em 2026-12-29 cai em "Depois".

### 8.3 Card

O card mostra:

- as iniciais (nunca o nome completo);
- "Dia X de 30" ou "Dia X de 60";
- o próximo passo, com a data agendada e o vencimento do prazo. Ex.: "Biópsia agendada
  25/10 · prazo 30d vence 04/11". Sem data: "Aguardando agendamento · prazo 30d vence
  04/11";
- a cor, com o rótulo em texto e o ícone;
- os selos: exceção, sem notícia, data passou sem registro, laudo aguardando
  confirmação.

Próximo passo por estado:

| Estado | Próximo passo |
| --- | --- |
| `SUSPECTED` | "Aguardando agendamento" |
| `EXAM_SCHEDULED` | "<examLabel> agendada <dd/mm>" |
| `EXAM_DONE` | "Aguardando laudo" |
| `EXAM_TO_RESCHEDULE` | "Repetir biópsia: agendar" ("Aguardando agendamento") |
| `REPORT_PENDING_CONFIRMATION` | "Confirmar laudo" |
| `DIAGNOSIS_CONFIRMED` | "Iniciar tratamento: aguardando agendamento" |

Não há evento de agendamento do tratamento no MVP. Por isso, um caso em
`DIAGNOSIS_CONFIRMED` sem `EXCEPTION_NOTED` fica amarelo por silêncio depois de 7 dias
`[DECISÃO PENDENTE: criar TREATMENT_SCHEDULED]`. Isso é coerente com "silêncio é
alerta".

Clicar no card abre o detalhe, com a linha do tempo.

### 8.4 Detalhe e Concluídos

- **Detalhe:** iniciais, idade, gatilho, estado, relógio, linha do tempo (correções
  aparecem junto do evento corrigido, com o motivo), ações permitidas
  (`allowedEventTypes`, que vem da API), a extração do laudo, as mensagens simuladas,
  os alertas do caso e o botão "Gerar novo link da paciente".
- **Concluídos:** casos fechados com "30 dias: cumpriu/não cumpriu" e "60 dias:
  cumpriu/não cumpriu/não se aplica", mais o mini painel de métricas (seção 15).
  - `DISCARDED` → 60 dias: não se aplica.
  - `CLOSED_EXCEPTION` → relógio aberto no fechamento: "cumpriu até o encerramento" ou
    "não cumpriu"; o outro relógio: "não se aplica".

### 8.5 Acessibilidade

- A cor sempre vem com rótulo em texto ("No prazo", "Atenção", "Vencido") e ícone
  (`lucide-react`, já instalado).
- O card é um `<button>` focável, com `aria-label` com as iniciais, o dia e o prazo.
  Ex.: "M.F.S., dia 18 de 30, prazo vence 04/11, no prazo".
- Foco visível e navegação completa por teclado no calendário, no detalhe e na
  confirmação do laudo.
- Contraste mínimo WCAG AA no texto dos cards e dos selos `[SUPOSIÇÃO]`.
- Selos em texto, não só em ícone.

### 8.6 Responsividade e celular

A aplicação é **responsiva em todos os fluxos**, não só no calendário. A demo precisa
funcionar no notebook da banca e no celular.

- **Mobile-first** para o link da paciente: uma coluna, texto legível, botões grandes e
  sem rolagem horizontal.
- **Breakpoints de referência:** 360px, 768px, 1024px e 1440px.
- **Abaixo de 768px:** a grade do calendário vira lista vertical agrupada por semana,
  na mesma ordem: "Vencidos", as 9 semanas e "Depois".
- **Entre 768px e 1024px:** calendário com rolagem horizontal controlada e colunas
  "Vencidos"/"Depois" fixas; detalhe e formulários empilhados.
- **Acima de 1024px:** calendário de 9 semanas com rolagem horizontal; detalhe em duas
  colunas quando houver espaço.
- **Sem overflow horizontal** fora da rolagem intencional do calendário.
- **Alvos de toque** com pelo menos 44×44px no celular.
- **Formulários e diálogos** ocupam a largura disponível no celular, com labels
  visíveis e teclado adequado por tipo de campo.
- **Teste manual** em 360×640, 768×1024, 1280×800 e 1440×900, além de teclado e zoom.
- Componentes shadcn/Tailwind devem ser usados com breakpoints, não com largura fixa.

### 8.7 Barra de demo

- Aparece só se `GET /api/demo/status` responder 200.
- Mostra a data simulada e os botões "+1 dia", "+7 dias" e "Resetar".

## 9. Modelo de dados

Prisma 6 + PostgreSQL. Datas sem hora em `@db.Date`; instantes em `DateTime`. Nomes de
tabela em `snake_case` via `@@map`, como no `User` atual.

```prisma
enum CaseStatus {
  SUSPECTED
  EXAM_SCHEDULED
  EXAM_DONE
  EXAM_TO_RESCHEDULE
  REPORT_PENDING_CONFIRMATION
  DIAGNOSIS_CONFIRMED
  TREATMENT_STARTED
  DISCARDED
  CLOSED_EXCEPTION
}

enum CaseTrigger {
  BIRADS_4
  BIRADS_5
  CLINICAL_SUSPICION
}

enum CaseEventType {
  CASE_CREATED
  EXAM_SCHEDULED
  EXAM_DONE
  REPORT_RECEIVED
  REPORT_CONFIRMED
  TREATMENT_STARTED
  EXCEPTION_NOTED
  CASE_CLOSED_EXCEPTION
  CORRECTION
  ALERT_ACKNOWLEDGED
}

model Case {
  id          String      @id @default(uuid()) @db.Uuid
  fullName    String      @map("full_name")   // só para o filtro; nunca sai na API
  initials    String
  cns         String                          // fictício; nunca sai na API
  birthDate   DateTime    @map("birth_date") @db.Date
  trigger     CaseTrigger
  requestedAt DateTime    @map("requested_at") @db.Date // cache do valor corrigido
  status      CaseStatus                      // cache; a fonte é a linha do tempo
  createdById String      @map("created_by_id") @db.Uuid
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  events       CaseEvent[]
  extractions  ReportExtraction[]
  accessTokens PatientAccessToken[]

  @@map("cases")
}

model CaseEvent {
  id              String        @id @default(uuid()) @db.Uuid
  caseId          String        @map("case_id") @db.Uuid
  type            CaseEventType
  occurredAt      DateTime      @map("occurred_at") @db.Date
  recordedAt      DateTime      @map("recorded_at")   // Clock.now(), com o deslocamento de demo
  userId          String        @map("user_id") @db.Uuid
  correctsEventId String?       @map("corrects_event_id") @db.Uuid
  payload         Json

  @@index([caseId, recordedAt])
  @@map("case_events")
}

model ReportExtraction {
  id            String    @id @default(uuid()) @db.Uuid
  caseId        String    @map("case_id") @db.Uuid
  provider      String                     // "gemini" | "mock"
  fallbackReason String?  @map("fallback_reason") // "timeout" | "invalid_output" | "provider_error" | "no_api_key"
  suggestion    Json                       // ReportSuggestion validada por Zod
  demoRawText   String?   @map("demo_raw_text") // DEMO_ONLY: só com DEMO_MODE=true; apagar no reset
  createdById   String    @map("created_by_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")
  consumedAt    DateTime? @map("consumed_at")     // preenchido pelo REPORT_CONFIRMED
  consumedByEventId String? @unique @map("consumed_by_event_id") @db.Uuid

  @@map("report_extractions")
}

model PatientAccessToken {
  id          String    @id @default(uuid()) @db.Uuid
  caseId      String    @map("case_id") @db.Uuid
  tokenHash   String    @unique @map("token_hash") // SHA-256 do token; o token nunca é salvo
  createdById String    @map("created_by_id") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at")
  revokedAt   DateTime? @map("revoked_at")

  @@map("patient_access_tokens")
}

model DemoClockState {
  id         Int      @id @default(1)  // linha única
  offsetDays Int      @default(0) @map("offset_days")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("demo_clock_state")
}
```

- As relações (`@relation`) com `Case` e `User` entram no schema real; aqui ficam
  omitidas para a leitura.
- `CaseEvent` é append-only: o repositório não expõe update nem delete. O único
  delete é o truncate do reset de demo e dos testes.
- `Case.status` e `Case.requestedAt` são cache, atualizados na mesma transação do
  evento. A fonte da verdade é a linha do tempo.
- `Patient` separado: `[DECISÃO PENDENTE]` da fase 1.
- CPF não é guardado. A ficha de `OPERATIONS.md` (seção 2) fala em "CPF/CNS"; o MVP
  guarda só o CNS fictício.
- Risco: confirmar com `prisma validate` se `Case` é aceito como nome de model no
  Prisma 6.19.3. Se não for, usar `CareCase` com `@@map("cases")`, sem mudar o nome do
  domínio `[SUPOSIÇÃO]`.

## 10. Contratos de API

Contratos Zod em `packages/contracts/src/cases.ts` (e afins), reaproveitados no
frontend. Datas são strings `YYYY-MM-DD`. Erros usam o envelope atual
(`statusCode`, `error`, `message`, `path`, `timestamp`), com `error` igual ao código da
tabela 10.3 quando houver.

### 10.1 Endpoints

| Método e rota | Auth | Corpo | Resposta | Erros |
| --- | --- | --- | --- | --- |
| `POST /api/cases` | JWT | `{ fullName, cns, birthDate, trigger, requestedAt }` | 201 `CaseView` | 400, 401 |
| `GET /api/cases?scope=open\|closed` | JWT | — | 200 `{ today, cases: CaseView[] }` | 400 (scope inválido), 401 |
| `GET /api/cases/:id` | JWT | — | 200 `CaseDetail` | 401, 404 |
| `POST /api/cases/:id/events` | JWT | `CaseEventInput` (`discriminatedUnion('type')`) | 201 `CaseView` | 400, 401, 404, 409 |
| `POST /api/cases/:id/report-extractions` | JWT | `{ reportText }` | 201 `ReportExtractionView` | 400, 401, 404, 409, 429 |
| `POST /api/cases/:id/access-tokens` | JWT | — | 201 `{ token, path }` (mostrado uma única vez) | 401, 404, 409 (caso fechado há mais de 30 dias) |
| `GET /api/alerts` | JWT | — | 200 `Alert[]` | 401 |
| `GET /api/metrics` | JWT | — | 200 `Metrics` | 401 |
| `GET /api/public/p/:token` | Nenhuma | — | 200 `PatientView` | 404, 429 |
| `GET /api/demo/status` | JWT | — | 200 `{ today, offsetDays }` | 401, 404 sem DEMO_MODE |
| `POST /api/demo/clock/advance` | JWT | `{ days }` (inteiro de 1 a 60 `[SUPOSIÇÃO]`) | 200 `{ today, offsetDays }` | 400, 401, 404 sem DEMO_MODE |
| `POST /api/demo/clock/reset` | JWT | — | 200 `{ today, offsetDays: 0 }` | 401, 404 sem DEMO_MODE |
| `POST /api/demo/reset` | JWT | — | 200 `{ cases }` (recarrega o seed e zera o relógio `[SUPOSIÇÃO]`) | 401, 404 sem DEMO_MODE |

- O "Ciente" de alerta é um evento: `POST /api/cases/:id/events` com
  `{ type: "ALERT_ACKNOWLEDGED", alertKey }`.
- Sem `DEMO_MODE=true`, o módulo `demo` não é registrado e todas as rotas
  `/api/demo/*` devolvem 404, mesmo com token.
- Exigir JWT nas rotas de demo é escolha conservadora `[DECISÃO PENDENTE]`.

### 10.2 Formas principais

```ts
// CaseView: o caso já calculado pelo backend
{
  id, initials, trigger, status,
  requestedAt, reportDate | null, treatmentStartedAt | null,
  clock: 'D30' | 'D60' | null,
  day: number | null, dayTotal: 30 | 60 | null,
  dueDate: 'YYYY-MM-DD' | null, daysRemaining: number | null,
  color: 'green' | 'yellow' | 'red' | null,
  badges: Array<
    | { type: 'EXCEPTION', reason, since }
    | { type: 'SILENCE', days }
    | { type: 'MISSED_DATE', scheduledFor }
    | { type: 'REPORT_PENDING' }
  >,
  nextStep: { label, scheduledFor: string | null, location: string | null } | null,
  outcome30: 'MET' | 'NOT_MET' | 'MET_UNTIL_CLOSE' | null,
  outcome60: 'MET' | 'NOT_MET' | 'MET_UNTIL_CLOSE' | 'NOT_APPLICABLE' | null,
  closedAt: string | null,
  allowedEventTypes: CaseEventType[],
}

// CaseDetail = CaseView + { ageYears, timeline, messages, alerts, extractions }

// ReportExtractionView
{ extractionId, provider: 'gemini' | 'mock', fallbackReason | null, suggestion: ReportSuggestion }
```

`fullName`, `cns` e `birthDate` nunca saem em nenhuma resposta. O detalhe mostra a
idade calculada `[DECISÃO PENDENTE: a navegadora pode precisar ver o nome para ligar]`.

### 10.3 Códigos de erro

| HTTP | `error` | Quando |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Payload fora do schema Zod, data fora das regras (seção 5.3), `scope` inválido, correção de campo não corrigível |
| 401 | `UNAUTHORIZED` | Sem token ou token inválido (comportamento atual) |
| 404 | `CASE_NOT_FOUND` | Caso inexistente |
| 404 | `NOT_FOUND` | Token da paciente inexistente, revogado ou expirado (mesma resposta nos três casos); rotas de demo sem DEMO_MODE |
| 409 | `INVALID_TRANSITION` | Evento não permitido no estado atual, ou evento em caso fechado |
| 409 | `EXTRACTION_ALREADY_CONSUMED` | `REPORT_CONFIRMED` com extração já usada (duplo clique) |
| 409 | `EXTRACTION_NOT_FOUND_FOR_CASE` | `extractionId` de outro caso ou inexistente `[SUPOSIÇÃO: 409, e não 404, para não confundir com o caso]` |
| 409 | `ALERT_NOT_ACTIVE` | "Ciente" de alerta que não está ativo ou já foi marcado |
| 429 | `TOO_MANY_REQUESTS` | Rate limit (link da paciente e extração) |

Duplo clique na confirmação: a primeira chamada consome a extração e move o estado; a
segunda devolve 409.

## 11. IA

### 11.1 Porta `ReportExtractor`

- Porta nova, separada do `ChatProvider` (que não muda).
- `extract(filteredText): Promise<ReportSuggestion>`, com dois adaptadores:
  `GeminiReportExtractor` e `MockReportExtractor`.
- Saída validada pelo schema Zod `reportSuggestionSchema`, em `packages/contracts`:

```ts
{
  examType: string,                 // ex.: "anatomopatológico"; até 80 caracteres
  reportDate: 'YYYY-MM-DD' | null,  // data escrita no laudo
  malignancy: 'malignant' | 'benign' | 'inconclusive',
  confidence: 'high' | 'medium' | 'low', // rótulo heurístico, NÃO probabilidade
  evidenceQuote: string,            // trecho literal do laudo (já filtrado)
  provider: 'gemini' | 'mock',
}
```

> **Sobre `confidence`:** o Gemini não devolve uma confiança calibrada nativa. O
> campo é um **rótulo qualitativo** gerado pelo modelo ou derivado pela regra local.
> Ele não é uma probabilidade e não pode ser usado para decisão clínica automática.
> O servidor pode recalcular ou rebaixar o rótulo quando o `evidenceQuote` não for
> literal ou quando o texto for ambíguo. Ver ADR 0008.

### 11.2 Fluxo

1. A navegadora cola o laudo em texto livre (até 16.000 caracteres, como o limite do
   chat `[SUPOSIÇÃO]`).
2. O **filtro de identificadores** remove CPF, CNS e o nome da paciente (seção 11.4).
3. `LLM_PROVIDER=gemini` → Gemini; `LLM_PROVIDER=mock` → mock direto.
4. Fallback para o mock, com o motivo registrado em `fallbackReason` (como no ADR 0004):
   - sem `GEMINI_API_KEY` → `no_api_key`;
   - erro, quota ou modelo indisponível → `provider_error`;
   - estourou `REPORT_EXTRACTION_TIMEOUT_MS` (padrão 8000 ms `[SUPOSIÇÃO]`) → `timeout`;
   - JSON inválido no Zod, ou `evidenceQuote` que não aparece literalmente no texto
     filtrado → `invalid_output` `[SUPOSIÇÃO: a checagem do trecho literal]`.
5. O servidor guarda a sugestão (`ReportExtraction`) e devolve o `extractionId`. **O
   estado do caso não muda.**
6. A UI mostra a sugestão com o selo de origem: "Gemini" ou "regra local".
7. A navegadora pode editar todos os campos (`examType`, `reportDate`, `malignancy`,
   `evidenceQuote`) e confirma.

### 11.3 Confirmação

- `REPORT_CONFIRMED` manda `{ extractionId, examType, reportDate, malignancy,
  evidenceQuote }` com os valores finais. `reportDate` é obrigatório na confirmação.
- O servidor busca a sugestão que **ele** guardou, calcula os campos alterados e grava
  no payload do evento: `suggestion`, `confirmed` e `changedFields`.
- Só vale em `REPORT_PENDING_CONFIRMATION`. A extração é consumida na mesma transação.
- A IA só sugere: nada muda de estado sem a confirmação da navegadora.
- Mais de uma extração por laudo é permitida (colar de novo); só a confirmada é
  consumida.

### 11.4 Filtro de identificadores

Roda antes de qualquer extrator, mesmo na demo e mesmo com o mock (assim o mesmo
caminho é testado sempre).

| Identificador | Regra | Substituto |
| --- | --- | --- |
| CPF | `\d{3}\.?\d{3}\.?\d{3}-?\d{2}` | `[CPF]` |
| CNS | 15 dígitos, com ou sem espaços entre os grupos | `[CNS]` |
| Nome | `fullName` do caso e cada parte com 3 letras ou mais (exceto "da", "de", "do", "das", "dos"), sem diferenciar maiúsculas nem acentos | `[NOME]` |

O filtro reduz o risco, mas não garante anonimização (por exemplo, endereço ou nome de
familiar continuam no texto). Por isso, fora da demo, a regra continua `[DECISÃO
PENDENTE]` (aviso de LGPD em `domain.md`).

### 11.5 Mock (regra local)

- Malignidade por palavra-chave, sem diferenciar maiúsculas nem acentos:
  - "carcinoma", "invasivo", "maligno", "neoplasia maligna" → `malignant`;
  - "fibroadenoma", "benigno", "negativo para malignidade" → `benign`;
  - nenhuma → `inconclusive`, com `confidence: "low"`.
- Se aparecerem palavras dos dois grupos (por exemplo, "carcinoma invasivo; linfonodo
  negativo para malignidade"), o mock devolve `inconclusive` com `confidence: "low"`,
  para forçar a revisão humana `[DECISÃO PENDENTE]`.
- Um único grupo encontrado → `confidence: "medium"` `[SUPOSIÇÃO]`.
- `reportDate`: primeira data `dd/mm/aaaa` do texto, convertida para `YYYY-MM-DD`; sem
  data → `null`.
- `examType`: "anatomopatológico" se o texto tiver "anatomopatol"; senão, "não
  identificado".
- `evidenceQuote`: a frase que contém a palavra-chave; sem palavra-chave, as primeiras
  120 letras do texto filtrado `[SUPOSIÇÃO]`.

No mock, `confidence` é **derivado de regra** (`low`/`medium`), não de uma
probabilidade estatística.

### 11.6 Gemini

- Usa o cliente `@google/genai` que já existe e a mesma lista de modelos do ADR 0004.
- Prompt em `backend/src/report-extraction/prompts/`, pedindo só o JSON do schema e um
  trecho literal.
- Temperatura 0 na extração, fixa no código, para reduzir variação `[SUPOSIÇÃO]`.
- **`confidence` não é uma probabilidade calibrada.** O Gemini não devolve um campo
  nativo de confiança no `generateContent`. O SDK até expõe `avgLogprobs` e
  `logprobsResult`, mas logprobs dependem do modelo; em 2026-10-23, o
  `gemini-3.5-flash-lite` retornou `400 Logprobs is not enabled for this model`.
  Portanto, o campo é um **rótulo qualitativo** pedido no JSON ou derivado pelo
  servidor, e não pode ser usado para decisão clínica automática.
- O servidor valida se `evidenceQuote` aparece literalmente no texto filtrado. Se não
  aparecer, cai para o mock com `invalid_output`; também pode **rebaixar** o
  `confidence` quando o trecho for ambíguo.
- `confidence` é interno da navegadora: não é exibido para a paciente e não muda o
  estado do caso.

### 11.7 LGPD

- O laudo é dado pessoal sensível de saúde (LGPD, art. 11). A demo usa só laudos
  fictícios.
- O texto bruto só é guardado com `DEMO_MODE=true`, em `demoRawText`, campo marcado
  para ser apagado (o reset de demo apaga). Sem `DEMO_MODE`, o texto não é guardado; a
  regra de produção é `[DECISÃO PENDENTE]`.
- Nunca registrar o texto do laudo (bruto ou filtrado) em log, nem em mensagem de erro.

## 12. Mensagens para a paciente

- Templates fixos em PT. A IA nunca escreve para a paciente.
- Calculadas na leitura, a partir dos eventos e do relógio, sem tabela.
- Horário da mensagem: o `occurredAt` do evento que a gerou. O lembrete de silêncio
  leva a data em que o silêncio completou 7 dias.
- Aparecem no detalhe do caso e no link da paciente, como um **simulador de SMS e
  e-mail**. Não há envio real nesta fase.
- **Canais do MVP:** SMS e e-mail. **WhatsApp não faz parte da integração
  implementada**; no pitch final ele aparece apenas como visão/roadmap, junto dos
  outros dois canais.
- A mensagem é a mesma nos dois canais; o que muda é o transporte. O protótipo mostra
  a prévia e o canal, sem disparar nada.
- As mensagens usam os valores do evento original, isto é, o que teria sido enviado.
  Uma correção não reescreve a mensagem antiga `[DECISÃO PENDENTE: gerar mensagem de
  correção]`.

| Gatilho | Texto |
| --- | --- |
| `CASE_CREATED` | "Olá! A sua UBS fez um pedido de exames para investigação da mama em {requestedAt}. Pela lei, você tem direito a fazer esses exames em até 30 dias, até {vencimento30}. Vamos avisar você de cada passo." |
| `EXAM_SCHEDULED` | "Seu exame ({examLabel}) está marcado para {scheduledFor}, em {location}." |
| `REPORT_CONFIRMED` → `EXAM_TO_RESCHEDULE` | "Precisamos remarcar o seu exame. A equipe vai entrar em contato com a nova data. O seu prazo de 30 dias continua valendo: até {vencimento30}." |
| `REPORT_CONFIRMED` → `DIAGNOSIS_CONFIRMED` | "Seu resultado está pronto, e a equipe vai entrar em contato. Você tem direito a iniciar o tratamento em até 60 dias, até {vencimento60}." |
| `REPORT_CONFIRMED` → `DISCARDED` | "Seu resultado está pronto. Procure a sua UBS para combinar o seguimento." |
| `TREATMENT_STARTED` | "Seu tratamento começou em {treatmentStartedAt}. A equipe continua acompanhando você." |
| Lembrete de silêncio (silêncio completou 7 dias) | "Olá! Ainda não recebemos notícia do seu próximo passo. Se você já fez o exame ou tem uma data marcada, avise a sua UBS." |

- A mensagem de `DIAGNOSIS_CONFIRMED` não diz o diagnóstico.
- `CASE_CLOSED_EXCEPTION` não gera mensagem `[SUPOSIÇÃO]`.
- Teste obrigatório: nenhum template renderizado contém "câncer", "cancer", "tumor",
  "maligno" ou "carcinoma". O teste também reprova "maligna" e "neoplasia", por
  segurança `[SUPOSIÇÃO]`.
- Os campos livres que chegam à paciente (`examLabel`, `location`) passam pela mesma
  lista na entrada; palavra proibida → 400 `[SUPOSIÇÃO]`.

## 13. Link público da paciente

- Token aleatório de 32 bytes por caso (`crypto.randomBytes`, codificado em base64url).
  O banco guarda só o SHA-256; o token é mostrado uma única vez, na resposta do `POST`.
- Um link ativo por caso: "Gerar novo link" revoga o anterior (`revokedAt`).
- O link é gerado sob demanda, não no cadastro `[SUPOSIÇÃO]`.
- Rota do frontend `/p/:accessToken`; API `GET /api/public/p/:token`.
- 404 igual (mesmo corpo) para token inexistente, revogado ou expirado.
- Rate limit próprio, por IP: 10 requisições a cada 60 s `[SUPOSIÇÃO]`, com o
  `@Throttle` que o chat já usa.
- Só leitura. Mostra:
  - o próximo passo e a data;
  - "Dia X de 30" ou "Dia X de 60" e o vencimento;
  - os direitos: 30 dias para os exames e 60 dias para começar o tratamento (Lei
    12.732/2012) e a "consulta de posição em fila de espera" prevista na Lei
    14.758/2023 (`OPERATIONS.md`, seção 6);
  - as mensagens simuladas.
- Nunca mostra o nome completo, o CPF, o CNS nem a palavra "câncer". Nada de cor
  vermelha com "Vencido" para a paciente: mostra o vencimento e o direito
  `[SUPOSIÇÃO]`.
- Depois que o caso fecha, o link vale mais 30 dias `[SUPOSIÇÃO]`, mostrando um
  resultado neutro e a orientação de seguimento:
  - `DISCARDED` ou `CLOSED_EXCEPTION`: "Esta etapa do seu acompanhamento terminou.
    Procure a sua UBS para o seguimento.";
  - `TREATMENT_STARTED`: "Seu tratamento começou. A equipe continua acompanhando você."
- Depois desses 30 dias: 404.
- A página não registra o token em log e usa `<meta name="referrer"
  content="no-referrer">` `[SUPOSIÇÃO]`.

## 14. Alertas e escada

- Lista derivada, calculada na leitura em `GET /api/alerts`. Não há tabela de alertas
  nem job.
- Cada alerta traz o caso (id e iniciais), o destinatário, o motivo e a ação sugerida.
- A navegadora é a única usuária e vê todos os alertas. O destinatário diz quem deveria
  agir.

| Motivo (`reason`) | Quando | Destinatário | Ação sugerida |
| --- | --- | --- | --- |
| `DEADLINE_WARNING` | Amarelo pelo prazo | Navegadora | Ligar para a paciente e para o serviço |
| `SILENCE` | Silêncio ≥ 7 dias | Navegadora | Ligar para a paciente e para o serviço |
| `MISSED_DATE` | Data passou sem registro | Navegadora | Confirmar se o exame aconteceu |
| `NEAR_DUE` | Faltam 3 dias ou menos (e não venceu) `[SUPOSIÇÃO]` | Regulação municipal | Priorizar o agendamento no GERCON |
| `OVERDUE` | Vencido | Coordenação da atenção básica e SMS | Levar o caso para a gestão |
| `OVERDUE_NO_CAPACITY` | Vencido e com exceção `NO_CAPACITY` no relógio aberto | 2ª CRS | Pedir vaga ou redistribuição regional |

- As regras se somam: um caso vencido sem vaga gera `OVERDUE` e `OVERDUE_NO_CAPACITY`;
  um caso a 2 dias do vencimento gera `DEADLINE_WARNING` e `NEAR_DUE`.
- Chave estável do alerta: `caseId:reason:clock:<data de referência>`. A data de
  referência é o vencimento (prazo), o início do silêncio (`SILENCE`) ou a
  `scheduledFor` (`MISSED_DATE`). Assim, um silêncio novo vira um alerta novo.
- "Ciente" grava `ALERT_ACKNOWLEDGED { alertKey }`. O alerta continua visível com quem
  marcou e quando. Ele só some quando a causa some; não há "resolvido" manual.
- "Ciente" não zera o silêncio.
- Ordem de corte 2: sem tempo, só os alertas da navegadora (`DEADLINE_WARNING`,
  `SILENCE`, `MISSED_DATE`).

## 15. Métricas

Calculadas na leitura (`GET /api/metrics`), com o "hoje" do `Clock`. Cada percentual
traz numerador e denominador.

| Métrica | Fórmula |
| --- | --- |
| % sem informação | casos abertos com (silêncio ≥ 7 dias **ou** data passou sem registro) ÷ casos abertos |
| % diagnósticos em até 30 dias | casos com laudo conclusivo confirmado e `reportDate ≤ requestedAt + 30` ÷ (casos com laudo conclusivo confirmado + casos abertos com o D30 vencido) |
| % tratamentos em até 60 dias | casos com `treatmentStartedAt ≤ reportDate + 60` ÷ (casos com tratamento iniciado + casos em `DIAGNOSIS_CONFIRMED` com o D60 vencido) |
| IA, principal | laudos confirmados sem nenhum campo alterado ÷ laudos confirmados |
| IA, secundária | campos alterados ÷ campos sugeridos (4 por laudo: `examType`, `reportDate`, `malignancy`, `evidenceQuote`) |

- "% sem informação" é **parecida** com a medida de Porto Alegre (32% dos casos de mama
  sem informação de tempo até o tratamento, jan–ago/2024; `EVIDENCE.md`, seção 12), mas
  **não é igual**: lá, a medida é sobre o Painel-Oncologia; aqui, sobre a falta de
  notícia na nossa lista. Não comparar os números diretamente.
- Os denominadores dos prazos incluem os casos abertos já vencidos, para a exceção e a
  espera não esconderem o atraso. Os casos `CLOSED_EXCEPTION` ficam fora do percentual
  e aparecem contados ao lado ("N encerrados por exceção") `[DECISÃO PENDENTE]`.
- As métricas de IA aparecem também separadas por origem (Gemini e regra local).
- Ordem de corte 1: o mini painel. A API pode ficar; a tela é a primeira a sair.

## 16. Seed e demo

### 16.1 Modo demo

- `DEMO_MODE=true` liga o módulo `demo`, o deslocamento do relógio e o
  `demoRawText`. A variável entra no `env.ts` e no `.env.example` no D30-002.
- `DEMO_MODE=true` com `NODE_ENV=production` falha na validação do ambiente, porque o
  reset apaga as tabelas `[DECISÃO PENDENTE]`.
- `POST /api/demo/reset` faz o truncate só das tabelas do Dia 30, recarrega o seed e
  zera o relógio.

### 16.2 Seed

As datas são relativas ao "hoje" do `Clock` no momento do reset (`T`), para a demo
funcionar em qualquer dia `[SUPOSIÇÃO]`. Todos os nomes, CNS e datas de nascimento são
fictícios; o CNS usa um prefixo claramente falso (ex.: `000000000000001`).

| # | Caso (fictício) | Gatilho | Estado | Datas (relativas a `T`) | Cor e selos esperados em `T` |
| --- | --- | --- | --- | --- | --- |
| 1 | **Maria Fictícia da Silva** (M.F.S.) `[SUPOSIÇÃO: nome e idade]`, entre 50 e 69 anos | `BIRADS_5` | `EXAM_SCHEDULED` | pedido `T−18`; biópsia agendada em `T−3` para `T+2` | Verde, dia 18 de 30 |
| 2 | Joana Exemplo Pereira | `BIRADS_5` | `EXAM_TO_RESCHEDULE` | pedido `T−34`; laudo inconclusivo confirmado `T−12`; exceção `NO_CAPACITY` em `T−3` | Vermelho, dia 34 de 30, selo "Exceção: falta de vaga"; escada até a 2ª CRS |
| 3 | Rita Teste Oliveira | `BIRADS_4` | `SUSPECTED` | pedido e cadastro `T−12`, sem outra notícia | Amarelo por silêncio, "Sem notícia há 12 dias" |
| 4 | Clara Modelo Santos | `CLINICAL_SUSPICION` | `EXAM_DONE` | pedido `T−25`; exame feito, registrado `T−1` | Amarelo pelo prazo, faltam 5 dias |
| 5 | Lúcia Amostra Costa | `BIRADS_4` | `REPORT_PENDING_CONFIRMATION` | pedido `T−20`; `REPORT_RECEIVED` em `T−1` | Verde, selo "Laudo aguardando confirmação" |
| 6 | Helena Simulada Rocha | `BIRADS_4` | `DISCARDED` | pedido `T−40`; laudo benigno, `reportDate T−23` | Concluídos: 30 dias cumpriu; 60 dias não se aplica |
| 7 | Beatriz Ensaio Lima | `BIRADS_5` | `TREATMENT_STARTED` | pedido `T−80`; laudo maligno `T−55`; cirurgia `T−10` | Concluídos: 30 e 60 dias cumpriu |
| 8 | Sônia Piloto Alves | `BIRADS_5` | `DIAGNOSIS_CONFIRMED` | pedido `T−28`; laudo maligno `T−5`, confirmado `T−3` | Verde, dia 5 de 60 |
| 9 | Teresa Prova Gomes | `BIRADS_5` | `DIAGNOSIS_CONFIRMED` | pedido `T−100`; laudo maligno `T−65` (30 dias não cumpriu); exceção `TRANSPORT` em `T−12` | Vermelho, dia 65 de 60, selos "Exceção: transporte" e "Sem notícia há 12 dias" |
| 10 | Vera Fictícia Dias | `CLINICAL_SUSPICION` | `CLOSED_EXCEPTION` | pedido `T−30`; recusa definitiva em `T−8` | Concluídos: 30 dias "cumpriu até o encerramento" |

- O seed cobre os 9 estados e as 3 cores.
- Laudos fictícios: 3 arquivos (`malignant`, `benign`, `inconclusive`) em
  `backend/test/fixtures/reports/`, reaproveitados nos testes do mock, do filtro e na
  demo. Cada um tem um nome, um CPF e um CNS falsos, para provar o filtro. As datas
  escritas nos laudos são fixas (os testes precisam ser determinísticos).
- O laudo maligno tem "carcinoma ductal invasivo" e nenhuma palavra do grupo benigno; o
  benigno tem "fibroadenoma" e "negativo para malignidade"; o inconclusivo tem
  "material insuficiente para diagnóstico" e nenhuma palavra-chave.

### 16.3 Roteiro técnico da demo

O roteiro de palco está em [`../pitch/DEMO_SCRIPT.md`](../pitch/DEMO_SCRIPT.md). Com
`T` = sexta-feira, 2026-10-23 (exemplo):

1. Maria em `T`: dia 18 de 30, verde, vence 2026-11-04.
2. "+7 dias" → hoje = 2026-10-30: dia 25, faltam 5, amarelo. A biópsia era em
   2026-10-25 e ninguém registrou: selos "Data passou sem registro" e "Sem notícia há
   10 dias" (a última notícia foi o agendamento, em 2026-10-20). Alertas
   `DEADLINE_WARNING`, `MISSED_DATE` e `SILENCE` para a navegadora. A cor vem do prazo
   (amarelo) e continuaria amarela só pelo silêncio.
3. A navegadora cola o laudo maligno; a IA sugere; ela muda o `reportDate` para hoje
   (a data fixa do laudo fictício não bate com a data simulada) e confirma
   `[SUPOSIÇÃO: o campo editado na demo é o reportDate]`.
4. "30 dias: cumpriu" (2026-10-30 ≤ 2026-11-04). O D60 vence em 2026-12-29. A janela vai
   até 2026-12-27, então o card cai em "Depois".
5. A mensagem neutra aparece no simulador, e o link da paciente abre numa segunda
   janela, em modo celular.
6. O caso 2 (vermelho, falta de vaga) mostra a escada até a 2ª CRS.
7. Fecha na aba Concluídos, com as métricas.

Atenção ao passo 4: o card só cai em "Depois" se a data simulada for de quinta a
domingo. De segunda a quarta, `T+7+60` ainda fica dentro da janela de 9 semanas. Ver os
riscos (seção 20).

## 17. Módulos do NestJS

| Módulo | Conteúdo | Observação |
| --- | --- | --- |
| `clock` | `Clock` (porta), `SystemClock`, leitura do `DemoClockState` | Global. Sem `DEMO_MODE`, o deslocamento é sempre 0 |
| `cases` | `domain/` (`computeCaseStatus`, transições, `DEADLINE_RULES`, datas, alertas, mensagens, métricas, todas funções puras), `CasesController`, `AlertsController`, `MetricsController`, porta `CaseRepository` e `PrismaCaseRepository` | O domínio não importa Prisma nem Nest |
| `report-extraction` | Porta `ReportExtractor`, `GeminiReportExtractor`, `MockReportExtractor`, `IdentifierFilter`, controller de `report-extractions` | Reaproveita o padrão de fallback do chat |
| `patient-access` | `GET /api/public/p/:token`, emissão e revogação de token | Throttle próprio |
| `demo` | `/api/demo/*`, reset e seed | Registrado só com `DEMO_MODE=true` (por exemplo, com `ConditionalModule.registerWhen` do `@nestjs/config`, a confirmar na versão instalada) |

- **Comunicação:** templates calculados no domínio; envio real por **SMS e e-mail**
  fica fora do MVP. WhatsApp é apenas visão de pitch, não integração implementada
  (ADR 0007).
- **Confiança da extração:** `confidence` é rótulo heurístico, sem probabilidade
  calibrada do Gemini (ADR 0008).
- `computeCaseStatus` fica só no backend (`backend/src/cases/domain`). A API devolve o
  caso já calculado.
- O `Clock`:
  - `today()`: `YYYY-MM-DD` em `America/Sao_Paulo`, com `Intl.DateTimeFormat`
    (`formatToParts`) sobre `now()`;
  - `now()`: instante real mais `offsetDays × 86.400.000 ms`.
- As contas de dias convertem `YYYY-MM-DD` em número de dias (`Date.UTC(a, m − 1, d) /
  86.400.000`). Nenhuma dependência nova de datas.
- Sem cron e sem `@nestjs/schedule` (ADR 0006).

## 18. Estratégia de testes

Test-first em todas as histórias: o teste é escrito antes, roda, falha pelo motivo
certo, e a falha é registrada em `docs/tasks/<KEY>/progress.txt`.

### 18.1 Backend unitário (Jest)

- `computeCaseStatus`, em tabela, com os exemplos da seção 5.5.
- Testes de borda:
  - dia 30 ainda no prazo (amarelo); dia 31 vermelho;
  - faltam 8 dias (verde) e faltam 7 (amarelo); no D60, 15 e 14;
  - `reportDate = requestedAt + 30` cumpriu; `+ 31` não cumpriu;
  - `treatmentStartedAt = reportDate + 60` cumpriu; `+ 61` não cumpriu;
  - silêncio de 6 dias (verde) e de 7 (amarelo);
  - data agendada hoje: sem selo; data de ontem sem registro: selo e amarelo;
  - "Ciente" não zera o silêncio; `CORRECTION` também não;
  - vermelho com silêncio continua vermelho, com o selo;
  - exceção não muda a cor;
  - laudo inconclusivo mantém o `requestedAt` original;
  - correção de `requestedAt` muda o vencimento;
  - caso fechado não tem cor.
- Matriz de transições: cada par (estado, evento) fora da tabela 4.3 é rejeitado.
- `Clock`, teste de virada: 23h30 em `America/Sao_Paulo` (02h30 UTC do dia seguinte)
  ainda é o mesmo dia local. Ex.: `2026-10-24T02:30:00Z` → `today() = 2026-10-23`.
- Alertas: escada completa e chave estável.
- Mensagens: todos os templates renderizados reprovam se tiverem uma palavra proibida.
- Mock e filtro: os 3 laudos fictícios.
- `confidence`: aceita só `high|medium|low`; nunca número; o mock deriva da regra; o
  servidor pode rebaixar quando o trecho não é literal; não altera o estado do caso.
- Métricas: fórmulas com numerador e denominador conhecidos.

### 18.2 Golden fixtures

- **Os 3 laudos:** o mock tem que devolver `malignant`, `benign` e `inconclusive`, e o
  texto filtrado não pode conter o nome, o CPF nem o CNS falsos.
- **A Maria:** a linha do tempo dela, avaliada em `T`, `T+7` e depois da confirmação,
  tem que dar exatamente o roteiro da seção 16.3.
- **Teste que quebra de propósito:** uma versão de `computeCaseStatus` com a regra "dia
  30 ainda no prazo" invertida (vencimento em `requestedAt + 29`) roda contra as
  asserções da Maria e de borda, e **elas precisam reprovar**. Se passarem, as
  asserções não protegem a regra.

### 18.3 Backend e2e (Jest + Supertest)

- Todo endpoint novo: caminho feliz, 400, 401, 404, 409 e 429 onde se aplicam.
- `Clock` sobrescrito no `TestingModule`.
- Os testes de `/api/demo/clock` numa suíte própria, com `DEMO_MODE=true`, que zera o
  relógio no `afterEach`.
- Uma suíte sem `DEMO_MODE` prova que `/api/demo/*` devolve 404.
- Truncate só das tabelas do Dia 30 no `beforeAll`.
- `LLM_PROVIDER=mock`, como o setup e2e atual já força.
- Duplo clique: duas confirmações seguidas → 201 e 409.
- Link da paciente: inexistente e revogado devolvem o mesmo 404; a resposta não tem
  `fullName`, `cns` nem palavra proibida.
- Extração: `confidence` inválido ou numérico → 400; JSON inválido → fallback mock com
  `invalid_output`.

### 18.4 Frontend (Vitest + Testing Library)

- Agrupamento por semana (segunda a domingo), "Vencidos" e "Depois".
- Ordem dentro da coluna (cor, dias restantes, gatilho).
- Rótulos em texto ("No prazo", "Atenção", "Vencido") e `aria-label` do card.
- Barra de demo só aparece com `GET /api/demo/status` em 200.
- Responsividade: o calendário usa lista vertical abaixo de 768px; detalhe e
  formulários empilham; a página pública não tem overflow horizontal; alvos de toque
  com 44px.
- Sem Playwright (seria dependência nova). O layout real é validado no checklist manual.

### 18.5 Smoke e checklist manual

- `scripts/smoke.mjs` estendido com a história inteira da demo pela API (precisa de
  `DEMO_MODE=true`).
- Checklist manual da UI, com print, em `docs/deliveries/`: calendário, teclado,
  detalhe, confirmação do laudo e link da paciente.
- **Responsividade:** validar em 360×640, 768×1024, 1280×800 e 1440×900; sem overflow
  horizontal fora da rolagem intencional do calendário; botões com 44×44px; link da
  paciente em uma coluna.

## 19. Plano de entrega

Seis histórias, uma por PR, nesta ordem. Cada PR cita os RFs que entrega.

| Story | Entrega | RFs |
| --- | --- | --- |
| D30-001 | Contratos Zod, modelo Prisma, migration e `computeCaseStatus` com os testes das regras de prazo, silêncio, selos, cores e transições | RF-012 a RF-018 (regras de domínio) |
| D30-002 | API de casos e eventos, `Clock`, endpoints de demo, `DEMO_MODE` e `REPORT_EXTRACTION_TIMEOUT_MS` no `env.ts` | RF-011, RF-017, RF-018, RF-030 |
| D30-003 | `ReportExtractor` (mock, Gemini e filtro) e o fluxo de confirmação | RF-019, RF-020, RF-021 |
| D30-004 | Telas de login, calendário e detalhe (absorve o FEAT-001) | RF-022, RF-023, RF-032 |
| D30-005 | Alertas, mensagens, link da paciente e Concluídos com as métricas | RF-024 a RF-029 |
| D30-006 | Seed, reset e roteiro da demo | RF-031 |

### Ordem de corte

Se o tempo apertar, sai nesta ordem:

1. o mini painel de métricas;
2. a escada para os outros destinatários (fica só o alerta da navegadora);
3. o link público (fica o simulador de mensagens no detalhe).

**Nunca cortar** o calendário nem o fluxo laudo → IA → confirmação.

### Critério de "Done" de cada história

- Teste escrito antes, falhando, com a falha registrada.
- Suíte, lint, typecheck e build verdes.
- E2e dos endpoints novos.
- Checklist com print para as telas.
- Evidência em `docs/deliveries/`.
- RF citado no PR.
- No máximo 50 arquivos por PR.

## 20. Riscos

| Risco | Efeito | Mitigação |
| --- | --- | --- |
| Data do pitch de segunda a quarta | No passo 4, o D60 da Maria cai dentro da janela, e não em "Depois" | Conferir o dia da semana na véspera; se for o caso, usar "+8 dias" ou ajustar o pedido da Maria no seed `[DECISÃO PENDENTE]` |
| Gemini lento ou fora do ar no palco | A extração demora ou falha | Timeout de 8 s cai para o mock; plano B com `LLM_PROVIDER=mock` |
| `Case` ser nome reservado no Prisma | Migration não gera | `prisma validate` no primeiro passo do D30-001; alternativa `CareCase` |
| Filtro de identificadores incompleto | Dado pessoal vai para o Gemini | Demo só com laudo fictício; regra de produção pendente |
| 60 dias sem evento intermediário | Todo caso em `DIAGNOSIS_CONFIRMED` fica amarelo por silêncio depois de 7 dias | Assumido como "silêncio é alerta"; `TREATMENT_SCHEDULED` pendente |
| Deslocamento de relógio vazar para fora da demo | Datas erradas | O deslocamento só vale com `DEMO_MODE=true`, e `DEMO_MODE` é bloqueado em produção |
| 24 h para 6 PRs | Histórias incompletas | Ordem de corte da seção 19 |

## 21. Pendências

### `[DECISÃO PENDENTE]`

- `Patient` separado do `Case` (fase 1).
- Regra de produção para o texto do laudo e para o envio ao provedor externo (LGPD).
- A extração poderia gerar o `REPORT_RECEIVED` sozinha.
- Remarcação (`EXAM_SCHEDULED` em `EXAM_SCHEDULED`) permitida; `EXAM_SCHEDULED`/`EXAM_DONE`
  → `EXAM_TO_RESCHEDULE` direto não permitido.
- Silêncio contado pelo `recordedAt`, e não pelo `occurredAt`.
- Evento `TREATMENT_SCHEDULED` para o trecho de 60 dias.
- Mock com palavras dos dois grupos → `inconclusive`.
- `fullName` fora de todas as respostas, inclusive do detalhe.
- JWT nas rotas de demo.
- `DEMO_MODE` bloqueado com `NODE_ENV=production`.
- Denominadores das métricas de prazo (vencidos abertos dentro; `CLOSED_EXCEPTION` fora,
  contado à parte).
- Mensagem nova quando uma correção muda um valor já "enviado".
- Se os 5 minutos do roteiro são o pitch inteiro ou só a demo (`DEMO_SCRIPT.md`).
- Ajuste do seed se a data do pitch cair de segunda a quarta.

### `[DADO FALTANDO]`

- Risco de câncer na suspeita clínica sem mamografia (ordem dos cards).
- Onde Charqueadas faz mamografia e biópsia hoje, quem exerce a navegação no município
  e como a navegadora fica sabendo dos casos (`EVIDENCE.md`, seção 15).

### `[SUPOSIÇÃO]` a validar com a gestão

- Os limites de `DEADLINE_RULES` (7, 14, 7, 3 e 30 dias).
- O link valer 30 dias depois do fechamento.
- O rate limit do link (10 por minuto) e o limite de 16.000 caracteres do laudo.
- O timeout de 8000 ms.

## 22. Decisões da entrevista de 23/10/2026

Respostas do time em três rodadas. Onde uma rodada corrige a anterior, vale a mais nova.

### Modelo e estados

- `CaseEvent` append-only (`type`, `occurredAt`, `recordedAt`, `userId`, `payload`), mais
  o `status` em cache no `Case`.
- Enums em inglês, rótulos em PT e tabela com o equivalente no Conass.
- Transições da seção 4.3; caso fechado não reabre; transição inválida → 409.
- Exceção nunca suspende o prazo: anota e põe selo. Recusa definitiva ou óbito fecham
  como `CLOSED_EXCEPTION`, só por ação explícita, registrando "cumpriu/não cumpriu"
  até aquela data. Ausência não fecha.
- `CORRECTION` com `correctsEventId`, novos valores e motivo obrigatório; só para datas
  e dados, nunca para transições; o cálculo usa o valor corrigido.
- `Case` único com campos fictícios (`fullName`, `initials`, `cns`, `birthDate`,
  gatilho). `Patient` separado fica pendente. O `fullName` só serve ao filtro.

### Prazos

- Dia zero = `requestedAt` (data do pedido, não do cadastro); dias corridos; o dia 30
  ainda está no prazo.
- Fuso `America/Sao_Paulo`; datas sem hora.
- `requestedAt` no passado é permitido; no futuro, 400.
- 60 dias contam do `reportDate`; `reportDate` entre `requestedAt` e hoje.
- `treatmentStartedAt` tem tipo (cirurgia, quimioterapia ou radioterapia).
- Limites `[SUPOSIÇÃO]` numa constante central: 7 dias (D30), 14 dias (D60), 7 dias de
  silêncio.
- Laudo inconclusivo → `EXAM_TO_RESCHEDULE`, sem reiniciar os 30 dias.

### Silêncio (rodada 3)

- Só eventos de etapa contam como notícia; "Ciente" e correção não zeram o silêncio.
- Data agendada no futuro suspende o silêncio até o dia seguinte a ela; data passada
  sem `EXAM_DONE` dá o selo "Data passou sem registro" na hora.
- Silêncio no verde → amarelo; no vermelho, continua vermelho com selo.

### Tempo e demo

- Sem cron e sem `@nestjs/schedule`: função pura, `Clock` injetável e deslocamento no
  banco (ADR 0006).
- `/api/demo/clock/advance`, `/api/demo/clock/reset`, `/api/demo/reset` e
  `/api/demo/status`, só com `DEMO_MODE=true`; fora disso, 404.
- Barra de demo com "+1 dia", "+7 dias", "Resetar" e a data simulada.
- `REPORT_EXTRACTION_TIMEOUT_MS` com padrão de 8000 ms `[SUPOSIÇÃO]`; no código, só no
  D30-002.
- Plano B: `LLM_PROVIDER=mock` assumido, vídeo gravado e reset antes de subir ao palco.

### Datas e contratos (rodada 3)

- Sem dependência nova: `YYYY-MM-DD` no Zod, `@db.Date` no Prisma, dias inteiros e
  "hoje" com `Intl.DateTimeFormat`, só no `Clock`.
- `computeCaseStatus` só no backend; a API devolve o caso calculado.
- Um único `POST /api/cases/:id/events` com `discriminatedUnion('type')`.
- Extração guardada no servidor com `extractionId`, sem mudar o estado; o servidor
  calcula os campos alterados.
- Mensagens calculadas na leitura, sem tabela.
- `GET /api/cases?scope=open|closed`; agrupamento no cliente; duplo clique → 409.

### IA

- Porta `ReportExtractor` com Zod em `packages/contracts`; o `ChatProvider` não muda.
- JSON: `examType`, `reportDate`, `malignancy`, `confidence`, `evidenceQuote`,
  `provider`.
- JSON inválido → mock, com o fallback registrado.
- Mock por palavra-chave e regex de data.
- A navegadora edita todos os campos; `REPORT_CONFIRMED` guarda a sugestão, o valor
  confirmado e os campos alterados.
- Texto bruto só em `DEMO_MODE`; filtro de CPF, CNS e nome antes do Gemini, mesmo na
  demo.
- Selo de origem: "Gemini" ou "regra local".

### Calendário e UI

- Semana atual mais 8, começando na segunda; "Vencidos" à esquerda e "Depois" à direita.
- Card na semana do vencimento do prazo aberto.
- Ordem: cor, dias restantes, gatilho (BI-RADS 5, BI-RADS 4, suspeita clínica).
- Acessibilidade: rótulo em texto e ícone; card como `<button>` com `aria-label`.
- Abaixo de 768px, lista vertical por semana; link da paciente pensado para celular.

### Acesso, paciente, mensagens, alertas e métricas

- Login só da navegadora, sem roles.
- Link `/p/:accessToken`: 32 bytes, hash no banco, mostrado uma vez, revogável, 404
  igual, rate limit próprio, só leitura, vale mais 30 dias depois do fechamento
  `[SUPOSIÇÃO]`.
- Templates fixos, com teste das palavras proibidas; a IA nunca escreve para a paciente.
- Escada: amarelo ou silêncio → navegadora; faltam 3 dias ou menos → regulação
  `[SUPOSIÇÃO]`; vencido → coordenação e SMS; vencido com falta de vaga → 2ª CRS.
- "Ciente" gera `ALERT_ACKNOWLEDGED`; o alerta só some quando a causa some.
- Métricas: % sem informação (parecida com a de Porto Alegre, não igual), IA principal e
  secundária, % em até 30 e % em até 60 dias.

### Escopo e entrega

- Seis histórias (D30-001 a D30-006), uma por PR, com teste antes.
- Ordem de corte: métricas, escada, link público. Nunca cortar o calendário nem o
  fluxo do laudo.
- FEAT-002 vai para "Fora do MVP": o produto não é chatbot; a IA estrutura laudos.
- Vocabulário: "antecipa", nunca "preditivo". Não usar "O SUS não tem relógio".
