# Modelo de negócio

> Hipóteses do time, a validar com gestores. Número sem fonte é `[SUPOSIÇÃO]` ou
> `[DADO FALTANDO]`; nenhum preço abaixo foi testado com cliente.

## Proposta de valor

- Para o município e a secretaria: cumprir o que a Lei 14.758/2023 e a Portaria
  6.592/2025 pedem (sistema de registro das suspeitas e navegação) sem montar uma
  equipe de vigilância, como Porto Alegre precisou.
- Para o gestor: ver o atraso antes de ele vencer e ter a prova para cobrar vaga da
  regional.
- Para a rede: um calendário só, em vez de cada ponto com a sua lista.
- Para o médico: **zero trabalho novo**. Ele continua pedindo o exame pelo e-SUS PEC,
  SISCAN ou papel; a navegadora faz a ponte.

## Clientes

| Segmento | Dor | Disposição a pagar |
| --- | --- | --- |
| Secretaria municipal de saúde | Responde pelos prazos e pela navegação, com pouca equipe | `[DADO FALTANDO]` validar em entrevista |
| Coordenadoria regional (CRS) e secretaria estadual | Precisa ver onde a rede trava para redistribuir vaga | `[DADO FALTANDO]` |
| Hospital e prestador de oncologia | Quer receber o paciente com diagnóstico pronto e provar o prazo cumprido | `[DADO FALTANDO]` |

Quem paga por lei: estados e municípios devem implementar a navegação (Lei
14.758/2023 e Portaria 6.592/2025). O modelo de cobrança do mercado ainda não está
definido.

## Receita

Hipóteses, nenhuma testada:

- **Assinatura:** por município ou por região de saúde (SaaS para gestão pública).
  `[SUPOSIÇÃO]`
- **Licenciamento:** versão instalada para redes que exijam dados em infraestrutura
  própria. `[SUPOSIÇÃO]`
- **Parcerias/patrocínio:** entidades do terceiro setor de oncologia e programas de
  navegação, como o do Instituto Avon citado em `EVIDENCE.md`. `[SUPOSIÇÃO]`
- **Serviços:** implantação, treinamento da navegadora e integração com SISCAN e
  GERCON. `[SUPOSIÇÃO]`

## Custos

| Item | Estimativa | Observação |
| --- | --- | --- |
| Gemini/LLM | Free tier hoje; `[DADO FALTANDO]` em produção | Uma chamada por laudo; o custo cresce com o volume. O mock cobre a falta de rede |
| SMS/e-mail | `[DADO FALTANDO]` | Canais do escopo de integração; custo por mensagem |
| WhatsApp | `[DADO FALTANDO]` | Apenas visão/roadmap; não integrado nesta fase |
| Infra | `[DADO FALTANDO]` | Postgres e uma API NestJS; sem cron nem fila (ADR 0006) |
| Operação | `[DADO FALTANDO]` | Treinamento e suporte à navegadora; revisão jurídica da LGPD |

## Mercado

- **TAM:** os 78 mil casos novos de câncer de mama por ano no Brasil (INCA, estimativa
  2026–2028) 🟢 são o universo da linha piloto. Para todos os cânceres: 781 mil casos
  por ano 🟢. Isso mede pacientes, não receita. `[DADO FALTANDO]` valor por município.
- **SAM:** o RS, com 3.720 casos novos de mama por ano (INCA 2025) 🟢 e 168 municípios
  onde o câncer é a 1ª causa de morte 🟡.
- **SOM:** Charqueadas e a 2ª CRS, como piloto. Cerca de 10 casos novos de mama por
  ano em Charqueadas `[SUPOSIÇÃO]`. É um piloto de aprendizado, não de receita.
- **Fonte/metodologia:** `EVIDENCE.md`, seções 3 e 12. Não calculamos mercado em
  reais, para não inventar número.

## Argumento econômico (sem prometer retorno)

- Custo do 1º ano de tratamento no SUS: o estádio III custa cerca de 2,4 vezes o
  estádio I 🟡 (tese da UFRGS, valores da época). Nos EUA, o 1º ano do estádio IV
  custa cerca de 2,2 vezes o do estádio 0 🟢 (Blumen et al., 2016; setor privado).
- Coordenar pela atenção primária é mais barato: resolver um encaminhamento na APS
  custou R$ 239,22, contra R$ 759,26 quando virou consulta especializada (RegulaSUS,
  não é câncer) 🟢.
- **Não afirmamos economia do Dia 30.** Mostramos o custo do atraso como contexto.

## Go-to-market

1. **Piloto manual em Charqueadas** com a navegadora — função já prevista em lei; no
   município, confirmar quem exerce o papel `[SUPOSIÇÃO: confirmar na entrevista]`.
   Dados reais só após decidir a regra de LGPD (`domain.md`).
2. **Levar a prova à 2ª CRS e à secretaria estadual:** prazos cumpridos, casos em
   silêncio e exceções "falta de vaga".
3. **Fase 2:** importar laudos alterados do SISCAN e encaminhamentos do GERCON, e
   expandir para outros municípios da região e outros tipos de câncer.

## Sustentabilidade

- **Como se mantém após o hackathon:** projeto aberto no repositório do time, com piloto
  de baixo custo. Sem dados reais antes de a base legal e o provedor de IA estarem
  decididos.
- **Próximo passo comercial:** entrevistar a navegadora, a regulação e um gestor para
  validar quem paga e quanto `[DADO FALTANDO]`.

## Riscos

- Quem paga ainda é hipótese. Sem entrevista, preço e cliente são suposição.
- Concorrência de sistemas oficiais (e-SUS, GERCON, SISCAN, Painel-Oncologia): o
  risco é o governo cobrir o mesmo espaço. Nossa tese é que hoje nenhum conta o
  prazo da suspeita ao tratamento para todos verem (`EVIDENCE.md`, seção 8) e que o
  Conass descreve a necessidade.
- Dependência de integração com sistemas públicos `[SUPOSIÇÃO: viabilidade a
  confirmar]`. RNDS exige HL7 FHIR e credenciamento pelo Portal de Serviços do
  DATASUS; `[DADO FALTANDO]` modelo específico para laudo de mama. Não há API pública
  do SISCAN/PEC confirmada; o LEDI do e-SUS é só envio ao SISAB.
- LGPD e provedor de IA externo para dado de saúde (`[DECISÃO PENDENTE]`).

## Ligação com o pitch

Este documento alimenta **Modelo de Negócios** (10 pts).
