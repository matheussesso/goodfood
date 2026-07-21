# Instruções para Agentes de IA (Claude, Gemini, etc.)

**System (agente)**: siga rigorosamente as regras da equipe para código, refactor e análise de problemas. Em caso de conflito entre estas instruções e o pedido pontual do usuário, sinalize o conflito antes de prosseguir.

> Documentação técnica completa em [`docs/`](docs/README.md): [arquitetura](docs/arquitetura.md) · [domínio](docs/dominio.md) · [API](docs/api.md) · [setup/troubleshooting](docs/configuracao.md) · [testes](docs/testes.md) · [i18n](docs/internacionalizacao.md) · [boas práticas](docs/boas_praticas.md) · [git flow](docs/fluxo_git.md)

---

## Stack real (não presuma versões antigas)

- **Backend**: Laravel **13** · PHP **8.4** (container `php:8.4-fpm`) · Sanctum · Pest 4.
- **Frontend**: Next.js **16** (App Router) · React **19** · TypeScript strict · Tailwind CSS **4** · TanStack Query 5 · next-intl 4 · Zustand (somente sessão de auth).
- **Banco**: PostgreSQL 16 (dev) · SQLite em memória (testes).
- ⚠️ Next.js 16 tem breaking changes vs. versões do seu treinamento — consulte `src/frontend/node_modules/next/dist/docs/` antes de usar APIs do framework (ex.: `unstable_retry` em `error.tsx`, `preload` no lugar de `priority`, `globalNotFound`).

## Ambiente e comandos (quirks importantes)

- **Testes do backend rodam via Docker** (PHP do host pode não ter drivers PDO):
  ```bash
  docker compose run --rm --no-deps backend ./vendor/bin/pest
  ```
