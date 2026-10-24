# Impacto

> Toda métrica tem fonte ou rótulo de estimativa. Fontes em
> [`EVIDENCE.md`](./EVIDENCE.md). Efeito do Dia 30 não foi medido: o que está abaixo
> como "meta" é hipótese, não resultado.

## Beneficiários

| Grupo | Quantidade estimada | Como se beneficia |
| --- | --- | --- |
| Mulheres com mamografia BI-RADS 4/5 (50–69 anos), Brasil | 20.913 em 2024 🟢 (INCA 2025, Tabela 11) | Prazo visível, próximo passo e direitos claros |
| Idem, RS | 1.211 em 2024, cerca de 1 a cada 130 exames 🟢 | Idem |
| Mulheres com câncer de mama no RS | 3.720 casos novos por ano (estimativa 2023–2025) 🟢 | Tratamento mais perto dos 60 dias (hoje 44,4%) |
| Charqueadas | Cerca de 16,2 mil mulheres (cálculo nosso, Censo 2022) e cerca de 10 casos novos de mama por ano `[SUPOSIÇÃO]` | Piloto manual, com poucos casos |
| Navegadoras, UBS, regulação e gestor | `[DADO FALTANDO]` quantas navegadoras existem em Charqueadas | Lista única, alerta antes do vencimento, prova para cobrar vaga |

## Antes e depois

| Hoje | Com a solução |
| --- | --- |
| O atraso aparece meses depois, em dados de faturamento | O alerta chega antes do vencimento |
| Cada ponto sabe só do seu trecho; o retorno não chega à UBS | Um calendário com o mesmo prazo para UBS, regulação, hospital e paciente |
| Sem notícia, ninguém percebe (32% dos casos de mama de Porto Alegre sem informação de tempo) | Silêncio é alerta: o caso fica amarelo e a navegadora liga |
| A paciente espera sem saber o próximo passo nem o que a lei garante | Mensagem com o próximo passo, a data e o direito aos 30 e 60 dias |
| A mulher com laudo benigno some da lista sem destino | O caso fecha com o resultado e volta à UBS com o seguimento |
| Não há prova de que a vaga faltou | A exceção "falta de vaga" fica registrada e o alerta sobe até a 2ª CRS |

## Métricas de sucesso

Calculadas no sistema (fórmulas na spec, seção 15):

- % de diagnósticos em até 30 dias.
- % de tratamentos em até 60 dias. Base de comparação: RS, 44,4% em mama (2020–2024).
- % de casos sem informação (silêncio de 7 dias ou mais, ou data vencida sem
  registro). Meta: zero. **Parecida com a medida de Porto Alegre (32%), mas não
  igual**: não comparar como se fossem a mesma.
- Qualidade da IA: laudos confirmados sem alteração ÷ laudos confirmados.

Na demo: um caso fictício percorre o fluxo inteiro e o alerta chega antes do
vencimento.

## Escala

- **O que muda se 10x mais pessoas usarem?** O motor é uma função pura sobre eventos,
  calculada na leitura, sem cron nem fila (ADR 0006). O volume de Charqueadas é
  pequeno; para uma regional ou o estado, o gargalo passa a ser índice no banco e
  importação de dados `[SUPOSIÇÃO]`.
- **Custo marginal por usuário:** baixo no código. O custo variável é a chamada ao
  LLM por laudo; hoje, free tier do Gemini. `[DADO FALTANDO]` custo real em produção.
- **Parcerias necessárias:** a secretaria municipal de saúde (dona do piloto), a
  regulação (GERCON), a 2ª CRS e, na fase 2, acesso a exportações do SISCAN e do
  GERCON `[SUPOSIÇÃO: viabilidade a confirmar]`.
- **Por que há demanda:** a Lei 14.758/2023 e a Portaria 6.592/2025 obrigam estados e
  municípios a implementar a navegação, e o Conass descreve esta ferramenta como o
  que falta.

## Evidência de que acompanhar funciona (não é resultado nosso)

- Navegação de pacientes reduz o tempo do rastreamento ao diagnóstico e do
  diagnóstico ao tratamento (revisão de 61 revisões sistemáticas, *CA Cancer J Clin*
  2023) 🟢.
- O ganho da navegação foi maior onde o atraso era maior (Freund et al., *JNCI* 2014) 🟢.
- O NHS mede o relógio de cada paciente todo mês 🟢.
- Piloto do Instituto Avon em São João de Meriti (RJ): tratamento em até 60 dias de
  27% para 84% 🟡 (relatório do projeto, via imprensa; usar como história, não como
  prova).

## Riscos de impacto

- Enquanto não houver integração, o sistema depende de alguém lançar os dados.
- O Dia 30 não cria vaga de biópsia nem de tratamento. Ele mostra quem está mais
  perto de estourar e gera a prova para cobrar a vaga.
- O volume em Charqueadas é pequeno e a banca vai perguntar "por que não uma
  planilha?". Resposta: a planilha fica no computador de uma pessoa; o Dia 30 é o
  mesmo calendário para UBS, regulação, hospital e paciente, com alerta.
- Erro da IA ao ler um laudo: mitigado porque a IA só sugere e a navegadora confirma.
- Laudo é dado sensível (LGPD, art. 11): demo só com laudos fictícios, e a regra de
  produção é `[DECISÃO PENDENTE]` (`domain.md`).

## Ligação com o pitch

Este documento alimenta **Impacto Social** (20 pts) e ajuda no desempate.
