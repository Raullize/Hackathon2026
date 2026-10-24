# Texto do pitch — 5 minutos

> Texto falado, na ordem de [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) (estrutura e
> tempos) e [`SLIDES_OUTLINE.md`](./SLIDES_OUTLINE.md) (slides). Números só de
> [`EVIDENCE.md`](./EVIDENCE.md), seção 13. `[DECISÃO PENDENTE]` Os 5 minutos são o
> pitch inteiro ou só a demo? O texto assume o pitch inteiro, com 3 minutos de demo.
> Cerca de 130 palavras por minuto; ensaiar com cronômetro e cortar o que passar.

## 0:00–0:30 — Problema (slides 1 e 2)

"Em outubro, todo mundo pede a mamografia. O problema começa quando ela volta
alterada.

A lei dá 30 dias para diagnosticar um câncer e 60 para começar o tratamento. No Rio
Grande do Sul, entre 2020 e 2024, só 44% das mulheres com câncer de mama começaram o
tratamento dentro dos 60 dias. O Paraná, aqui do lado, chega a 60%. Mesmo em Porto
Alegre, que monitora as mamografias alteradas, um terço dos casos fica sem
informação."

> Slide: 44,4% (RS) × 60,3% (PR), INCA 2025; 32% sem informação, POA, jan–ago/2024.

## 0:30–0:50 — Solução (slide 3)

"O prazo existe, mas ninguém tem um relógio. O painel oficial mede o atraso meses
depois, e só começa a contar no laudo.

O Dia 30 é um calendário compartilhado. Cada mulher é um card verde, amarelo ou
vermelho, na semana em que vence o prazo da lei. Ele não mede o atraso depois. Ele
antecipa."

"A lei criou a navegadora. Ninguém deu a ela uma ferramenta. O Dia 30 é a ferramenta.
E o médico não muda nada: ele pede o exame pelo caminho de sempre. Zero trabalho novo
para o médico."

> Não dizer "preditivo": o aviso vem da conta das datas.

## 0:50–3:50 — Demo (slide 4)

Seguir os 7 passos de `DEMO_SCRIPT.md`. Falas de apoio, nos pontos que mais pesam:

- **Passo 1:** "Essa é a Maria, personagem fictícia. Dia 18 de 30, verde. Cada card é
  uma mulher, na semana em que vence o prazo."
- **Passo 2:** "Passo sete dias. Dia 25, amarelo. A biópsia passou e ninguém
  registrou. O Dia 30 percebe antes do prazo vencer, e o alerta chega à navegadora."
- **Passo 3:** "Aqui a IA lê o laudo e sugere. Quem confirma é a navegadora. Nada muda
  de estado sem ela. O médico não registra nada; ele já pediu o exame pelo caminho de
  sempre." (Dizer qual selo aparece: "Gemini" ou "regra local".)
- **Passo 4:** "Trinta dias: cumprido. Começa o prazo de 60, e a equipe já sabe
  quando ele vence."
- **Passo 5:** "A paciente recebe o próximo passo e os direitos dela. Sem a palavra
  câncer. Aqui está o link dela, no celular."
- **Passo 6:** "Esta tem exceção: falta de vaga. A exceção não esconde o atraso. O
  alerta sobe até a regional de saúde, que pode abrir a vaga."
- **Passo 7:** "É assim que o município mede, no dia, o que hoje só aparece meses
  depois."

Dizer em voz alta: "Os dados são fictícios, as mensagens de SMS/e-mail são simuladas e
o relógio é de demonstração. WhatsApp é visão."

## 3:50–4:20 — Arquitetura e IA (slides 5 e 6)

"Por baixo, é um backend em NestJS com Postgres. A navegadora é a única usuária. Sem
tarefa agendada: o estado é calculado na leitura, a partir das datas.

A IA não é um chatbot. Ela só estrutura o laudo. Um filtro tira CPF, cartão SUS e nome
antes do Gemini. Se a IA falhar ou demorar, entra uma regra local. E a navegadora
sempre confirma."

## 4:20–4:45 — Impacto e roadmap (slides 7 a 9)

"A Lei 14.758, de 2023, manda o poder público manter um sistema que registre as
suspeitas de câncer. O Dia 30 é um protótipo desse sistema.

O sistema mede o que importa: quantos diagnósticos em 30 dias, quantos tratamentos em
60, quantos casos sem notícia. Ainda não medimos o efeito dele em pacientes reais.
Hoje é protótipo. A visão é um piloto manual em Charqueadas, depois importar dados do
SISCAN e do GERCON, e no futuro a RNDS em FHIR. `[DADO FALTANDO]` O modelo RNDS para
laudo de mama ainda não está confirmado; não prometemos API do SISCAN nem do PEC."

> Se perguntarem do modelo de negócio: quem paga por lei são estados e municípios
> (navegação). Assinatura por município é hipótese a validar.

## 4:45–5:00 — Fechamento (slide 10)

"Somos o time [nome do time], de Charqueadas. Queremos validar isso com quem trabalha
na rede e abrir o piloto aqui. A lei dá 30 dias para diagnosticar e 60 para tratar.
Mas ninguém tem um relógio. Agora tem um calendário."

## Perguntas prováveis

Respostas curtas em [`OPERATIONS.md`](./OPERATIONS.md), seção 9, e no fim do
`DEMO_SCRIPT.md`. As mais prováveis:

- **"Isso já existe?"** Existem peças: o e-SUS registra, o GERCON organiza a fila, a
  OCI paga o pacote e o SISCAN acompanha exames alterados. Nas nossas buscas, nenhuma
  conta o prazo da lei da suspeita até o tratamento para todos verem.
- **"Por que não uma planilha?"** A planilha fica no computador de uma pessoa. O Dia 30
  dá à navegadora um relógio com alertas e histórico; ela cobra UBS, regulação e
  hospital, e a paciente tem um link de leitura.
- **"Cria vaga?"** Não. Mostra quem está mais perto de estourar o prazo e gera a prova
  para cobrar a vaga.
- **"Quem alimenta o sistema?"** A navegadora, que a lei já prevê, a partir da fila da
  regulação e do SISCAN. O médico não muda nada. No futuro, importação do SISCAN e a RNDS (FHIR) podem reduzir essa digitação;
  viabilidade a confirmar.
- **"E se a IA errar?"** A navegadora confere e edita antes de confirmar; o sistema
  guarda a sugestão e o valor confirmado.
- **"E a LGPD?"** Demo só com laudos fictícios; filtro de identificadores antes do
  Gemini. A regra para laudo real ainda é `[DECISÃO PENDENTE]`: dizer isso.
- **"O RS demora em tudo?"** Não. O laboratório é rápido (88,3% das biópsias em até
  30 dias). O tempo se perde nas filas.

## Antes de subir ao palco

- Preencher o nome do time (fechamento).
- Cronometrar. Se passar de 5 minutos, cortar o slide 8 (modelo de negócio) para uma
  frase e a arquitetura para 15 segundos.
- Conferir quais itens do `ROADMAP.md` já estão na `main` e ajustar "Hoje".
- Rodar o checklist "Antes de subir ao palco" de `DEMO_SCRIPT.md`.