- **Build do frontend exige `NODE_ENV=production`** (bug do Next 16 em `/_global-error`; o script `npm run build` já define — não remova).
- Bind mounts do Docker podem deixar `node_modules`/`.next`/arquivos do backend com dono `root` no host (falhas `EACCES` em npm/git/build). Solução: `sudo chown -R $USER:$USER ...` ou rodar o comando dentro do container. Detalhes em [docs/configuracao.md](docs/configuracao.md#troubleshooting).

---

## Linguagem

- **Código** (identificadores, arquivos, schemas, DTOs, componentes, hooks, etc.): **apenas inglês**.
- **Documentação, chats, artefatos markdown, descrições de PR**: **português**.
- **Comentários inline e blocos PHPDoc/TSDoc**: **inglês**, mesmo que a conversa seja em português.

## Padrões Gerais de Qualidade

- Aplicar **SOLID, Clean Code, SRP, DRY, KISS**; preferir **early returns**.
- **Reutilizar** código, componentes, hooks, utilities e padrões existentes antes de criar novos.
- Evitar overengineering e abstrações prematuras.
- Nunca entregar código incompleto ou pseudocódigo — sempre **production-ready**, tipado, documentado e limpo.
- Toda feature, refactor ou bugfix **deve incluir ou recomendar testes**.
- Nenhuma entrega de UI é completa sem validação de **responsividade** (seção abaixo).

---

## Backend (Laravel API)

Padrões **já implementados** — siga-os, não os recrie:

- **FormRequests** em `app/Http/Requests/<Feature>/` para toda validação (e autorização de requisição via `authorize()` delegando às Policies). Campos sensíveis (`user_id`, `is_template`) são descartados para não-admins no `validated()`.
- **Policies** em `app/Policies/` para autorização por recurso (dono ou admin; admin com bypass em `before()`). Nunca escreva checks de ownership inline no controller.
- **Contrato de resposta** `{success, message, data, errors?}` via trait `ApiResponses` (`respondSuccess`/`respondError`) do `Controller` base. Erros (401/403/404/422) são convertidos centralizadamente em `bootstrap/app.php` — não trate exceções manualmente nos controllers.
- **JsonResources** em `app/Http/Resources/` para toda serialização (whitelist de campos + `whenLoaded`/`whenCounted`). Endpoint novo = Resource novo ou reuso; nunca serializar o Model direto.
- **Auth**: Sanctum **SPA stateful** (`statefulApi()`), sessão em cookie httpOnly + CSRF. Não emitir tokens Bearer para o app web.
- **Mass assignment**: campos sensíveis (ex.: `User.role`) ficam fora do fillable e são atribuídos explicitamente.
- Senhas: regra central `Password::defaults()` no `AppServiceProvider`.

Regras gerais:

- Sempre `declare(strict_types=1);` + tipagem estrita de parâmetros e retornos.
- **PHPDoc obrigatório** para classes, métodos públicos e protegidos complexos (`@param`, `@return`, `@throws`).
- **Controllers finos**: FormRequest → Service/Model → resposta padronizada. Lógica de negócio em `app/Services/`.
- Models Eloquent: apenas relacionamentos, casts, accessors. Repository pattern só quando queries complexas justificarem.
- **Banco**: eager loading (evitar N+1), sem queries em laços.
- **Testes Pest obrigatórios** para código novo/refatorado — cobrir caso feliz, validação (422) e autorização (403). Ver [docs/testes.md](docs/testes.md).

### Exemplo de PHPDoc esperado

```php
/**
 * Create a new order for the given customer.
 *
 * @param  CreateOrderDTO  $data
 * @return Order
 * @throws InsufficientStockException
 */
public function create(CreateOrderDTO $data): Order
{
    // ...
}
```

---

## Frontend (Next.js 16 App Router)

Padrões **já implementados** — siga-os:

- **HTTP** exclusivamente via `apiClient` (`lib/api-client.ts`, `API_BASE_URL` único, `withCredentials` + CSRF automático). APIs externas ganham wrapper em `lib/` (ex.: `lib/viacep.ts`). Nada de `fetch` solto para a API própria.
- **Auth**: cookie httpOnly gerenciado pelo backend — **nunca** armazenar credenciais em `localStorage`. Sessão restaurada pelo `AuthSessionProvider` (`GET /me`); estado espelhado no Zustand (`hooks/useAuth.ts`, com `isSessionResolved` para guards).
- **Estado de servidor**: TanStack Query (hooks em `hooks/`). **Estado de cliente**: Zustand apenas para sessão.
- **Boundaries**: `error.tsx` (com `unstable_retry`) e `loading.tsx` por route group. 404/erros globais: `app/global-not-found.tsx` + `app/global-error.tsx` (fora da árvore de locale — texto estático em inglês, exceção documentada).
- **Imagens**: sempre `next/image` (nunca `<img>`); `remotePatterns` já configurado a partir de `NEXT_PUBLIC_API_URL`.
- Todo o app vive sob `app/[locale]/` com route groups `(auth)` e `(dashboard)`.

Regras gerais:

- Preferir **Server Components**; `"use client"` só com interatividade/hooks/APIs do browser. (Estado atual: maioria das telas ainda é client-side; novas telas devem puxar na direção de RSC quando possível.)
- Componentes UI **presentational**; lógica em custom hooks/services.
- Formulários: **React Hook Form + Zod** (`zodResolver`), com schemas em `lib/validations/` espelhando as regras dos FormRequests do backend.
- Estilização: Tailwind + `cn()` de `lib/utils.ts` (`clsx` + `tailwind-merge`).
- Páginas grandes devem ser decompostas em `features/<feature>/components` — não crie novas páginas-monólito.
- Acessibilidade: ARIA, HTML semântico, alvos de toque ≥ 44×44px.
- Lógica crítica (hooks, utils, services) **deve ter testes unitários** (Vitest + RTL quando configurado).

### Documentação TSDoc obrigatória

Todo componente exportado, custom hook, função de `lib/`/`services/`/`utils/` e tipo complexo deve ter bloco TSDoc (descrição, `@param`, `@returns`, `@throws` quando aplicável). Componentes triviais podem ter comentário de uma linha.

```tsx
/**
 * Displays a customer's order summary with status badge and total.
 *
 * @param order - The order data to render.
 * @param onRetry - Callback invoked when the user retries a failed order.
 */
export function OrderSummaryCard({ order, onRetry }: OrderSummaryCardProps) {
  // ...
}
```

---

## Responsividade (critério de aceite obrigatório)

1. **Mobile-first**: estilos partem do menor breakpoint com overrides `sm:`/`md:`/`lg:`/`xl:`.
2. **Validar 3 larguras** antes de concluir: Mobile (~375px), Tablet (~768px), Desktop (~1280px+).
3. Evitar: larguras fixas em `px`, tabelas sem scroll horizontal controlado em telas pequenas, alvos de toque < 44×44px, imagens sem `next/image`, modais que não se adaptam.
4. Componentes reutilizáveis são responsivos **por padrão**; componente existente não-responsivo é code smell a reportar.
5. **Reportar no resumo da entrega** quais breakpoints foram considerados.

---

## Internacionalização (i18n) — obrigatório em todo texto de UI

**Nenhum texto visível pode ser hardcoded no JSX.** Fluxo completo em [docs/internacionalizacao.md](docs/internacionalizacao.md):

1. Definir a chave em `messages/pt.json`, depois `en.json` e `es.json` — **os 3 simultaneamente, com paridade total**.
2. Consumir com `useTranslations()` (ou `getTranslations()` em Server Components).
3. Chaves semânticas agrupadas por namespace (`Common`, `Auth`, `Navigation`, `Catalog`, `Recipes`, `Pets`, `Orders`, `Subscriptions`, `Profile`, `Production`, `Dashboard`, `admin`, `Metadata`, `NotFound`). **Nunca duplicar chave que já existe em `Common`.**
4. Interpolações (`{name}`, `{count}`) dentro da chave, nunca concatenadas.

Exceções permitidas: formatação de locale (moeda/data), dados da API (nomes próprios), e os arquivos `global-not-found.tsx`/`global-error.tsx` (fora da árvore de locale).

Ao detectar string hardcoded em código existente: reportar como code smell e corrigir no mesmo PR.

---

## Regras do Agente

- **Antes de alterar**: entender contexto, arquitetura, padrões existentes e impacto (performance, bundle, SEO, limite server/client, responsividade).
- Respeitar convenções e estrutura de pastas do projeto.
- Priorizar: **qualidade, segurança, performance, escalabilidade, manutenibilidade, responsividade e DX**.
- Bugs, code smells e problemas de segurança/arquitetura encontrados → **reportar claramente** antes de implementar mudanças.
- Refactors: explicar benefícios e trade-offs; preferir **melhorias incrementais** a rewrites.
- Testes e build fazem parte da entrega: rodar Pest (via Docker) e `npm run build`/`tsc --noEmit` antes de declarar concluído.
