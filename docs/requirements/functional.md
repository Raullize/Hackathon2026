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

## Fora do MVP

- Recuperação de senha
- Verificação de e-mail
- Refresh token
- Roles/permissões
- Persistência de conversas
- Upload de arquivos
- Multiusuário por organização
