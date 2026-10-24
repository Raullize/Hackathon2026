# Outline dos slides

> Texto falado em [`PITCH_SCRIPT.md`](./PITCH_SCRIPT.md); demo em
> [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Todo número vem de
> [`EVIDENCE.md`](./EVIDENCE.md), seção 13, conferindo a coluna de confiança.

## 1. Capa

- **Dia 30**: o calendário dos prazos da lei no câncer de mama.
- Tema Saúde Conectada 2026. Time e uma frase: "A lei dá 30 dias para diagnosticar e
  60 para tratar. Mas ninguém tem um relógio."

## 2. Problema

- Abertura: "Em outubro, todo mundo pede a mamografia. O problema começa quando ela
  volta alterada."
- RS: só **44,4%** começaram o tratamento em até 60 dias (Paraná: 60,3%). INCA 2025.
- Porto Alegre, que monitora: **32%** sem informação de tempo (jan–ago/2024).
- Persona: a mulher com BI-RADS 4/5 e a navegadora (única usuária). O médico fica
  fora do sistema.
- Critério: Impacto Social.

## 3. Solução

- Calendário compartilhado: um card por mulher, verde, amarelo ou vermelho, na
  semana do prazo.
- A IA lê o laudo, a navegadora confirma. A paciente vê o próximo passo, sem a
  palavra "câncer".
- **Frase-âncora:** "A lei criou a navegadora. Ninguém deu a ela uma ferramenta. O
  Dia 30 é a ferramenta."
- O médico não muda nada: pede o exame pelo caminho de sempre. **Zero trabalho novo
  para o médico.**
- Diferencial: **antecipa** o atraso, em vez de medir depois.
- Critério: Inovação.

## 4. Demo

- Os 7 passos de `DEMO_SCRIPT.md`: Maria no dia 18, "+7 dias", laudo, "30 dias:
  cumpriu", mensagem e link da paciente, escada de alerta, métricas.
- Mostrar o layout responsivo no celular (link da paciente) e no desktop (calendário).
- Dizer em voz alta o que é protótipo: dados fictícios, SMS/e-mail simulados, relógio
  de demo. WhatsApp é visão.
- Critério: Funcionalidade e Usabilidade.

## 5. Arquitetura

- Diagrama: frontend React, API NestJS, Postgres, `ReportExtractor` (Gemini com filtro
  de identificadores, fallback para a regra local).
- Decisão de design: sem cron; o estado é calculado na leitura (ADR 0006).
- Critério: Qualidade do Código.

## 6. Qualidade e segurança

- Zod, JWT, Argon2id, rate limit (inclusive no link da paciente), testes escritos antes
  e CI.
- IA só sugere; a navegadora confirma. Filtro de CPF, CNS e nome antes do Gemini; demo
  só com laudos fictícios.
- Só a navegadora acessa o painel; a paciente recebe um link de leitura.
- Critério: Qualidade do Código e Avaliação Geral.

## 7. Impacto

- Por que importa: a Lei 14.758/2023 manda manter um sistema que registre as
  suspeitas de câncer; o Dia 30 é o protótipo dele.
- Métricas do próprio sistema: % em 30 dias, % em 60 dias, % sem informação.
- Navegação funciona (revisão de 61 revisões sistemáticas, 2023), mas efeito do Dia 30
  ainda não foi medido.
- Critério: Impacto Social.

## 8. Modelo de negócio

- Quem paga por lei: estados e municípios (navegação). Hipótese: assinatura por
  município ou região, mais implantação e integração.
- Custo: Gemini no free tier hoje; SMS/e-mail por mensagem; WhatsApp fora desta fase;
  o resto é `[DADO FALTANDO]`.
- Dizer que é hipótese a validar.
- Critério: Modelo de Negócios.

## 9. Roadmap

- Hoje (implementado) vs. protótipo vs. visão: piloto manual em Charqueadas, depois
  SISCAN/GERCON, depois RNDS.
- RNDS: HL7 FHIR, Portal de Serviços do DATASUS, credenciamento do estabelecimento;
  `[DADO FALTANDO]` modelo específico para laudo de mama.
- Comunicação: SMS/e-mail no escopo; WhatsApp na visão.
- Critério: Inovação e Apresentação.

## 10. Fechamento

- Time, aprendizado e pedido: validar com quem trabalha na rede e abrir o piloto em
  Charqueadas.
- Última frase: "Mas ninguém tem um relógio. Agora tem um calendário."

## Regra

Sem números inventados. Se for estimativa, dizer “estimativa”. Se for protótipo,
dizer “protótipo”. Não dizer "preditivo" (o Dia 30 **antecipa**), nem "O SUS não tem
relógio". Não comparar o "% sem informação" do sistema com os 32% de Porto Alegre como
se fossem a mesma medida.
