const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000/api';
const email = `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
const password = 'password123';

async function call(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const health = await call('/health');
  assert(health.response.ok, `health falhou: ${health.response.status}`);
  assert(health.body?.status === 'ok', 'health não retornou status ok');

  const ready = await call('/health/ready');
  assert(ready.response.ok, `health/ready falhou: ${ready.response.status}`);
  assert(ready.body?.database === 'up', 'banco não está up');

  const register = await call('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke User', email, password }),
  });
  assert(register.response.status === 201, `register: ${register.response.status}`);

  const login = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(login.response.ok, `login: ${login.response.status}`);
  const token = login.body?.accessToken;
  assert(typeof token === 'string' && token.length > 20, 'login sem accessToken');

  const unauthorized = await call('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'oi' }] }),
  });
  assert(unauthorized.response.status === 401, 'chat deveria exigir autenticação');

  const chat = await call('/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Qual é o próximo passo?' }],
    }),
  });
  assert(chat.response.ok, `chat: ${chat.response.status}`);
  assert(typeof chat.body?.message === 'string', 'chat sem message');
  assert(chat.body?.provider === 'mock' || chat.body?.provider === 'gemini', 'provider inválido');

  console.log('Smoke ok: health, ready, register, login, chat 401, chat autenticado.');
  console.log(`Provider do chat: ${chat.body.provider}`);
}

main().catch((error) => {
  console.error(`Smoke falhou: ${error.message}`);
  process.exitCode = 1;
});
