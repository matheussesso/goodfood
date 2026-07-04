# Arquitetura do Sistema

O GoodFood System separa responsabilidades entre um frontend web (Next.js) e uma API REST (Laravel), com PostgreSQL como banco e todo o ambiente de desenvolvimento conteinerizado via Docker Compose.

```text
Browser ──► Frontend (Next.js :3000) ──► Nginx (:8000) ──► Backend (Laravel/PHP-FPM) ──► PostgreSQL (:5432)
                                                              └── Scheduler (cron diário)
```

---

## 1. Backend — API Laravel

Local: `src/backend`. **Laravel 13** sobre **PHP 8.4** (imagem `php:8.4-fpm`), operando exclusivamente como API JSON (`routes/api.php`). Autenticação via **Sanctum** (tokens Bearer).

### Camadas

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| **FormRequests** | `app/Http/Requests/<Feature>/` | Validação de entrada e autorização de requisição (delegando às Policies). Campos sensíveis (`user_id`, `is_template`) são descartados para não-admins no `validated()` |
| **Controllers** | `app/Http/Controllers/` | Finos: recebem o FormRequest validado, orquestram Models/Services e respondem via trait `ApiResponses` |
| **Policies** | `app/Policies/` | Autorização por recurso (dono ou admin; admin tem bypass via `before()`). Auto-descobertas por convenção `Models\X → Policies\XPolicy` |
| **Services** | `app/Services/` | Regras de negócio: `RecipeCostCalculatorService` (precificação) e `SubscriptionOrderGenerationService` (pedidos recorrentes) |
| **Models** | `app/Models/` | Relacionamentos, casts e accessors. Mass assignment restrito (ex.: `role` de `User` fora do fillable) |
| **Middleware** | `app/Http/Middleware/AdminMiddleware.php` | Gate adicional das rotas administrativas |

### Contrato de resposta e erros centralizados

Toda resposta segue `{ success, message, data, errors? }`:

- Sucessos: trait `ApiResponses` (`respondSuccess`/`respondError`) usado pelo `Controller` base.
- Erros: renderers registrados em `bootstrap/app.php` convertem `ValidationException` (422), `AuthenticationException` (401), `AuthorizationException`/`AccessDeniedHttpException` (403) e `NotFoundHttpException`/`ModelNotFoundException` (404) para o mesmo envelope em rotas `api/*`.

Detalhes de endpoints em [api.md](api.md); entidades e regras em [domain.md](domain.md).

### Agendamento

`bootstrap/app.php` registra `subscriptions:generate-orders` com frequência diária. O serviço `scheduler` do Docker Compose executa o Laravel Scheduler; o comando gera pedidos de reposição para assinaturas vencidas.

### Evoluções planejadas

- **JsonResources** para serialização das respostas (hoje os Models são serializados diretamente, com campos sensíveis protegidos por `#[Hidden]`).
- **Repository pattern** apenas se/quando queries complexas justificarem.

---

## 2. Frontend — Next.js

Local: `src/frontend`. **Next.js 16 (App Router)** com **React 19** e **TypeScript strict**.

### Padrões em uso

- **Roteamento internacionalizado**: todo o app vive sob `app/[locale]/` (route groups `(auth)` e `(dashboard)`), com **next-intl** e middleware de locale. O root layout fica em `app/[locale]/layout.tsx`; por isso o 404 global usa `experimental.globalNotFound` + `app/global-not-found.tsx`, e `app/global-error.tsx` cobre erros que escapam do root layout (ambos fora da árvore de locale — texto estático). Ver [i18n.md](i18n.md).
- **Estado de servidor**: **TanStack Query** (provider em `components/providers/QueryProvider.tsx`) para fetch, cache e invalidação.
- **Estado de cliente**: **Zustand** apenas para a sessão de autenticação (`hooks/useAuth.ts`).
- **HTTP**: instância única do Axios em `lib/api-client.ts` (`API_BASE_URL` + interceptors de token Bearer e 401). Única exceção de `fetch` direto: API externa ViaCEP, encapsulada em `lib/viacep.ts`.
- **Boundaries**: `error.tsx` e `loading.tsx` por route group, com `unstable_retry` (Next 16).
- **UI**: Tailwind CSS 4 + componentes em `components/ui/` (padrão shadcn sobre Base UI/cmdk), `clsx`/`tailwind-merge` via `lib/utils.ts`, ícones lucide-react, temas com next-themes.
- **Imagens**: `next/image` com `remotePatterns` derivado de `NEXT_PUBLIC_API_URL` (fotos servidas pelo backend em `/storage`).

### Estado atual vs. alvo

- A maioria das páginas é **Client Component** consumindo a API via TanStack Query; Server Components/Server Actions ainda não são usados para dados (o token em `localStorage` limita fetch no servidor — a migração para cookie httpOnly destravará isso).
- Formulários: parte usa **React Hook Form**; a adoção de **Zod + @hookform/resolvers** está planejada, ainda não implementada.
- Páginas grandes de admin estão em processo de decomposição para `features/<feature>/components`.

---

## 3. Banco de Dados

**PostgreSQL 16** (imagem `postgres:16-alpine`), volume persistente, exposto em `localhost:5432` apenas para desenvolvimento. Schema gerenciado por migrations do Laravel (`src/backend/database/migrations`); dados de exemplo via seeders.

Nos testes, o banco é **SQLite em memória** (`phpunit.xml`) — ver [testing.md](testing.md).

---

## 4. Infraestrutura Docker

Definições em `docker-compose.yml` + `docker/`:

| Serviço | Imagem | Porta | Função |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | 5432 | Banco de dados |
| `backend` | `php:8.4-fpm` (custom) | — | PHP-FPM com `pdo_pgsql`, `gd`, `bcmath` etc. |
| `scheduler` | mesma do backend | — | Laravel Scheduler (jobs recorrentes) |
| `nginx` | `nginx:alpine` | 8000 | Servidor web/proxy do backend |
| `frontend` | `node:20-slim` | 3000 | `npm run dev` com hot reload |

O código é montado por bind mount (`./src/backend` e `./src/frontend`), permitindo editar no host com reload imediato nos containers.

> ⚠️ Processos dos containers rodam como root e podem deixar arquivos com dono `root` no host (`node_modules`, `.next`). Ver a seção de troubleshooting em [setup.md](setup.md#troubleshooting).
