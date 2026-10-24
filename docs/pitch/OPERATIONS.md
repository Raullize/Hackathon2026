# Operação — como o CareFlow funciona nas unidades

> Como o CareFlow sairia do protótipo e funcionaria de verdade em Charqueadas.
> **É uma proposta do time, não a descrição de algo que já existe.** Os fatos
> citados têm fonte em [`EVIDENCE.md`](./EVIDENCE.md); o resto é desenho nosso,
> a validar com quem trabalha na rede. Linha piloto: câncer de mama.
> `[SUPOSIÇÃO]` = inferência nossa. `[DADO FALTANDO]` = lacuna a fechar.

## 1. Quem faz o quê

| Papel | Quem | O que faz no CareFlow |
| --- | --- | --- |
| **Navegadora** | Função já prevista em lei (Lei 14.758/2023, art. 13; Lei 14.450/2022; Portaria GM/MS 6.592/2025). No piloto, quem exerce o papel é a referência municipal `[SUPOSIÇÃO: confirmar na entrevista]` | **Única usuária do sistema.** Abre os casos, olha a lista todo dia, lança os eventos, cola o laudo, confirma a sugestão da IA e cobra o próximo passo |
| Médico assistente | Quem pede o exame na rotina | **Fica fora do CareFlow.** Pede pelo caminho de sempre (e-SUS PEC, requisição do SISCAN, papel). **Zero trabalho novo para o médico** |
| UBS | Equipe de saúde da família | **Não registra no CareFlow.** Faz a busca ativa quando a navegadora aciona e recebe a mulher de volta no seguimento |
| Regulação municipal | Quem agenda no GERCON | **Não registra no CareFlow.** Recebe o alerta e prioriza o agendamento |
| Prestador e hospital | Serviço de diagnóstico e hospital de referência (pelo Plano Estadual de Oncologia de 2020, o Hospital Ana Nery, em Santa Cruz do Sul 🟡) | **Não tem conta no CareFlow.** A navegadora lança os eventos a partir da informação que o serviço já produz e cobra o retorno |
| Paciente | A própria mulher | **Só recebe.** Vê o próprio relógio, o próximo passo e os direitos no link de leitura; não envia nada |

Coordenação da atenção básica, SMS e 2ª CRS também **não têm login**: aparecem apenas
como destinatários de alerta na seção 5.

## 2. Como um caso entra

**Gatilhos (linha de mama):**

- Laudo de mamografia **BI-RADS 4 ou 5**, o mesmo critério de entrada da OCI 2 de mama.
- Suspeita clínica, com os sinais da lista da OCI 1 de mama (por exemplo, nódulo
  mamário em mulher com mais de 50 anos, ou nódulo endurecido e fixo em qualquer idade).

**Como a navegadora fica sabendo do caso (sem depender de o médico avisar):**

1. **Fila da regulação (GERCON/SISREG):** é por onde passa o pedido de biópsia ou de
   consulta especializada. `[SUPOSIÇÃO: confirmar na entrevista]`
2. **SISCAN, módulo Seguimento:** lista as mulheres com exame alterado de mama
   (BI-RADS 4/5), com atualização mensal; funciona como rede de segurança.
3. **Resultados BI-RADS 4/5 enviados pelos prestadores à UBS:** modelo de Porto
   Alegre, descrito em [`EVIDENCE.md`](./EVIDENCE.md), seção 8.

A navegadora confere a fonte, cadastra o caso no CareFlow e começa a cobrar o próximo
passo. O funcionamento em Charqueadas ainda precisa ser confirmado na entrevista
`[SUPOSIÇÃO: confirmar na entrevista]`.

O médico **não muda nada**: ele pede o exame pelo caminho de sempre (e-SUS PEC,
requisição do SISCAN, papel). No futuro, a importação do SISCAN e da RNDS (FHIR) pode reduzir a
digitação da navegadora `[SUPOSIÇÃO: viabilidade a confirmar]`; o médico continua sem
trabalho novo.

### Protocolo de entrada da UBS

O canal pode variar por UBS/região; o protocolo não.

