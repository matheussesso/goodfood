# Arquitetura do Sistema

O GoodFood System separa responsabilidades entre um frontend web (Next.js) e uma API REST (Laravel), com PostgreSQL como banco e todo o ambiente de desenvolvimento conteinerizado via Docker Compose.

```text
Browser ──► Frontend (Next.js :3000) ──► Backend (Laravel/FrankenPHP :8000) ──► PostgreSQL (:5432)
```

```mermaid
flowchart LR
    Browser(["Browser"]) -->|HTTPS| FE["Frontend<br/>Next.js 16 App Router<br/>:3000"]
    FE -->|"Axios · cookie httpOnly + XSRF-TOKEN"| BE["Backend API<br/>Laravel 13 / FrankenPHP<br/>:8000"]
    BE -->|Eloquent| DB[("PostgreSQL 16<br/>:5432")]

    subgraph camadas["Camadas do Backend (por request)"]
        direction LR
        FR["FormRequest<br/>valida + autoriza"] --> CTRL["Controller<br/>fino"] --> SVC["Model / Service<br/>regra de negócio"] --> RES["JsonResource<br/>serializa"]
    end
    BE -.-> camadas
```

---

## 1. Backend — API Laravel

Local: `src/backend`. **Laravel 13** sobre **PHP 8.4** (imagem `dunglas/frankenphp:1-php8.4`), operando exclusivamente como API JSON (`routes/api.php`). Autenticação via **Sanctum SPA stateful** (`statefulApi()` em `bootstrap/app.php`): sessão em cookie httpOnly + proteção CSRF — nenhum token exposto ao JavaScript do navegador.

### Camadas

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| **FormRequests** | `app/Http/Requests/<Feature>/` | Validação de entrada e autorização de requisição (delegando às Policies). Campos sensíveis (`user_id`, `is_template`) são descartados para não-admins no `validated()` |
| **Controllers** | `app/Http/Controllers/` | Finos: recebem o FormRequest validado, orquestram Models/Services e respondem via trait `ApiResponses` |
| **Policies** | `app/Policies/` | Autorização por recurso (dono ou admin; admin tem bypass via `before()`). Auto-descobertas por convenção `Models\X → Policies\XPolicy` |
| **Services** | `app/Services/` | Regras de negócio: `RecipeCostCalculatorService` (precificação de receitas, sempre calculada ao vivo — nunca cacheada) |
| **Resources** | `app/Http/Resources/` | Serialização das respostas (JsonResource por model, com `whenLoaded`/`whenCounted` para relações) |
| **Models** | `app/Models/` | Relacionamentos, casts e accessors. Mass assignment restrito (ex.: `role` de `User` fora do fillable) |
| **Middleware** | `app/Http/Middleware/AdminMiddleware.php` | Gate adicional das rotas administrativas |

### Contrato de resposta e erros centralizados

Toda resposta segue `{ success, message, data, errors? }`:

- Sucessos: trait `ApiResponses` (`respondSuccess`/`respondError`) usado pelo `Controller` base.
- Erros: renderers registrados em `bootstrap/app.php` convertem `ValidationException` (422), `AuthenticationException` (401), `AuthorizationException`/`AccessDeniedHttpException` (403) e `NotFoundHttpException`/`ModelNotFoundException` (404) para o mesmo envelope em rotas `api/*`.

Detalhes de endpoints em [api.md](api.md); entidades e regras em [dominio.md](dominio.md).

### Agendamento

