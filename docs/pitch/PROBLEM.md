# Problema

> Números e fontes em [`EVIDENCE.md`](./EVIDENCE.md); confira a coluna de confiança
> antes de pôr qualquer número no slide.
> `[SUPOSIÇÃO]` = inferência nossa. `[DADO FALTANDO]` = lacuna a fechar.

## Declaração

- **Problema:** a lei dá 30 dias para diagnosticar e 60 dias para tratar o câncer, mas
  ninguém acompanha esse prazo caso a caso enquanto ele corre. O atraso só aparece
  meses depois, em dados de faturamento.
- **Quem sofre:** a mulher com mamografia alterada (BI-RADS 4 ou 5) ou com suspeita
  clínica, e, no geral, quem tem suspeita de câncer. Sofrem também a equipe da UBS,
  que perde o seguimento, e a regulação e o gestor municipal, que respondem pelos
  prazos.
- **Hoje a pessoa resolve assim:** a informação depende de ligação, planilha ou
  memória de quem acompanha. O painel oficial (Painel-Oncologia) é retroativo: começa
  a contar no laudo e usa sistemas com prazo de envio de até um ano. O SISCAN tem um
  módulo de seguimento mensal, feito para coordenadores. Nas nossas buscas, nada conta
  o prazo da suspeita até o tratamento para todos verem (`EVIDENCE.md`, seção 8).
- **Por que isso importa agora:**
  - É Outubro Rosa. Todo mundo pede a mamografia; o problema começa quando ela volta
    alterada.
  - A Lei 14.758/2023, art. 4º, manda o poder público manter um sistema que registre
    as suspeitas de câncer e mostre a posição na fila. A Portaria 6.592/2025 criou o
    Programa de Navegação, e o Conass já descreve o que falta: "o sistema deve tornar
    o próximo risco de atraso acionável hoje".
  - A Lei 15.284/2025 garante mamografia a partir dos 40 anos. Mais exame sem mais
    biópsia aumenta a fila justamente no trecho que ninguém mede `[SUPOSIÇÃO]`.

## Evidências

| Evidência | Fonte | Data |
| --- | --- | --- |
| RS: só **44,4%** das mulheres com câncer de mama começaram o tratamento em até 60 dias (Paraná: 60,3%) 🟢 | INCA, *Controle do câncer de mama no Brasil: dados e números 2025*, Figura 26 | 2020–2024 |
| Brasil: **52,2%** passaram de 60 dias 🟢 | INCA 2025, Figura 24 | 2024 |
| O INCA mede a Lei dos 30 dias por um "indicador proxy" (biópsia → laudo). A espera entre o BI-RADS e a biópsia fica fora da medida 🟢 | INCA 2025 | 2025 |
| Porto Alegre, que monitora as mamografias alteradas: **32%** dos casos de mama sem informação de tempo até o tratamento 🟢 | Boletim Outubro Rosa, SMS/DVS | jan–ago/2024 |
| RS: **1.536** mortes por câncer de mama, cerca de 4 por dia 🟢 | INCA 2025, Tabela 2 | 2023 |
| Cada 30 dias de atraso até a cirurgia de mama: risco de morte **9% a 10% maior** 🟢 | Bleicher et al., *JAMA Oncology* | 2016 |
| Mama descoberta cedo: mais de 99% vivem 5 anos; com metástase, 32% 🟢 | American Cancer Society (SEER) | 2015–2021 |

O laboratório do RS não é o gargalo: 88,3% dos laudos de biópsia saem em até 30 dias
(INCA 2025, Tabela 22). O tempo se perde nas filas (`EVIDENCE.md`, seção 12). Não
dizer que "o RS demora em tudo".

Hipótese do time, a validar na entrevista: o trecho do BI-RADS alterado até a biópsia
é o mais escuro, porque ninguém publica esse tempo `[DADO FALTANDO]`.

## Personas

Personas de trabalho, a validar na entrevista (regulamento, item 6.4). Quadro
completo em [`domain.md`](../spec-driven-development/domain.md).

| Persona | Contexto | Dor | O que precisa |
| --- | --- | --- | --- |
| **Navegadora** | Função já prevista em lei; acompanha as pessoas com suspeita de câncer do município. **Única usuária do sistema.** | Não vê onde cada caso travou e descobre o atraso tarde | Uma ferramenta para ver, na semana, quem está perto do prazo, lançar eventos e cobrar o próximo passo |
| Médico assistente | Pede o exame pelo caminho de sempre (e-SUS PEC, SISCAN, papel); **fica fora do Dia 30** | Já tem trabalho suficiente; não quer mais uma ferramenta | **Zero trabalho novo** |
| Equipe da UBS | Recebe a mulher de volta e faz busca ativa quando acionada; **não registra no Dia 30** | Perde o seguimento quando a informação não volta | Ser acionada pela navegadora |
| Paciente | Saiu da UBS com uma suspeita (por exemplo, BI-RADS 4 ou 5) | Espera sem informação e não conhece os direitos | **Só recebe** mensagem e link de leitura |
| Gestor municipal e regulação | Respondem pelos prazos legais e pela fila | Só veem o atraso meses depois | Receber alerta e cobrança da navegadora; **não operam o sistema** |
| Prestador e hospital | Fazem exames, laudos e tratamento | O retorno não chega à UBS | **Não têm conta no Dia 30**: a navegadora lança os eventos e cobra o retorno |

## Recorte do MVP

- **O que o MVP resolve:** um calendário compartilhado dos dois prazos legais, com
  cor, alerta antes do vencimento, laudo estruturado pela IA (a navegadora confirma),
  mensagem para a paciente e métricas dos prazos. Linha piloto: câncer de mama.
- **O que fica de fora:** integração com e-SUS, SISCAN, GERCON e RNDS; WhatsApp real;
  perfis de acesso além da navegadora; agendar vagas (o Dia 30 não cria vaga); dados
  reais de pacientes.
- **Por que esse recorte é defensável em 24h:** o motor de prazos é uma conta de datas,
  testável e sem dependência externa (sem cron, ADR 0006). O lançamento é manual, como
  seria num piloto em Charqueadas. O que exige integração fica como visão, marcado
  como tal.

## Ligação com o pitch

Este documento alimenta os critérios **Impacto Social** e **Inovação**.
