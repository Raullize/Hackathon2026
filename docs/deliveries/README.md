# Deliveries

Registro cronológico de entregas com evidência real. Não é changelog.

## Nomenclatura

```
docs/deliveries/NNNN-slug.md
```

Exemplo: `0001-bootstrap.md`.

## Regras

- Uma entrega = uma story ou concern.
- Só criar/marcar como concluída quando houver evidência verificável.
- Registrar comandos exatos e resultado, não “funcionou”.
- Incluir link/ID do CI quando existir.
- Nunca incluir token, senha, chave, dado pessoal ou log sensível.
- Refactor só entra se os testes estavam verdes antes e continuaram verdes.
- Commit e tag, quando existirem, devem apontar para a mesma entrega.

## Conteúdo mínimo

- Data e responsável.
- Escopo entregue e fora de escopo.
- Critérios de aceite.
- Evidência: testes, build, smoke, CI.
- Riscos e pendências.