| Item | Regra do piloto |
| --- | --- |
| Canal principal | E-mail institucional (recomendado) ou WhatsApp institucional |
| Quem envia | Recepção/administração da UBS, com substituto definido |
| Prazo | Pedido até 14h → envio até 17h do mesmo dia útil; depois → próximo dia útil até 10h |
| Conferência | Navegadora olha a caixa 2× por dia |
| Formato | Paciente, CNS, data do pedido, gatilho, exame e UBS |
| Fallback | Fila da regulação, lista BI-RADS 4/5 do prestador e SISCAN |
| Registro | `source` e data de recebimento |

**A regulação agenda. A navegadora registra o evento, acompanha e cobra o próximo passo
quando necessário. O CareFlow não é um sistema de agendamento; é o relógio que prova se
a data combinada está sendo cumprida.**

A navegadora pode colar o texto do pedido; a IA pré-preenche `requestedAt`, gatilho e
exame, e ela confirma. PDF é interface no MVP; só texto é funcional. Se o caso for
cadastrado depois de `requestedAt + 30`, entra vermelho com **“Descoberta tardia”** e o
prazo não reinicia.

**Ficha do caso, com quatro campos:**

| Campo | Exemplo |
| --- | --- |
| Quem | Nome e CPF/CNS |
| Gatilho | BI-RADS 5 / nódulo palpável |
| Dia zero | Data do pedido dos exames por suspeita |
| Próximo passo e responsável | "Biópsia: regulação municipal" |

O dia zero exato precisa ser combinado com a gestão. O próprio Conass diz que "o
marco legal deve ser parametrizado conforme o evento e a interpretação normativa
aplicável".

## 3. Os dois relógios

| Relógio | Começa | Termina | Base legal |
| --- | --- | --- | --- |
| 30 dias | Pedido dos exames por suspeita (BI-RADS 4/5 ou suspeita clínica) | Laudo que confirma ou descarta o câncer | Lei 12.732/2012, art. 2º, § 3º (Lei 13.896/2019) |
| 60 dias | Laudo anatomopatológico de câncer | Primeiro tratamento: cirurgia, quimioterapia ou radioterapia | Lei 12.732/2012, art. 2º |

Cores: verde (no prazo), amarelo (perto de vencer ou parado), vermelho (vencido).
Os limites do amarelo são escolha nossa, a combinar com a gestão `[SUPOSIÇÃO]`.

## 4. Três regras que fazem o relógio funcionar

- **Silêncio é alerta.** Uma etapa que fica dias sem atualização vira amarelo,
  mesmo sem atraso confirmado. Não ter notícia é o risco: em Porto Alegre, 32% dos
  casos de mama ficaram sem informação de tempo até o tratamento.
- **Descartado também volta.** Se a biópsia der benigno, o caso fecha com o
  resultado e volta para a UBS com o seguimento indicado. Ninguém sai da lista sem
  destino.
- **Exceção com motivo.** Recusa, ausência, contraindicação, pendência clínica,
  falta de transporte ou de vaga ficam registradas com o motivo. O relógio não
  esconde o atraso (é a mesma lista de exceções do Conass).

## 5. Escada de alerta

| Quando | Quem recebe | O que faz |
| --- | --- | --- |
| Etapa parada ou relógio amarelo | Navegadora | Liga para a paciente e para o serviço |
| Perto de vencer | Regulação municipal | Prioriza o agendamento no GERCON |
| Prazo vencido | Coordenação da atenção básica e secretaria municipal de saúde | Leva o caso para a gestão |
| Vencido e sem vaga na rede | 2ª Coordenadoria Regional de Saúde (Charqueadas fica na 2ª CRS) | Pede vaga ou redistribuição regional |

## 6. O que a paciente vê

- O próprio relógio e o próximo passo, com local e data.
- Os direitos: 30 dias para os exames e 60 dias para começar o tratamento.
- **Sem a palavra "câncer"** na tela e nas mensagens: "investigação da mama". Na
  fase de suspeita ainda não há diagnóstico (muitas terão resultado benigno), e
  outra pessoa pode ver a notificação.
- A Lei 14.758/2023 (art. 4º, parágrafo único) prevê a "consulta de posição em fila
  de espera".