Nenhum comando agendado existe hoje — assinaturas não geram pedidos automaticamente (ver [dominio.md](dominio.md#subscription)) e não há serviço `scheduler` nos composes. Quando um job recorrente for necessário, adicione o comando em `routes/console.php` e um serviço `php artisan schedule:work` (mesma imagem do backend).

### Evoluções planejadas

- **Repository pattern** apenas se/quando queries complexas justificarem.

---

## 2. Frontend — Next.js

Local: `src/frontend`. **Next.js 16 (App Router)** com **React 19** e **TypeScript strict**.

### Padrões em uso

- **Roteamento internacionalizado**: todo o app vive sob `app/[locale]/` (route groups `(auth)` e `(dashboard)`), com **next-intl** e middleware de locale. O root layout fica em `app/[locale]/layout.tsx`; por isso o 404 é tratado por `app/[locale]/[...rest]/page.tsx` + `app/[locale]/not-found.tsx` (`experimental.globalNotFound` quebra o middleware do next-intl), e `app/global-error.tsx` cobre erros que escapam do root layout (ambos fora da árvore de locale — texto estático). Ver [internacionalizacao.md](internacionalizacao.md).
- **Estado de servidor**: **TanStack Query** (provider em `components/providers/QueryProvider.tsx`) para fetch, cache e invalidação.
- **Estado de cliente**: **Zustand** apenas para a sessão de autenticação (`hooks/useAuth.ts`). A credencial em si é um cookie httpOnly; `AuthSessionProvider` restaura o usuário via `GET /me` no carregamento.
- **HTTP**: instância única do Axios em `lib/api-client.ts` (`API_BASE_URL`, `withCredentials`, CSRF automático via `ensureCsrfCookie()` antes de mutações). Única exceção de `fetch` direto: API externa ViaCEP, encapsulada em `lib/viacep.ts`.
- **Formulários**: React Hook Form + **Zod** (`@hookform/resolvers`), schemas em `lib/validations/`.
- **Páginas decompostas**: componentes de feature em `features/<feature>/components` (ex.: `features/admin-customers/`).
- **Peças compartilhadas**: `lib/order-status.ts` (status/estilos de pedido e assinatura), `features/orders/components` (badge, timeline, itens), `features/recipes` (simulação de custo debounced, seletor de ingredientes e painel de custo), `components/address/AddressFields` (endereço com ViaCEP), `components/layout/nav-links.ts` (menu por papel) e `lib/masks.ts` (CEP/e-mail/telefone).
- **Dashboard e onboarding**: `GET /dashboard` (`DashboardService`) devolve todo o resumo do cliente e o `next_step` da jornada pet → receita → vínculo → pedido. No frontend, `hooks/useDashboard.ts` consome o endpoint; `features/onboarding/journey.ts` deriva o status de cada passo e `features/dashboard/components` compõe a tela. Um `MutationCache` global (`createAppQueryClient`) invalida `["dashboard"]` após qualquer mutação bem-sucedida, mantendo o resumo sempre fresco.
- **Boundaries**: `error.tsx` e `loading.tsx` por route group, com `unstable_retry` (Next 16).
- **UI**: Tailwind CSS 4 + componentes em `components/ui/` (padrão shadcn sobre Base UI/cmdk), `clsx`/`tailwind-merge` via `lib/utils.ts`, ícones lucide-react, temas com next-themes.
- **Imagens**: `next/image` com `remotePatterns` derivado de `NEXT_PUBLIC_API_URL` (fotos servidas pelo backend em `/storage`).

### Estado atual vs. alvo

- A maioria das páginas é **Client Component** consumindo a API via TanStack Query; com a autenticação agora em cookie httpOnly, a migração gradual de fetch de dados para **Server Components** ficou viável (próximo passo natural).
- Páginas grandes de admin restantes (`admin/catalog`, `production`) ainda aguardam decomposição no padrão `features/`.

---

## 3. Banco de Dados

**PostgreSQL 16** (imagem `postgres:16-alpine`), volume persistente, exposto em `localhost:5432` apenas para desenvolvimento. Schema gerenciado por migrations do Laravel (`src/backend/database/migrations`); dados de exemplo via seeders.

Nos testes, o banco é **SQLite em memória** (`phpunit.xml`) — ver [testes.md](testes.md).

---

## 4. Infraestrutura Docker

Dois ambientes, dois compose files, dois conjuntos de Dockerfiles — **dev nunca builda como prod, prod nunca monta código local**:

```text
docker-compose.dev.yml   # local — builda de docker/dev/, bind mount do código
docker-compose.yml       # VPS  — puxa imagens prontas do GHCR, sem código local
docker/
├── dev/
│   ├── backend/    Dockerfile, php.ini, Caddyfile (FrankenPHP dev)
│   └── frontend/   Dockerfile (node:24-slim, `npm run dev`)
└── prod/
    ├── backend/    Dockerfile multi-stage, entrypoint.sh, php.ini, Caddyfile (prod)
    └── frontend/   Dockerfile multi-stage (Next.js `output: "standalone"`)
```

### Desenvolvimento (`docker-compose.dev.yml`)

| Serviço | Imagem | Porta | Função |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | 5432 | Banco de dados |
| `backend` | `dunglas/frankenphp:1-php8.4` (custom) | 8000 | Servidor web/API (FrankenPHP) com `pdo_pgsql`, `gd`, `bcmath` etc. |
| `frontend` | `node:24-slim` | 3000 | `npm run dev` com hot reload |

Código montado por bind mount (`./src/backend` e `./src/frontend`) — editar no host reflete imediato nos containers. Rotas/config do FrankenPHP em `docker/dev/backend/Caddyfile`.

```mermaid
flowchart TB
    Dev(["Desenvolvedor<br/>localhost"])

    subgraph net["goodfood_network (bridge) — docker-compose.dev.yml"]
        FE["frontend<br/>node:24-slim<br/>npm run dev · :3000"]
        BE["backend<br/>dunglas/frankenphp:1-php8.4<br/>Caddy dev · :8000→80"]
        DB[("db<br/>postgres:16-alpine<br/>:5432")]
    end

    Dev -->|":3000"| FE
    Dev -->|":8000/api"| BE
    Dev -->|":5432 (opcional)"| DB
    FE -->|"/api"| BE
    BE --> DB

    BM1(["./src/frontend"]) -.->|bind mount| FE
    BM2(["./src/backend"]) -.->|bind mount| BE
```

> ⚠️ Processos dos containers rodam como root e podem deixar arquivos com dono `root` no host (`node_modules`, `.next`). Ver a seção de troubleshooting em [configuracao.md](configuracao.md#troubleshooting).

### Produção (`docker-compose.yml`, VPS)

Não builda nada localmente — sobe imagens **já publicadas no GHCR** pelo pipeline de CI/CD (`ghcr.io/<owner>/goodfood-backend` e `-frontend`, tag = SHA curto do commit).

- **`backend`**: imagem multi-stage (`composer install --no-dev`, autoload otimizado). `docker/prod/backend/entrypoint.sh` roda `config:cache`/`route:cache`/`view:cache` e `migrate --force` no start (não no build — dependem de env runtime). Caddy do FrankenPHP é o **ingress único do VPS**: serve a API direto e faz `reverse_proxy` pro serviço `frontend` (dois domínios, um container, ver [implantacao_vps.md](implantacao_vps.md)). TLS via certificado **Cloudflare Origin CA** (Cloudflare em modo Full strict na frente), não Let's Encrypt.
- **`frontend`**: imagem multi-stage Next.js com `output: "standalone"` — runtime final só copia `.next/standalone` + `.next/static`, sem `node_modules` completo.

```mermaid
flowchart TB
    CF["Cloudflare<br/>proxy laranja · TLS ao visitante"]

    subgraph vps["VPS — docker-compose.yml"]
        subgraph netp["goodfood_network (bridge)"]
            BEC["backend container<br/>FrankenPHP + Caddy<br/>ingress único · :80/:443"]
            FEC["frontend container<br/>Next.js standalone · :3000"]
            DBC[("db<br/>postgres:16-alpine<br/>127.0.0.1:5432")]
        end
        CERT[["certs/cloudflare-origin.{pem,key}<br/>montado no backend"]]
    end

    CF -->|"api.dominio.com — 443"| BEC
    CF -->|"app.dominio.com — 443"| BEC
    BEC -->|"Laravel API"| BEC
    BEC -->|"reverse_proxy"| FEC
    BEC --> DBC
    CERT -.-> BEC

    GHCR[("GHCR<br/>goodfood-backend / goodfood-frontend")] -.->|"docker compose pull"| BEC
    GHCR -.-> FEC
```

> O container `backend` é o único ingress do VPS: termina TLS com o certificado Origin CA da Cloudflare, serve a API Laravel diretamente e faz `reverse_proxy` para o `frontend` — dois domínios, um único container expondo 80/443. Detalhes de rede/DNS/certificado em [implantacao_vps.md](implantacao_vps.md).

### CI/CD

Pipeline completo em [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml): `Prepare → Quality → Test → Build → Deploy`. Build/Deploy só rodam em push na `main` (publica imagens no GHCR + SSH no VPS). Detalhes de gatilhos por branch em [fluxo_git.md](fluxo_git.md#cicd); setup completo do VPS (SSH, GHCR, Cloudflare) em [implantacao_vps.md](implantacao_vps.md).

```mermaid
flowchart LR
    T(["push / pull_request<br/>main ou develop"]) --> P["Prepare<br/>checkout, sha_short"]
    P --> Q["Quality<br/>Pint · ESLint · tsc --noEmit"]
    Q --> TS["Test<br/>Pest (Postgres service) · Vitest"]
    TS -->|"só push em main"| B["Build<br/>docker build + push → GHCR<br/>backend + frontend"]
    B -->|"só push em main"| D["Deploy<br/>SSH no VPS<br/>git reset --hard · compose pull/up"]

    style B stroke-dasharray: 4 3
    style D stroke-dasharray: 4 3
```

> Build e Deploy (linhas tracejadas) são condicionais — só executam em push direto na `main`. PRs e pushes na `develop` param em Test.
