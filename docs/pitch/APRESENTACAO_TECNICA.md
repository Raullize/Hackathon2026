# Apresentação técnica — CareFlow

> Guia para a banca técnica. O objetivo não é vender o produto outra vez, e sim
> mostrar que as decisões técnicas são conscientes, que o fluxo funciona e que
> sabemos onde estão os limites do protótipo.

## 1. Resumo em 30 segundos

O CareFlow é um painel operacional para a navegadora do SUS acompanhar os prazos
legais da linha de cuidado do câncer. O caso nasce de uma suspeita (BI-RADS 4/5 ou
suspeita clínica), percorre exame, laudo e tratamento, e o sistema calcula em tempo
real o risco de atraso. A única usuária autenticada é a navegadora; a paciente
recebe apenas um link de leitura. A IA estrutura laudo e pedido, mas nunca decide:
a navegadora confirma.

Stack: monorepo pnpm com React + TypeScript no frontend, NestJS + PostgreSQL +
Prisma no backend e contratos Zod compartilhados.

## 2. Antes de começar

### Pré-requisitos

- Node.js 24
- pnpm 11
- Docker com Compose

### Subir do zero

Na raiz:

```bash
pnpm setup
pnpm dev
```

`pnpm setup` cria `.env`, sobe o PostgreSQL, instala dependências, builda os
contratos, gera o Prisma Client, aplica migrations e roda o seed.

Se preferir fazer manualmente:

```bash
cp .env.example .env
docker compose up -d db
pnpm install --frozen-lockfile
pnpm --filter @careflow/contracts build
pnpm --filter @careflow/backend db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

### URLs e login

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- PostgreSQL local: porta `55432`
- Login: `demo@careflow.dev` / `demo1234`

### Comandos de verificação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm smoke          # com a API rodando
```

### Restaurar a demonstração

No calendário, use **Restaurar dados**. Também é possível pela API autenticada:

```bash
LOGIN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@careflow.dev","password":"demo1234"}')

TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).accessToken)" "$LOGIN")

curl -X POST http://localhost:3000/api/demo/reset \
  -H "Authorization: Bearer $TOKEN"
```

Isso recria os 11 casos fictícios, apaga eventos, extrações e links, e zera o
relógio. **Não apaga usuários.**

### Usar Gemini de verdade

O padrão é a regra local:

```env
LLM_PROVIDER=mock
```

