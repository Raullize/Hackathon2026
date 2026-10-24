# Operação — como o Dia 30 funciona nas unidades

> Como o Dia 30 sairia do protótipo e funcionaria de verdade em Charqueadas.
> **É uma proposta do time, não a descrição de algo que já existe.** Os fatos
> citados têm fonte em [`EVIDENCE.md`](./EVIDENCE.md); o resto é desenho nosso,
> a validar com quem trabalha na rede. Linha piloto: câncer de mama.
> `[SUPOSIÇÃO]` = inferência nossa. `[DADO FALTANDO]` = lacuna a fechar.

## 1. Quem faz o quê

| Papel | Quem | O que faz no Dia 30 |
| --- | --- | --- |
| Dona da lista | Navegadora do município. Se ainda não houver, a enfermeira responsável pela regulação ou pela saúde da mulher `[SUPOSIÇÃO]` | Abre os casos, olha a lista todo dia, liga para a paciente e cobra o próximo passo |
| UBS | Equipe de saúde da família | Registra a suspeita, faz a busca ativa quando chega um alerta e recebe a mulher de volta no seguimento |
| Regulação municipal | Quem agenda no GERCON | Vê os casos perto do prazo e prioriza o agendamento |
| Prestador e hospital | Serviço de diagnóstico e hospital de referência (pelo Plano Estadual de Oncologia de 2020, o Hospital Ana Nery, em Santa Cruz do Sul 🟡) | Marca cada etapa concluída: exame feito, laudo pronto, consulta, início do tratamento |
| Paciente | A própria mulher | Vê o próprio relógio, o próximo passo e os seus direitos |

## 2. Como um caso entra

**Gatilhos (linha de mama):**

- Laudo de mamografia **BI-RADS 4 ou 5**, o mesmo critério de entrada da OCI 2 de mama.
- Suspeita clínica, com os sinais da lista da OCI 1 de mama (por exemplo, nódulo
  mamário em mulher com mais de 50 anos, ou nódulo endurecido e fixo em qualquer idade).

**Portas de entrada, da mais simples à mais integrada:**

1. A UBS ou a navegadora cadastra o caso à mão (piloto).
2. A regulação municipal abre o caso quando o encaminhamento entra no GERCON.
3. O sistema importa os laudos alterados do SISCAN (fase futura).

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

## 7. Dados e LGPD

- Dado de saúde é dado pessoal sensível. A base legal é a LGPD, art. 11, II, "b"
  (execução de políticas públicas pela administração) e "f" (tutela da saúde, por
  profissionais e serviços de saúde).
- Acesso por papel: a UBS vê os casos do seu território, a regulação vê a sua
  fila, a paciente vê só o próprio caso.
- Registro de quem viu e de quem alterou cada caso.
- O protótipo usa só dados fictícios.

## 8. Implantação por fases

| Fase | O que é | Integração |
| --- | --- | --- |
| 0. Protótipo (hackathon) | Demo com dados fictícios | Nenhuma |
| 1. Piloto manual | A navegadora cadastra os casos de Charqueadas | Nenhuma: lançamento à mão |
| 2. Importação | Puxar os laudos alterados do SISCAN e os encaminhamentos do GERCON | Relatórios e exportações desses sistemas `[SUPOSIÇÃO: viabilidade a confirmar]` |
| 3. Rede nacional | Trocar eventos com a RNDS (Rede Nacional de Dados em Saúde) | RNDS |

## 9. Perguntas prováveis da banca

| Pergunta | Resposta curta |
| --- | --- |
| "Isso já existe?" | Existem peças: o e-SUS registra, o GERCON organiza a fila, a OCI paga o pacote no prestador e o SISCAN acompanha exames alterados. Nas nossas buscas, nenhuma conta o prazo da lei da suspeita até o tratamento para todos verem (`EVIDENCE.md`, seção 8) |
| "Quem alimenta o sistema?" | No piloto, a navegadora. Depois, importação do SISCAN e do GERCON |
| "E se o hospital não atualizar?" | Silêncio é alerta: o caso fica amarelo e a navegadora liga |
| "O Dia 30 cria vaga?" | Não. Mostra quem está mais perto de estourar o prazo e com mais risco, e gera a prova para pedir a vaga |
| "Por que não uma planilha?" | A planilha fica no computador de uma pessoa. O Dia 30 é o mesmo relógio para UBS, regulação, hospital e paciente, com alerta |
| "E a LGPD?" | LGPD, art. 11, II, "b" e "f"; acesso por papel; registro de acesso; demo com dados fictícios |
| "Por que mama?" | Gatilho claro no laudo (BI-RADS), lei própria de navegação (14.450/2022), dados por estado no INCA, e o RS vai mal: só 44,4% tratadas em até 60 dias |
| "E os outros cânceres?" | O relógio é o mesmo. Mama é o piloto |
| "Como conta o dia zero?" | Pelo pedido dos exames por suspeita, como diz a lei; o detalhe se combina com a gestão |
| "Quem paga?" | Estados e municípios já precisam implementar a navegação (Lei 14.758/2023 e Portaria 6.592/2025). O modelo de cobrança ainda não está definido `[DADO FALTANDO]` |
| "Como medir o sucesso?" | Percentual de diagnósticos em até 30 dias, percentual de tratamentos em até 60 dias e percentual de casos sem informação (meta: zero) |

## 10. Pontos fracos (assumidos)

- Enquanto não houver integração, depende de alguém lançar os dados.
- Não cria vaga de biópsia nem de tratamento.
- O volume em Charqueadas é pequeno (cerca de 10 casos de câncer de mama por ano
  `[SUPOSIÇÃO]`). Isso favorece o piloto manual, mas faz a banca perguntar "por que
  não uma planilha?".
- `[DADO FALTANDO]` Onde Charqueadas faz mamografia e biópsia hoje e se já tem
  navegadora.

## 11. Roteiro de entrevista (regulamento, item 6.4)

24/10/2026 é sábado, e a UBS provavelmente está fechada `[SUPOSIÇÃO]`. Alternativas:
ligar ou mandar mensagem para alguém da atenção básica, agente comunitário de saúde,
alguém da regulação, ou uma paciente ou familiar, com consentimento e sem guardar
dados pessoais no repositório.

1. Quando a UBS suspeita de câncer de mama, o que acontece no mesmo dia?
2. Onde a mulher faz a mamografia e a biópsia? Quanto tempo leva cada etapa?
3. Quem acompanha a mulher entre a UBS e o hospital? Existe navegadora?
4. Como a UBS fica sabendo que o exame saiu ou que o tratamento começou?
5. Já aconteceu de perder uma paciente no caminho? Como descobriram?
6. O que vocês usam hoje para acompanhar: GERCON, SISCAN, planilha, caderno?
7. O que mais atrasa: vaga, transporte, laudo ou consulta?
8. Se um sistema avisasse "a Maria está no dia 25 de 30", quem agiria e o que faria?

## 12. O que muda na demo

- Personagem fictícia, entre 50 e 69 anos, com BI-RADS 5 em outubro.
- Mostrar o relógio de 30 dias andando, um alerta de silêncio e a escada de alerta.
- Mostrar a visão da paciente, sem a palavra "câncer".
- Separar "Hoje" (protótipo) de "Visão" (integrações), como pede o
  [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
