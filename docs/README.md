# Documentação

Índice da documentação do starter. O código e os comandos reais são a fonte da
verdade; os documentos apontam para eles em vez de duplicar detalhes.

## Comece por aqui

| Documento | Para quê |
| --- | --- |
| [`tema-saude-conectada.md`](./tema-saude-conectada.md) | Análise do tema Saúde Conectada 2026 e implicações de produto |
| [`spec-driven-development/dia-30-mvp-spec.md`](./spec-driven-development/dia-30-mvp-spec.md) | Spec do recorte Dia 30 (casos, prazos, IA, canais e responsividade) |
| [`architecture.md`](./architecture.md) | Desenho dos módulos, fluxos de auth/chat e limites |
| [`testing.md`](./testing.md) | Estratégia de testes e comandos |
| [`demo-runbook.md`](./demo-runbook.md) | Checklist operacional da demo |
| [`backlog/KANBAN.md`](./backlog/KANBAN.md) | Kanban oficial do projeto |
| [`deliveries/0001-bootstrap.md`](./deliveries/0001-bootstrap.md) | Evidências da entrega inicial |

## Estrutura

```
docs/
├── architecture.md
├── testing.md
├── demo-runbook.md
├── spec-driven-development/   # entendimento do domínio (template)
├── requirements/              # requisitos funcionais e não funcionais
├── backlog/                   # kanban oficial
├── tasks/                     # planos e progresso por story
├── deliveries/                # evidências cronológicas
├── adr/                       # decisões arquiteturais
└── pitch/                     # material de apresentação
```

## Convenções

- Documentos em português; código, nomes de arquivos técnicos e commits em inglês.
- Nenhum segredo, token ou dado pessoal em docs.
- `docs/backlog/KANBAN.md` é a fonte da próxima demanda.
- Uma story só vai para `Done` com evidência em `docs/deliveries/`.
- Tema, personas e métricas de pitch só são preenchidos depois do evento começar.
