# 0009 — Identificação e busca por nome/CNS

- **Data:** 2026-10-24
- **Story:** D30-008
- **Status:** implementado na branch `feat/d30-006-demo-seed`
- **Escopo:** identificação da paciente nas telas autenticadas e busca por nome/iniciais/CNS.

## Decisão

A navegadora é a única usuária autenticada do CareFlow e precisa identificar a
paciente para ligar, cobrar e conferir o caso. Iniciais sozinhas não são
suficientes. Portanto:

- `fullName` aparece nas telas autenticadas (calendário, detalhe, alertas e
  Concluídos).
- `cns` aparece apenas no detalhe autenticado; a busca por CNS é feita no
  servidor e não devolve o CNS na lista.
- `birthDate` continua fora de todas as respostas; a idade calculada é exibida.
- O link público da paciente continua **sem nome, CNS e termos proibidos**.
- Logs, erros e texto enviado à IA continuam sem nome, CPF/CNS e data de
  nascimento.

## Entregue

- Contrato `CaseView.fullName`; `CaseDetail.cns`; `Alert.fullName`.
- `GET /api/cases?scope=open|closed&q=` filtra por nome, iniciais ou CNS.
- Busca com `useDeferredValue` no calendário e em Concluídos.
- Cards, detalhe, alertas e Concluídos mostram o nome; detalhe mostra o CNS.
- Testes e2e para busca por nome e CNS, e para ausência de PII no link público.
- Requisitos RF-011, RF-023 e RF-036 e RNF-004/RNF-020 atualizados.

## Evidência

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Lint | `pnpm lint` | ok |
| Typecheck | `pnpm typecheck` | ok |
| Unitários | `pnpm test` | 65 backend + 5 frontend |
| E2E | `pnpm test:e2e` | 20 passaram |
| Build | `pnpm build` | ok |

## Observações

- O nome é dado pessoal; a exposição é limitada à sessão autenticada da
  navegadora. Produção precisa de auditoria de acesso e política de retenção.
- Busca client-side foi descartada porque o CNS não sai na listagem; a busca é
  server-side.