- **Canais:** SMS e e-mail no escopo de integração. Na demo, a mensagem é simulada. No
  pitch, a visão é integração direta por WhatsApp, SMS e e-mail; o WhatsApp **não** está
  integrado nesta fase.
- **Responsividade:** a visão da paciente é mobile-first e funciona de 360px a 1440px,
  sem rolagem horizontal.

### Cobrança interna x notificação da paciente

| Ação | Quem | Canal no MVP |
| --- | --- | --- |
| Cobrar UBS, regulação ou hospital | Navegadora | Ligação manual, e-mail ou WhatsApp institucional |
| Notificar a paciente | Sistema/navegadora | SMS/e-mail simulados; WhatsApp é visão |
| Abrir o relógio e os direitos | Paciente | Link de leitura |

No MVP, nenhum canal externo envia de verdade. A interface mostra a prévia e registra
a ação; a ligação é manual e real. A cobrança interna pode ser registrada como
`CONTACT_LOGGED` (canal + observação), sem mudar estado nem zerar o silêncio.

## 7. Dados e LGPD

- Dado de saúde é dado pessoal sensível. A base legal é a LGPD, art. 11, II, "b"
  (execução de políticas públicas pela administração) e "f" (tutela da saúde, por
  profissionais e serviços de saúde).
- **Só a navegadora tem login.** UBS, regulação, prestador, coordenação e 2ª CRS não
  acessam o painel; são destinatários de alerta e de cobrança.
- A paciente acessa apenas o próprio caso por um link de leitura, sem login.
- Registro de quem viu e de quem alterou cada caso.
- O protótipo usa só dados fictícios.

## 8. Implantação por fases

| Fase | O que é | Integração |
| --- | --- | --- |
| 0. Protótipo (hackathon) | Demo com dados fictícios | Nenhuma |
| 1. Piloto manual | A navegadora cadastra os casos de Charqueadas | Nenhuma: lançamento à mão |
| 2. Importação | Puxar os laudos alterados do SISCAN e os encaminhamentos do GERCON | Relatórios e exportações desses sistemas `[SUPOSIÇÃO: viabilidade a confirmar]` |
| 3. Rede nacional | Trocar eventos com a RNDS (Rede Nacional de Dados em Saúde) | RNDS, padrão **HL7 FHIR**, via Portal de Serviços do DATASUS; exige credenciamento do estabelecimento |
| Comunicação | SMS e e-mail no escopo; WhatsApp como visão | Provedores de SMS/e-mail; WhatsApp fora desta fase |

**Cuidados com integrações:**

- **RNDS:** o padrão é HL7 FHIR e o acesso passa pelo Portal de Serviços do DATASUS,
  com credenciamento do estabelecimento. `[DADO FALTANDO]` Não encontramos um modelo
  RNDS específico para laudo de mamografia ou anatomopatológico; confirmar antes de
  prometer integração.
- **SISCAN e e-SUS PEC:** não encontramos API pública para leitura. O LEDI do e-SUS é
  apenas de envio ao SISAB. A importação por relatório/exportação é hipótese
  `[SUPOSIÇÃO: viabilidade a confirmar]`; não prometer API que não foi verificada.

## 9. Perguntas prováveis da banca

