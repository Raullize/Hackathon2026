# ADR 0006 — Clock derivado, sem cron

- **Status:** aceito
- **Data:** 2026-10-23

## Contexto

O Dia 30 precisa mostrar, a cada dia, a cor, o "Dia X de 30/60", os selos e os alertas
de cada caso. Na demo, os dias também precisam "passar" na frente da banca ("+7
dias").

A proposta inicial do `domain.md` era usar cron jobs com `@nestjs/schedule` para
varrer o banco, mudar os status e simular a passagem do tempo. Isso traz três
problemas:

- `@nestjs/schedule` não está instalado: seria dependência nova;
- um job que grava estado deixa o banco desatualizado entre uma execução e outra, e a
  demo depende do horário em que o job roda;
- testar regras de prazo com job e horário real é lento e instável.

## Decisão

- Sem cron e sem `@nestjs/schedule`.
- O estado calculado vem de uma função pura, `computeCaseStatus(case, events, today)`,
  em `backend/src/cases/domain`. Cor, dia, vencimento, selos, alertas, mensagens e
  métricas são calculados **na leitura**.
- "Hoje" vem de um `Clock` injetável (módulo global `clock`):
  - `today()` devolve `YYYY-MM-DD` em `America/Sao_Paulo`, com `Intl.DateTimeFormat`;
  - `now()` é o instante real mais o deslocamento de demo.
- O deslocamento de demo fica no banco (`DemoClockState.offsetDays`) e só vale com
  `DEMO_MODE=true`. É alterado por `POST /api/demo/clock/advance {days}` e
  `POST /api/demo/clock/reset`; sem `DEMO_MODE`, essas rotas retornam 404.
- `Case.status` é só um cache das transições explícitas (eventos). Cor e alerta nunca
  são gravados.

## Consequências

- Nenhuma dependência nova; o relógio da demo anda na hora, sem esperar job.
- As regras de prazo são testadas com `today` fixo, sem banco e sem horário real.
- Nos testes de integração, o `Clock` é sobrescrito no `TestingModule`.
- Cada leitura recalcula tudo. Com o volume do piloto (dezenas de casos `[SUPOSIÇÃO]`),
  isso é barato; com milhares de casos, avaliar cache ou visão materializada.
- Alerta não é "enviado" por um job: ele aparece quando alguém abre a lista. Envio
  ativo por **SMS e e-mail** fica para depois do MVP e vai precisar de agendamento.
  **WhatsApp** é apenas visão de pitch, não integração implementada (ADR 0007).
- O deslocamento guardado no banco vale para todos os usuários da instância de demo.
