# ADR 0007 — Canais de comunicação: SMS/e-mail agora, WhatsApp como visão

- **Status:** aceito
- **Data:** 2026-10-23

## Contexto

O Dia 30 precisa avisar a paciente sobre próximo passo, prazo e direitos. A demo mostra
templates e o link público, mas não dispara mensagens reais.

A decisão de produto é:

- **integração real prevista:** SMS e e-mail;
- **WhatsApp:** não faz parte da integração implementada nesta fase;
- **pitch final:** apresentar a visão de integração direta por WhatsApp, SMS e e-mail,
  deixando claro que é roadmap, não entrega atual.

## Decisão

- O MVP/demo usa **simulador de mensagens** nos canais SMS e e-mail.
- Não há envio real nesta fase.
- O WhatsApp **não** será implementado agora. Ele aparece apenas em material de
  visão/roadmap do pitch.
- A documentação interna, a demo e os checklists não devem afirmar que o WhatsApp já
  está integrado.
- O transporte fica atrás de uma porta futura (`NotificationChannel`), para que SMS,
  e-mail e WhatsApp compartilhem templates e regras de evento.

## Consequências

- A demo é honesta: mostra a mensagem e o canal, sem prometer entrega real.
- O pitch pode vender a visão multicanal sem conflitar com o protótipo.
- Integrações futuras exigem consentimento/opt-out, cadastro de telefone/e-mail,
  provedor, custos, rate limit e tratamento de falha.
- Telefone e e-mail são dados pessoais; entram na política de LGPD e minimização.
- O link público da paciente continua sendo o canal de leitura sob demanda.