Para chamar o Gemini, edite o `.env` e reinicie a API:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=sua-chave
GEMINI_MODEL=gemini-3.5-flash-lite
REPORT_EXTRACTION_TIMEOUT_MS=8000
```

Se a chave falhar, faltar quota, estourar o timeout ou o JSON não passar no Zod, o
backend cai para a regra local e registra o motivo. Não coloque a chave em
variável `VITE_*`.

### Parar

`Ctrl+C` no terminal do `pnpm dev`. Se necessário:

```bash
fuser -k 3000/tcp 5173/tcp
pnpm docker:down
```

## 3. Roteiro de 12 minutos

Ajuste conforme o tempo da banca. O bloco de demo é o mais importante.

| Tempo | Bloco | O que dizer |
| --- | --- | --- |
| 0:00–0:50 | Problema e usuário | A navegadora precisa enxergar o prazo antes de vencer. O médico não muda a rotina. A paciente só recebe. |
| 0:50–4:00 | Demo | Login, calendário, +7 dias, detalhe, laudo, link da paciente, alertas e concluídos. |
| 4:00–5:30 | Arquitetura geral | Monorepo, frontend, backend, PostgreSQL e contratos compartilhados. |
| 5:30–7:30 | Backend e domínio | Camadas, eventos, prazos calculados na leitura, transições e correções. |
| 7:30–9:00 | Frontend | React/TS, rotas, TanStack Query, separação pages/features/API e responsividade. |
| 9:00–10:20 | IA e segurança | Filtro de PII, Zod, fallback, confirmação humana, autenticação e link público. |
| 10:20–11:20 | Qualidade | Testes, CI, migrações, seed e smoke. |
| 11:20–12:00 | Limites e próximos passos | O que não está pronto e o que faríamos com mais tempo. |

### Se a banca der 5 minutos

Corte nesta ordem:

1. detalhes de frontend;
2. métricas e paginação;
3. detalhes de IA;
4. mantenha demo, arquitetura em uma frase e limites.

### Se a banca der 20 minutos

Acrescente:

- uma requisição real pelo Swagger;
- o fluxo de um evento no banco;
- a explicação das transições e da correção;
- a diferença entre `occurredAt` e `recordedAt`;
- o fluxo de fallback da IA;
- o funcionamento do reset e do seed.

## 4. Demo passo a passo

### 4.1 Login

Mostre a tela de login. Destaque:

- acesso restrito à navegação;
- senha com opção de mostrar/ocultar;
- nenhuma credencial demo exibida na interface.

### 4.2 Calendário

Mostre:

- Maria, dia 18 de 30, verde;
- Joana, vencida, com exceção de falta de vaga;
- Nora, descoberta tardia;
- Teresa, 60 dias vencido;
- busca por nome, iniciais ou CNS.

Frase: “O calendário não é um contador regressivo abstrato; ele mostra em que
semana o prazo vence e onde o caso travou.”

### 4.3 Avançar o tempo

Clique em **+7 dias** ou expanda o controle de data.

- Maria passa para o dia 25, amarela, com data da biópsia passada sem registro.
- O selo de silêncio aparece.
- O alerta é calculado na leitura.

Frase: “Não há cron. O estado é derivado dos eventos e das datas a cada leitura.”

### 4.4 Detalhe e laudo

Abra um caso. Mostre:

- nome, iniciais, CNS, idade;
- dia, vencimento e próximo passo;
- linha do tempo append-only;
- ações permitidas para o estado;
- geração do link da paciente.

Cole o laudo fictício de `backend/test/fixtures/reports/maligno.txt`, clique em
**Analisar laudo** e depois em **Confirmar laudo**.

Frase: “A IA sugere; a navegadora confirma. A confirmação consome a extração e
move o caso de forma transacional.”

### 4.5 Link da paciente

Gere o link, copie e abra em uma aba anônima ou no celular.

Mostre:

- próximo passo, dia e vencimento;
- direitos;
- mensagens em linguagem neutra;
- ausência de nome, CNS e termos como “câncer”.

Frase: “O link é somente leitura, o token é hasheado no banco e não há login da
paciente neste MVP.”

### 4.6 Notificações

Abra **Notificações**:

- mostre os avisos à paciente com passo marcado e use **Avisar paciente**;
- revise a mensagem e escolha SMS, e-mail ou WhatsApp;
- mostre os alertas de prazo e use **Notificar** para o destinatário interno;
- mostre o feedback visual na linha e o toast;
- use **Ciente** para registrar o reconhecimento.

Frase: “Os canais externos são simulados. O contato fica registrado como evento,
sem esconder o atraso nem zerar o silêncio.”

### 4.7 Concluídos

Mostre:

- indicadores de 30/60 dias;
- descoberta tardia;
- uso da IA;
- lista de casos fechados com paginação e busca.

Frase: “As métricas têm numerador e denominador; não inventamos um percentual sem
base.”

## 5. Arquitetura em uma frase

O CareFlow é um monólito modular: o frontend consome uma API NestJS; o domínio de
prazos é composto por funções puras; o Prisma isola o PostgreSQL; e os contratos
Zod são compartilhados entre os dois lados.

```text
React + Vite + TanStack Query
            |
      /api via Vite proxy
            |
NestJS controllers -> services -> domain
            |                  |
      repositories          funções puras
            |
        Prisma
            |
       PostgreSQL
