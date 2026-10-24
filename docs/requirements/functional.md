# Requisitos funcionais

| ID | Requisito | Critério de aceite | Status |
| --- | --- | --- | --- |
| RF-001 | Cadastro de usuário | E-mail único, senha com mínimo de 8 caracteres, senha persistida com Argon2id e `201` com token | Done |
| RF-002 | Login | Credenciais válidas retornam token; inválidas retornam `401` genérico | Done |
| RF-003 | Usuário autenticado | `GET /api/auth/me` retorna o usuário do token; sem token retorna `401` | Done |
| RF-004 | Logout | Limpa o cookie de acesso e responde `200` | Done |
| RF-005 | Chat autenticado | `POST /api/chat` sem token retorna `401`; com token retorna `200` e resposta | Done |
| RF-006 | Fallback de IA | Sem chave, quota, timeout ou modelo indisponível, o chat responde com `provider: "mock"` | Done |
| RF-007 | Health | `/api/health` responde `200`; `/api/health/ready` reflete o PostgreSQL | Done |
| RF-008 | Swagger | `/docs` lista auth, chat e health com Bearer auth | Done |
| RF-009 | Validação Zod | Payload inválido retorna `400` com detalhes | Done |
| RF-010 | Rate limit | Chat tem limite mais rígido que a API geral | Done |
| RF-011 | Cadastro de caso (Dia 30) | `POST /api/cases` com `fullName`, `cns`, `birthDate`, `trigger` e `requestedAt` cria o caso em `SUSPECTED` com o evento `CASE_CREATED` e retorna `201`; `requestedAt` no futuro retorna `400`; nenhuma resposta da API contém `fullName`, `cns` ou `birthDate` | Backlog |
| RF-012 | Prazo de 30 dias | Dia zero = `requestedAt`; "Dia X de 30" = hoje − `requestedAt`; vence em `requestedAt + 30`; o dia 30 está no prazo e o dia 31 é vencido; cumprido quando `reportDate ≤ requestedAt + 30`; laudo inconclusivo não reinicia a contagem | Backlog |
| RF-013 | Prazo de 60 dias | Conta do `reportDate` do laudo maligno (não da confirmação); vence em `reportDate + 60`; cumprido quando `treatmentStartedAt ≤ reportDate + 60`; o tratamento tem tipo (cirurgia, quimioterapia ou radioterapia); `reportDate` antes do `requestedAt` ou depois de hoje retorna `400` | Backlog |
| RF-014 | Cores do caso | Vermelho quando vencido; amarelo quando faltam 7 dias ou menos (D30) ou 14 ou menos (D60), ou quando falta notícia; verde no resto; prioridade vermelho > amarelo > verde; caso fechado não tem cor; limites numa constante central | Backlog |
| RF-015 | Silêncio e data passada | Só eventos de etapa zeram o silêncio ("Ciente" e correção não); 7 dias sem notícia dão o selo "Sem notícia há X dias"; data agendada futura suspende o silêncio até o dia seguinte; data passada sem `EXAM_DONE` dá o selo "Data passou sem registro" na hora; verde vira amarelo, vermelho continua vermelho | Backlog |
| RF-016 | Exceções e encerramento | `EXCEPTION_NOTED` (recusa, ausência, contraindicação, pendência clínica, transporte, falta de vaga) anota e põe selo, sem mudar a cor nem suspender o prazo; `CASE_CLOSED_EXCEPTION` (recusa definitiva ou óbito) fecha o caso só por ação explícita e registra "cumpriu/não cumpriu" até aquela data; ausência não fecha | Backlog |
| RF-017 | Transições de estado | `POST /api/cases/:id/events` com `discriminatedUnion('type')`; só as transições da spec são aceitas; transição inválida ou evento em caso fechado retorna `409`; payload inválido retorna `400`; caso inexistente retorna `404` | Backlog |
| RF-018 | Correção de evento | `CORRECTION` exige `correctsEventId`, novos valores e motivo; vale só para datas e dados, nunca para transições (`400`); o cálculo usa o valor corrigido; o evento original continua na linha do tempo | Backlog |
| RF-019 | Sugestão de laudo pela IA | `POST /api/cases/:id/report-extractions` guarda a sugestão (`examType`, `reportDate`, `malignancy`, `confidence`, `evidenceQuote`, `provider`) com `extractionId` e não muda o estado do caso; JSON inválido, erro ou timeout do Gemini cai para o mock com o motivo registrado; a UI mostra "Gemini" ou "regra local" | Backlog |
| RF-020 | Confirmação do laudo | `REPORT_CONFIRMED` com `extractionId` e valores finais move para `DIAGNOSIS_CONFIRMED`, `DISCARDED` ou `EXAM_TO_RESCHEDULE`; o servidor calcula os campos alterados a partir da sugestão guardada; a segunda confirmação (duplo clique) retorna `409` | Backlog |
| RF-021 | Filtro de identificadores | Antes de qualquer extrator, CPF, CNS e o nome da paciente são removidos do texto do laudo, inclusive na demo; teste com os 3 laudos fictícios prova que nenhum identificador sobra | Backlog |
| RF-022 | Calendário | Semana atual mais 8, começando na segunda, coluna "Vencidos" à esquerda e "Depois" à direita; card na semana do vencimento do prazo aberto; ordem por cor, dias restantes e gatilho (BI-RADS 5, BI-RADS 4, suspeita clínica); abaixo de 768px vira lista vertical por semana | Backlog |
| RF-023 | Card e detalhe | O card mostra iniciais, "Dia X de 30/60", próximo passo com data e vencimento (ou "Aguardando agendamento"), cor com rótulo e ícone e os selos; clicar abre o detalhe com a linha do tempo e as ações permitidas | Backlog |
| RF-024 | Concluídos | Aba com os casos fechados, "30 dias: cumpriu/não cumpriu" e "60 dias: cumpriu/não cumpriu/não se aplica" | Backlog |
| RF-025 | Alertas e escada | `GET /api/alerts` calcula os alertas na leitura: amarelo ou silêncio → navegadora; faltam 3 dias ou menos → regulação; vencido → coordenação e SMS; vencido com falta de vaga → 2ª CRS; cada alerta traz caso, destinatário, motivo e ação sugerida | Backlog |
| RF-026 | "Ciente" no alerta | `ALERT_ACKNOWLEDGED` registra quem marcou e quando; o alerta continua visível até a causa sumir; não há "resolvido" manual; "Ciente" não zera o silêncio | Backlog |
| RF-027 | Mensagens para a paciente | Templates fixos por evento, calculados na leitura, mostrados no detalhe e no link; nenhum contém "câncer", "cancer", "tumor", "maligno" ou "carcinoma" (teste); sem envio real | Backlog |
| RF-028 | Link da paciente | `POST /api/cases/:id/access-tokens` gera token de 32 bytes, guarda só o hash e mostra o token uma vez; gerar novo revoga o anterior; `GET /api/public/p/:token` retorna `404` igual para inexistente e revogado, tem rate limit próprio e mostra só próximo passo, data, "Dia X de 30/60" e direitos | Backlog |
| RF-029 | Métricas | `GET /api/metrics` devolve % sem informação, % de diagnósticos em até 30 dias, % de tratamentos em até 60 dias e as métricas de IA, com numerador e denominador | Backlog |
| RF-030 | Relógio de demo | Com `DEMO_MODE=true`, `POST /api/demo/clock/advance {days}`, `POST /api/demo/clock/reset` e `GET /api/demo/status` deslocam e mostram a data simulada; sem `DEMO_MODE`, `404` | Backlog |
| RF-031 | Seed e reset da demo | Com `DEMO_MODE=true`, `POST /api/demo/reset` recarrega de 8 a 10 casos fictícios que cobrem as cores e os estados, incluindo a personagem principal no dia 18 de 30, e zera o relógio | Backlog |
| RF-032 | Telas de login | Login e logout da navegadora no frontend, usando RF-002 a RF-004; rotas do calendário exigem sessão; `/p/:accessToken` não exige | Backlog |

## Fora do MVP

- Recuperação de senha
- Verificação de e-mail
- Refresh token
- Roles/permissões
- Persistência de conversas
- Upload de arquivos
- Multiusuário por organização
- Tela de chat (FEAT-002): o produto não é chatbot; a IA estrutura laudos
- Envio real de WhatsApp ou SMS
- Integração com e-SUS, SISCAN, GERCON e RNDS
