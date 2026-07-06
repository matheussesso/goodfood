# GoodFood System

Plataforma de alimentação natural para pets por assinatura: tutores cadastram seus pets, montam receitas personalizadas com base nas necessidades de cada animal e recebem pedidos avulsos ou recorrentes. A empresa administra catálogo de ingredientes, precificação, produção e entregas.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · TanStack Query · next-intl (pt/en/es) |
| Backend | Laravel 13 · PHP 8.4 · Sanctum (API tokens) · Pest |
| Banco | PostgreSQL 16 (SQLite em memória nos testes) |
| Infra | Docker (dev/prod separados) · GitHub Actions CI/CD · GHCR · VPS + Cloudflare |

## Início rápido

```bash
git clone <url-do-repositorio>
cd goodfood-system-new
cp src/backend/.env.example src/backend/.env
docker compose -f docker-compose.dev.yml up -d

docker exec -it goodfood_backend composer install
docker exec -it goodfood_backend php artisan key:generate
docker exec -it goodfood_backend php artisan migrate --seed
docker exec -it goodfood_backend php artisan storage:link
docker exec -it goodfood_frontend npm install
```

> `docker-compose.yml` (raiz, sem `-f`) é o compose de **produção** — usado só pelo pipeline de deploy no VPS, não localmente. Local é sempre `docker-compose.dev.yml`.

- 🌐 Frontend: http://localhost:3000
- 🚀 API: http://localhost:8000/api

Guia completo (incluindo **troubleshooting** de permissões do Docker, testes e build): [docs/setup.md](docs/setup.md).

## Documentação

Toda a documentação técnica vive em [`docs/`](docs/README.md):

| Documento | Conteúdo |
| --- | --- |
| [Setup e Troubleshooting](docs/setup.md) | Ambiente local, comandos do dia a dia, problemas comuns |
| [Arquitetura](docs/architecture.md) | Camadas do backend, padrões do frontend, infraestrutura |
| [Modelo de Domínio](docs/domain.md) | Entidades, relacionamentos e regras de negócio |
| [API REST](docs/api.md) | Autenticação, contrato de resposta e todos os endpoints |
| [Testes](docs/testing.md) | Como rodar e escrever testes (Pest) |
| [Internacionalização](docs/i18n.md) | Fluxo obrigatório pt/en/es do frontend |
| [Boas Práticas](docs/best_practices.md) | Padrões de código e qualidade |
| [Git Flow](docs/git_flow.md) | Branches, commits e pull requests |

## Funcionalidades

**Para tutores (clientes)**
- Cadastro e gestão de pets (perfil, restrições alimentares, alergias, foto).
- Receitas personalizadas por pet, com custo calculado a partir dos ingredientes.
- Pedidos avulsos multi-pet e assinaturas com rotação de receitas e entrega recorrente.
- Acompanhamento de pedidos e histórico; perfil com endereço (busca por CEP/ViaCEP).

**Para a empresa (admin)**
- Catálogo de ingredientes e receitas-modelo com parâmetros globais de precificação.
- Gestão de clientes, pets, pedidos (fluxo de status até a entrega) e assinaturas.
- Geração automática diária de pedidos de reposição para assinaturas vencidas (scheduler).
- Painel de produção.

**Transversal**
- Autenticação Sanctum com controle de acesso por papel (customer/admin) via Policies.
- Interface 100% internacionalizada (Português, Inglês e Espanhol).
- API com contrato de resposta único `{success, message, data, errors?}` e tratamento centralizado de erros.

## Estrutura do repositório

```text
├── src/
│   ├── backend/            # API REST (Laravel)
│   │   ├── app/
│   │   │   ├── Http/       # Controllers, FormRequests, Middleware
│   │   │   ├── Models/     # Eloquent models
│   │   │   ├── Policies/   # Autorização por recurso
│   │   │   ├── Services/   # Regras de negócio (custo, assinaturas)
│   │   │   └── Console/    # Comandos agendados
│   │   ├── database/       # Migrations, factories e seeders
│   │   ├── routes/         # api.php
│   │   └── tests/          # Suíte Pest (Feature/Unit)
│   └── frontend/           # Aplicação web (Next.js)
│       ├── app/[locale]/   # App Router: (auth) e (dashboard)
│       ├── components/     # UI reutilizável (ui/, layout/, providers/)
│       ├── hooks/          # TanStack Query hooks + useAuth (zustand)
│       ├── lib/            # api-client, viacep, utils, api-error
│       ├── i18n/           # Roteamento e request config do next-intl
│       └── messages/       # pt.json / en.json / es.json
├── docs/                   # Documentação técnica (índice em docs/README.md)
├── docker/
│   ├── dev/                # Dockerfiles de desenvolvimento (backend, frontend)
│   └── prod/               # Dockerfiles de produção (multi-stage, otimizados)
├── docker-compose.dev.yml  # Orquestração local
├── docker-compose.yml      # Orquestração de produção (VPS, imagens do GHCR)
└── .github/workflows/      # Pipeline CI/CD (ci-cd.yml)
```

## Comandos essenciais

```bash
# Testes do backend
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest

# Lint e build do frontend
docker exec -it goodfood_frontend npm run lint
docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm run build

# Containers
docker compose -f docker-compose.dev.yml stop        # parar
docker compose -f docker-compose.dev.yml down -v     # zerar tudo (inclui banco)
```

Mais comandos e soluções de problemas em [docs/setup.md](docs/setup.md).

## Contribuindo

1. Leia [docs/best_practices.md](docs/best_practices.md) e [docs/git_flow.md](docs/git_flow.md).
2. Crie sua branch a partir da `develop` (`feature/...`, `bugfix/...`).
3. Toda entrega exige testes ([docs/testing.md](docs/testing.md)), i18n completo ([docs/i18n.md](docs/i18n.md)) e validação de responsividade.
4. Abra o PR para `develop` com descrição em português — o pipeline de CI/CD ([docs/git_flow.md#cicd](docs/git_flow.md#cicd)) roda Quality + Test automaticamente.