| Pergunta | Resposta curta |
| --- | --- |
| "Isso já existe?" | Existem peças: o e-SUS registra, o GERCON organiza a fila, a OCI paga o pacote no prestador e o SISCAN acompanha exames alterados. Nas nossas buscas, nenhuma conta o prazo da lei da suspeita até o tratamento para todos verem (`EVIDENCE.md`, seção 8) |
| "Quem alimenta o sistema?" | A navegadora, que a lei já prevê, a partir da fila da regulação e do SISCAN. O médico não muda nada. No futuro, importação do SISCAN e a RNDS (FHIR) tiram até essa digitação |
| "E se o hospital não atualizar?" | Silêncio é alerta: o caso fica amarelo e a navegadora liga |
| "O CareFlow cria vaga?" | Não. Mostra quem está mais perto de estourar o prazo e com mais risco, e gera a prova para pedir a vaga |
| "Por que não uma planilha?" | A planilha fica no computador de uma pessoa. O CareFlow dá à navegadora um relógio com alertas, histórico e link de leitura para a paciente; a navegadora cobra UBS, regulação e hospital |
| "E a LGPD?" | LGPD, art. 11, II, "b" e "f"; só a navegadora acessa o painel; paciente só pelo link; registro de acesso; demo com dados fictícios |
| "Por que mama?" | Gatilho claro no laudo (BI-RADS), lei própria de navegação (14.450/2022), dados por estado no INCA, e o RS vai mal: só 44,4% tratadas em até 60 dias |
| "E os outros cânceres?" | O relógio é o mesmo. Mama é o piloto |
| "Como conta o dia zero?" | Pelo pedido dos exames por suspeita, como diz a lei; o detalhe se combina com a gestão |
| "Quem paga?" | Estados e municípios já precisam implementar a navegação (Lei 14.758/2023 e Portaria 6.592/2025). O modelo de cobrança ainda não está definido `[DADO FALTANDO]` |
| "Como medir o sucesso?" | Percentual de diagnósticos em até 30 dias, percentual de tratamentos em até 60 dias e percentual de casos sem informação (meta: zero) |

## 10. Pontos fracos (assumidos)

- Enquanto não houver integração, depende de a navegadora lançar os dados. O médico
  não muda nada.
- Não cria vaga de biópsia nem de tratamento.
- O volume em Charqueadas é pequeno (cerca de 10 casos de câncer de mama por ano
  `[SUPOSIÇÃO]`; carga mensal `[DADO FALTANDO]`). Isso favorece o piloto manual, mas
  faz a banca perguntar "por que não uma planilha?".
- `[DADO FALTANDO]` Onde Charqueadas faz mamografia e biópsia hoje e como a navegação
  está organizada no município.

## 11. Roteiro de entrevista (regulamento, item 6.4)

24/10/2026 é sábado, e a UBS provavelmente está fechada `[SUPOSIÇÃO]`. Alternativas:
ligar ou mandar mensagem para alguém da atenção básica, agente comunitário de saúde,
alguém da regulação, ou uma paciente ou familiar, com consentimento e sem guardar
dados pessoais no repositório.

1. Quando a UBS suspeita de câncer de mama, o que acontece no mesmo dia?
2. **Quando o médico pede uma biópsia de mama, quem fica sabendo além dele? Por onde
   passa o pedido?**
3. **Quantos casos de suspeita de mama por mês o município tem?** `[DADO FALTANDO]`
   carga da navegadora.
4. Onde a mulher faz a mamografia e a biópsia? Quanto tempo leva cada etapa?
5. Quem acompanha a mulher entre a UBS e o hospital? Quem exerce a navegação no
   município hoje?
6. Como a UBS fica sabendo que o exame saiu ou que o tratamento começou?
7. Já aconteceu de perder uma paciente no caminho? Como descobriram?
8. O que vocês usam hoje para acompanhar: GERCON, SISCAN, planilha, caderno?
9. O que mais atrasa: vaga, transporte, laudo ou consulta?
10. Se um sistema avisasse "a Maria está no dia 25 de 30", quem agiria e o que faria?

## 12. O que muda na demo

- Personagem fictícia, entre 50 e 69 anos, com BI-RADS 5 em outubro.
- Mostrar o relógio de 30 dias andando, um alerta de silêncio e a escada de alerta.
- Mostrar que **a navegadora é a única usuária**: ela cadastra, lança eventos, cola o
  laudo, confirma a IA e cobra o próximo passo.
- Dizer em voz alta: **"zero trabalho novo para o médico"**. Ele pede o exame pelo
  caminho de sempre.
- Mostrar a visão da paciente, sem a palavra "câncer", em modo celular (360px).
- Mostrar que a aplicação é responsiva: calendário, detalhe e link da paciente.
- Separar "Hoje" (protótipo, SMS/e-mail simulados) de "Visão" (integração real por
  WhatsApp, SMS e e-mail), como pede o [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
- Frase-âncora: "A lei criou a navegadora. Ninguém deu a ela uma ferramenta. O CareFlow
  é a ferramenta."
