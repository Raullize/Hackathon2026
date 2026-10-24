const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000/api';
const email = process.env.SMOKE_EMAIL ?? 'demo@careflow.dev';
const password = process.env.SMOKE_PASSWORD ?? 'demo1234';

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

  const login = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(login.response.ok, `login: ${login.response.status}`);
  const token = login.body?.accessToken;
  assert(typeof token === 'string' && token.length > 20, 'login sem accessToken');
  const auth = { Authorization: `Bearer ${token}` };

  const cases = await call('/cases?scope=open', { headers: auth });
  assert(cases.response.ok, `cases: ${cases.response.status}`);
  assert(Array.isArray(cases.body?.cases), 'cases sem lista');

  const alerts = await call('/alerts', { headers: auth });
  assert(alerts.response.ok, `alerts: ${alerts.response.status}`);
  assert(Array.isArray(alerts.body), 'alerts não é uma lista');

  const metrics = await call('/metrics', { headers: auth });
  assert(metrics.response.ok, `metrics: ${metrics.response.status}`);
  assert(typeof metrics.body?.today === 'string', 'metrics sem today');
  assert(typeof metrics.body?.diagnoses30?.denominator === 'number', 'metrics sem diagnóstico');

  console.log('Smoke ok: health, ready, login, casos, alertas e métricas.');
  console.log(`Casos abertos: ${cases.body.cases.length}; alertas: ${alerts.body.length}.`);
}

main().catch((error) => {
  console.error(`Smoke falhou: ${error.message}`);
  process.exitCode = 1;
});