```

## 6. Frontend

### Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- shadcn/ui sobre Radix
- React Router 7
- TanStack Query 5
- Vitest + Testing Library

### Organização atual

```text
src/
├── app/                 # router, providers, rota protegida
├── pages/               # telas por rota
├── features/
│   ├── auth/
│   │   ├── api.ts
│   │   └── auth-context.tsx
│   └── cases/
│       ├── api.ts
│       ├── demo-api.ts
│       ├── hooks.ts
│       ├── calendar-utils.ts
│       ├── labels.ts
│       └── components/
├── lib/                 # api-client, env, utils
└── components/ui/       # primitivos shadcn
```

Não existe uma pasta global `services`. A integração está em `features/*/api.ts` e
`demo-api.ts`; os hooks de leitura ficam em `features/cases/hooks.ts`. Isso mantém
a organização por domínio e evita uma camada genérica sem dono.

### Fluxo de dados

1. A página chama um hook (`useOpenCases`, `useCaseDetail`, etc.).
2. O hook usa uma query key estável.
3. A API tipada monta a URL e chama `apiFetch`.
4. `apiFetch` envia cookies, JSON e trata o envelope de erro.
5. TanStack Query guarda cache, faz invalidação e mantém dados anteriores durante
   uma nova busca.

### Autenticação no frontend

- `AuthProvider` consulta `/auth/me` no boot.
- Login e logout passam por `features/auth/api.ts`.
- Rotas internas usam `ProtectedRoute`.
- O cookie `HttpOnly` evita expor o token ao JavaScript.
- O link `/p/:token` é público e não monta o shell da navegadora.

### Decisões e trade-offs

- **Vite, não Next:** é um painel interno, sem SEO nem SSR; SPA é mais simples.
- **TanStack Query, não Redux:** o estado dominante é estado de servidor.
- **Tailwind + shadcn:** velocidade de composição e acessibilidade dos primitivos.
- **Sem pasta global de serviços:** domínio pequeno; API por feature é suficiente.
- **Sem Playwright:** os fluxos críticos estão em e2e de API; a validação visual é
  manual e responsiva.

## 7. Backend

### Módulos NestJS

| Módulo | Responsabilidade |
| --- | --- |
| `auth` | cadastro, login, `me`, logout, JWT e Argon2id |
| `cases` | casos, eventos, transições, correções e leitura |
| `report-extraction` | extração do laudo e confirmação |
| `case-intake` | extração do pedido da UBS |
| `alerts` | alertas derivados na leitura |
| `metrics` | indicadores com numerador e denominador |
| `patient-access` | token e visão pública da paciente |
| `clock` | data local e deslocamento de simulação |
| `demo` | status, avanço, reset de relógio e reset do seed |
| `health` | liveness e readiness |
| `prisma` | cliente global do banco |
| `common` | filtro de exceção, decorators e tipos |

### Camadas

- **Controller:** HTTP, DTOs, guards, status codes e Swagger. Não contém regra de
  negócio.
- **Service:** orquestra o caso de uso, consulta repositórios, valida a operação e
  decide quando abrir transação.
- **Domain:** funções puras de prazo, datas, transições, correções, selos, mensagens,
  alertas e métricas. Não importa Prisma nem Nest.
- **Repository:** interface/porta de persistência.
- **Prisma adapter:** implementação que traduz Prisma para o domínio.
- **Contracts:** schemas Zod e tipos compartilhados com o frontend.

### Fluxo de um evento

`POST /api/cases/:id/events`:

1. `JwtAuthGuard` valida a sessão.
2. `ZodValidationPipe` valida o `discriminatedUnion` por `type`.
3. `CasesService` carrega o caso e seus eventos.
4. O domínio recalcula o estado e rejeita transição inválida com `409`.
5. O serviço calcula os campos derivados e abre uma transação.
6. O evento é inserido; se for `REPORT_CONFIRMED`, a extração é consumida.
7. O cache de status do caso é atualizado.
8. A resposta volta como `CaseView`.

### Por que não cron

Prazos, cores, silêncio, alertas e métricas são funções do estado atual e da data.
Calcular na leitura elimina job, evita divergência entre cache e banco e deixa o
teste determinístico. O custo é recalcular em cada listagem; para o volume do MVP,
é aceitável.

### Modelo de dados

- `User`: navegadora.
- `Case`: identidade, gatilho, data do pedido, status atual e vínculo com a usuária.
- `CaseEvent`: linha do tempo append-only; `occurredAt` é quando aconteceu,
  `recordedAt` quando foi registrado.
- `ReportExtraction`: sugestão da IA, provedor, fallback e consumo.
- `PatientAccessToken`: hash do token, expiração/revogação e vínculo com o caso.
- `DemoClockState`: offset do relógio de simulação.

O status atual é um cache derivado dos eventos; a fonte da verdade é a linha do
tempo. Correções não apagam o evento original: acrescentam um `CORRECTION` e o
cálculo aplica a última correção.

### Prisma e PostgreSQL

- PostgreSQL 17 para integridade relacional, datas e transações.
- Prisma para schema tipado, migrations e Client.
- Migrations versionadas; o CI aplica migrations antes dos testes.
- Repositórios isolam o Prisma do domínio.
- O seed usa transação e é destrutivo apenas para as tabelas do CareFlow.

## 8. Contratos compartilhados

`packages/contracts` é a fonte única dos formatos:

- schemas Zod para auth, casos, eventos, alertas, métricas, extração, intake e
  link público;
- tipos TypeScript inferidos com `z.infer`;
- backend usa `nestjs-zod` para transformar schema em DTO;
- frontend importa os mesmos tipos;
- o pacote é buildado antes do backend e do frontend.

Benefício: uma mudança de contrato quebra o build dos dois lados, não aparece só
em runtime.

## 9. Domínio de prazos

- **D30:** começa em `requestedAt`; vence em `requestedAt + 30`; o dia 30 ainda
  está no prazo.
- **D60:** começa em `reportDate` do laudo maligno; vence em `reportDate + 60`.
- **Cores:** vermelho para vencido; amarelo quando faltam 7 dias (D30) ou 14 dias
  (D60), ou quando há silêncio; verde no restante.
- **Silêncio:** dias sem evento de etapa. `Ciente` e correção não zeram o silêncio.
- **Data passada sem registro:** exame agendado cuja data passou sem `EXAM_DONE`.
- **Descoberta tardia:** caso cadastrado depois de `requestedAt + 30`; ganha selo e
  não reinicia o prazo.
- **Exceção:** registra motivo e selo, mas não esconde o atraso.
- **Encerramento por exceção:** só por ação explícita, com motivo.

## 10. IA

### Onde entra

- `POST /api/cases/:id/report-extractions`: estrutura um laudo.
- `POST /api/case-intake/extractions`: estrutura um pedido da UBS.

Não há chatbot no produto.

### Fluxo

1. O texto passa pelo filtro de CPF, CNS e nome.
2. O provider escolhido é Gemini ou regra local.
3. Gemini recebe prompt e responde JSON.
4. A resposta é validada por Zod.
5. Se o `evidenceQuote` não for literal no texto filtrado, cai para a regra local.
6. A sugestão é salva sem mudar o estado.
7. A navegadora revisa e confirma.
8. Só a confirmação muda o caso.

### Fallback

O Gemini pode falhar por:

- ausência de chave;
- quota;
- timeout (`REPORT_EXTRACTION_TIMEOUT_MS`, padrão 8s);
- modelo indisponível;
- JSON inválido;
- resposta sem evidência literal.

Em todos os casos, a extração retorna `provider: "mock"` e um `fallbackReason`.
Isso mantém a demo viva e deixa o erro visível.

### Limites

- `confidence` é rótulo heurístico, não probabilidade calibrada.
- A IA não decide conduta, não cria caso e não altera estado sozinha.
- O texto bruto do laudo não é persistido; fica só a sugestão estruturada.
- A chave fica no backend; nunca em `VITE_*`.
- O Gemini real não foi validado nesta máquina recentemente. Com uma chave válida,
  o caminho está pronto, mas a homologação real ainda deve ser feita.

## 11. Autenticação, segurança e LGPD

- Argon2id para senha.
- JWT de 8h, sem refresh token neste MVP.
- Aceita Bearer ou cookie `HttpOnly`.
- Helmet e CORS configurados.
- Rate limiting removido do MVP de propósito: o limite global já causou `429` na
  demo e não é uma política de segurança completa. Produção deve usar gateway ou
  Redis, por usuário e por rota.
- A única usuária autenticada é a navegadora.
- Nome e CNS aparecem apenas na área autenticada; a busca por CNS é server-side.
- O link público não expõe nome, CNS nem termos proibidos.
- O token público tem 32 bytes, é mostrado uma vez e o banco guarda apenas o hash.
- Dados do seed são fictícios.
- Logs não devem conter token, senha, laudo ou PII.

### Ponto de honestidade

O MVP não tem rate limiting, auditoria de leitura, política de retenção nem
integração real de canais. São itens de produção, não de demonstração.

## 12. Seed e demonstração

`pnpm db:seed`:

- cria/atualiza o usuário `Usuário Demo`;
- zera o relógio;
- recria 11 casos fictícios;
- apaga eventos, extrações e links antigos;
- não apaga usuários.

Cenários atuais:

- 8 abertos e 3 fechados;
- todos os status;
- verde, amarelo e vermelho;
- D30 e D60;
- silêncio, laudo pendente, exceção e descoberta tardia;
- resultados `MET`, `MET_UNTIL_CLOSE` e `NOT_APPLICABLE`.

Limitações do seed, sem inflar a demo:

- não há `MISSED_DATE` no estado inicial;
- não há D60 amarelo;
- não há caso fechado com `NOT_MET`;
- só há cirurgia, não quimioterapia/radioterapia;
- não há encerramento por óbito.

Se a banca perguntar, a resposta é: “O seed cobre o roteiro; bordas exatas ficam nos
testes unitários.”

## 13. Testes e qualidade

| Camada | Ferramenta | Cobertura atual |
| --- | --- | --- |
| Backend | Jest | domínio de prazos, transições, correções, alertas, mensagens, métricas, auth, demo, extrações |
| E2E | Jest + Supertest | auth, casos, eventos, link público, alertas, métricas e paginação |
| Frontend | Vitest + Testing Library | login, visibilidade da senha, agrupamento do calendário e datas |
| Smoke | Node + fetch | health, login, casos, alertas e métricas |
| CI | GitHub Actions | lint, typecheck, unit, e2e e build com PostgreSQL 17 |

Números atuais:

- 61 testes unitários de backend;
- 5 testes de frontend;
- 19 testes e2e.

Limitação assumida: não há Playwright. A validação visual é manual, incluindo
360px, 768px, 1280px e 1440px.

## 14. Docker e infraestrutura

- `compose.yml` sobe **apenas** o PostgreSQL 17.
- Porta local `55432` para evitar conflito com 5432.
- A API e o frontend rodam via `pnpm dev`; não há containers de aplicação.
- Não há deploy de produção neste MVP.
- O CI usa um serviço PostgreSQL efêmero do GitHub Actions.

### Por que não dockerizar tudo agora

Para o hackathon, o compose do banco reduz o tempo de setup e mantém a API fácil de
depurar. Containers da aplicação e reverse proxy entram no roadmap de deploy.

## 15. O que não está implementado

- Envio real de SMS, e-mail e WhatsApp. **Notificar** registra `CONTACT_LOGGED` para
  o destinatário interno; **Avisar paciente** registra `PATIENT_NOTIFIED` com o
  texto mock revisado pela navegadora.
- Integração com SISCAN, GERCON, e-SUS ou RNDS.
- Rate limiting, auditoria de leitura e política formal de retenção.
- PDF: o anexo é selecionado na UI, mas não é processado.
- Deploy e observabilidade de produção.
- Playwright e testes visuais automatizados.
- Validação real do Gemini com uma chave de produção nesta máquina.

## 16. Perguntas prováveis da banca

### Produto e escopo

**Por que só a navegadora tem login?**
Porque a lei já prevê a navegação, e o fluxo foi desenhado para uma única operadora
que cobra os outros atores. Médico e UBS continuam fora; a paciente só lê.

**Por que a paciente não tem conta?**
O link tokenizado resolve o caso de uso com menos atrito e menos PII. Não há senha
para a paciente, e o link pode ser revogado.

**Qual o diferencial em relação a uma planilha?**
Cálculo de prazo, alerta antes do vencimento, histórico de eventos, correção,
link de leitura e métricas com denominador. A planilha não mantém isso.

### Frontend

**Por que React e não Next.js?**
É um painel interno autenticado, sem SEO nem necessidade de SSR. Vite reduz
complexidade e acelera o desenvolvimento.

**Por que TanStack Query?**
O estado principal é estado de servidor: cache, loading, erro, invalidação e
paginação. Não precisamos de Redux para isso.

**Como o frontend fala com a API?**
`features/*/api.ts` monta as chamadas tipadas; `apiFetch` centraliza cookies,
JSON e erros; `features/cases/hooks.ts` encapsula queries e query keys. As páginas
não conhecem URLs da API.

**Como funciona a autenticação no navegador?**
O backend devolve JWT e cookie `HttpOnly`; o `AuthProvider` consulta `/auth/me`;
`ProtectedRoute` bloqueia rotas internas.

**Como garantem responsividade?**
Layout com Tailwind e breakpoints; calendário horizontal no desktop vira lista no
mobile; detalhe e formulários empilham. A validação é manual em quatro larguras.

### Backend

**Por que NestJS?**
DI, módulos, guards, pipes e Swagger prontos. A separação controller/service/domain
fica explícita sem framework artesanal.

**Quais são as camadas?**
Controller (HTTP), service (orquestração), domínio (regras puras), repositório
(porta) e adapter Prisma (persistência).

**Por que Prisma?**
Produtividade, schema tipado e migrations versionadas. O domínio não importa
Prisma; se precisar, dá para trocar a persistência.

**Por que PostgreSQL?**
Relações fortes, transações, datas e integridade para eventos e casos. É o banco
que o time já domina.

**Como garantem consistência do status?**
O status é cache; a fonte é a linha do tempo append-only. O cálculo replay-a os
eventos e aplica correções.

**Como funciona a correção?**
Um evento `CORRECTION` aponta para o evento original e traz novos valores. O
original permanece; o cálculo aplica a última correção válida.

**Por que não usar cron?**
O estado é derivado das datas e eventos. Cron introduziria atraso, estado duplicado
e jobs frágeis. O trade-off é recalcular na leitura.

### IA

**A IA decide algo?**
Não. Ela sugere campos; a navegadora revisa e confirma. A confirmação é o único
evento que muda o estado.

**Como evitam alucinação?**
Filtro de identificadores, JSON validado por Zod, exigência de trecho literal,
fallback para regra local e confirmação humana.

**O que é `confidence`?**
Um rótulo heurístico (`high`, `medium`, `low`), não uma probabilidade calibrada.
Não deve ser lido como “95% de certeza”.

**O laudo vai para fora?**
No MVP, só laudo fictício. Antes de enviar, removemos CPF, CNS e nome. O texto bruto
não é persistido. Em produção, a regra de LGPD e o contrato com o provedor precisam
ser definidos.

**O Gemini está funcionando agora?**
O caminho está implementado, mas o `.env` atual usa `mock`. Para testar, configure
`LLM_PROVIDER=gemini`, a chave e reinicie. A homologação com chave real ainda é uma
pendência; falhas caem para a regra local.

### Segurança

**Por que não há rate limiting?**
Foi removido para o MVP porque o limite global causava `429` na demo e não era uma
proteção completa. Em produção, a recomendação é limitar no gateway/Redis, por
usuário e por rota. Não afirmar que o MVP tem essa proteção.

**O link da paciente é seguro?**
Token de 32 bytes, hash no banco, somente leitura, expira 30 dias após o
fechamento e não expõe nome/CNS. Ainda assim, é um link portador: quem tiver o link
vê o conteúdo.

**Onde ficam os dados?**
PostgreSQL local, apenas dados fictícios no seed. Não há produção.

**Como auditam acesso?**
Eventos registram autoria; não há auditoria de leitura completa nem retenção formal.
É uma pendência de produção.

### Escala e qualidade

**O que acontece com muitos casos?**
A API pagina a lista de concluídos, mas o filtro ainda carrega o conjunto em
memória. Para volume grande, o próximo passo é paginar/filtrar no banco, criar
índices adequados e talvez materializar métricas.

**Métricas calculadas na leitura escalam?**
Para o volume do piloto, sim. Para muitos casos e consultas frequentes, seria
necessário cache ou pré-agregação. O trade-off atual é simplicidade e consistência.

**Sem filas, como processar laudos?**
A extração é síncrona e tem timeout curto, com fallback. Para produção, uma fila
permitiria retries e desacoplamento.

**Quais testes dão confiança?**
61 unitários de backend, 5 de frontend e 19 e2e; CI roda lint, typecheck, testes e
build com PostgreSQL. A lacuna é teste de browser automatizado.

### Deploy e operação

**Como faz deploy?**
Não há deploy de aplicação no MVP. O compose local sobe apenas o PostgreSQL. CI
roda a suíte; produção exigiria containers, proxy, secrets, observabilidade e
backup.

**Como o banco é migrado?**
Migrations Prisma versionadas; `pnpm db:deploy` aplica em CI e no ambiente local.

### Perguntas de “por que não…”

**Por que não usar WebSocket?**
O painel é polling/query sob demanda; não há colaboração em tempo real. O custo de
WebSocket não se justifica.

**Por que não usar microsserviços?**
Um monólito modular é mais simples de operar e testar no prazo. A separação por
módulos deixa uma extração futura possível.

**Por que não usar GraphQL?**
A API é pequena e orientada a recursos; REST + Zod + Swagger resolve.

**Por que não usar Redux?**
O estado de servidor está no TanStack Query; o estado local é pequeno.

## 17. Perguntas que exigem resposta honesta

Se a banca perguntar, não invente número nem prometa integração:

- “O WhatsApp está integrado?” Não. É simulado na UI; envio real é roadmap.
- “O Gemini foi validado com laudo real?” Não. O código está pronto, mas a
  homologação real é pendência.
- “O sistema está pronto para produção?” Não. É um protótipo com dados fictícios,
  sem deploy, auditoria de leitura ou rate limiting.
- “Qual a acurácia da IA?” Não temos uma métrica calibrada. `confidence` é rótulo
  heurístico.
- “O sistema cria vaga?” Não. Ele mostra o prazo e gera evidência para cobrança.
- “O médico usa o sistema?” Não. A navegadora é a única usuária autenticada.

## 18. O que evitar dizer

- “A IA decide.”
- “Temos 95% de confiança.”
- “WhatsApp integrado.”
- “Pronto para produção.”
- “O SUS não tem relógio.”
- “O sistema cria vaga.”
- “O médico precisa mudar a rotina.”
- “O seed é um dado real.”
- “O rate limiting está implementado.”

## 19. Checklist final antes da banca

- [ ] `pnpm build` verde.
- [ ] `pnpm test` e `pnpm test:e2e` verdes.
- [ ] API e frontend rodando.
- [ ] `.env` com `LLM_PROVIDER=mock` para estabilidade, ou Gemini validado.
- [ ] Seed restaurado com **Restaurar dados**.
- [ ] Login testado.
- [ ] Link da paciente aberto em aba anônima/celular.
- [ ] Notificação SMS/e-mail/WhatsApp testada.
- [ ] Swagger aberto em `/docs`.
- [ ] Vídeo de backup gravado.
- [ ] Plano B: `LLM_PROVIDER=mock`, vídeo e slides em PDF.

## 20. Fechamento técnico

Se sobrar uma frase:

> “O CareFlow transforma uma obrigação legal em um relógio operacional: eventos
> append-only, prazos calculados na leitura, uma navegadora no controle e uma IA
> que sugere, mas nunca decide.”

Se perguntarem o que falta:

> “Integrações reais, endurecimento de segurança e deploy. O núcleo do fluxo e as
> decisões de arquitetura já estão prontos para evoluir.”
