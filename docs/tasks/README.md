# Tasks

Planos de execução por story. Cada story relevante ganha uma pasta
`docs/tasks/<KEY>/` com:

- `plan.md`: objetivo, passos, arquivos afetados e critérios de aceite.
- `progress.txt`: uma linha por ação relevante, com fase, ação e evidência.

Use [`TEMPLATE.md`](./TEMPLATE.md) como base. Não é necessário criar task para
ajustes triviais, mas toda story do kanban deve ter rastreabilidade.

## Ciclo

```
Perceive -> Orient -> Decide -> Act -> Record
```

- Uma ação por passada.
- Se surgir trabalho novo, ele vira item no `Backlog`, não entra no meio.
- O progresso é registrado no mesmo momento da ação.
