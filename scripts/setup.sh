#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "Node.js não encontrado."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm não encontrado."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker não encontrado."; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  if command -v openssl >/dev/null 2>&1; then
    GENERATED_SECRET="$(openssl rand -hex 32)"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${GENERATED_SECRET}|" .env
  fi
  echo "Criado .env a partir de .env.example."
fi

echo "Subindo PostgreSQL..."
docker compose up -d db

echo "Aguardando o PostgreSQL ficar saudável..."
for _ in $(seq 1 30); do
  if docker compose exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker compose exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
  echo "PostgreSQL não ficou pronto. Veja 'docker compose logs db'."
  exit 1
fi

echo "Instalando dependências..."
pnpm install --frozen-lockfile

echo "Gerando contratos e Prisma Client..."
pnpm --filter @hackathon/contracts build
pnpm --filter @hackathon/backend db:generate

echo "Aplicando migrations..."
pnpm --filter @hackathon/backend db:deploy

echo "Rodando seed de demonstração..."
pnpm --filter @hackathon/backend db:seed

cat <<'EOF'

Ambiente pronto.

Próximos comandos:
  pnpm dev             # contracts + backend + frontend
  pnpm dev:backend     # só API em http://localhost:3000
  pnpm dev:frontend    # só frontend em http://localhost:5173
  pnpm test            # unitários
  pnpm test:e2e        # e2e da API
  pnpm smoke           # smoke test com API rodando
  pnpm db:studio       # Prisma Studio

Swagger: http://localhost:3000/docs
Login seed: demo@hackathon.dev / demo1234
EOF
