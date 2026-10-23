# Testes

## Backend (Pest)

A suíte usa **Pest** com `RefreshDatabase` sobre SQLite em memória (configurado no `phpunit.xml`, incluindo `APP_KEY` fixo para o ambiente de teste).

### Como rodar

> ⚠️ O PHP do host pode não ter os drivers PDO (`pdo_sqlite`). O caminho garantido é rodar dentro do container:

```bash
# Suíte completa
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest

# Um arquivo específico
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest tests/Feature/OwnershipTest.php

# Com filtro por nome de teste
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest --filter="cannot transfer"
```

Com os containers já de pé, também funciona:

```bash
docker exec -it goodfood_backend php artisan test
```

### O que a suíte cobre

| Arquivo | Cobre |
| --- | --- |
| `tests/Feature/AuthTest.php` | Registro (incl. tentativa de injetar `role=admin`), política de senha, login/logout, revogação de tokens legados, contrato de erro 401/422, bloqueio de rotas admin para clientes |
| `tests/Feature/OwnershipTest.php` | IDOR/ownership: pets, receitas, pedidos e ingredientes de outros usuários; regressões de transferência de propriedade via `user_id`; regras de template; pedido para pet alheio (`403`) |
| `tests/Feature/OrderTest.php` | Criação, listagem e detalhe de pedido como plano alimentar: preço de cada item para a sua `duration_days` (sempre ao vivo, a partir do custo atual dos ingredientes), sequência (`position`) por pet, validação de `pet_id`/`recipe_id`/`duration_days` (7–90), receita de outro pet e duração abaixo de 1,5 kg (`422`), pet de outro cliente (`403`), fatura automática e atualização de entrega/status |
| `tests/Feature/CustomerControllerTest.php` | Gestão admin de usuários: filtro/criação/troca de `role`, bloqueio para não-admins |
| `tests/Feature/PetVaccineTest.php` / `PetDocumentTest.php` | CRUD de vacinas e documentos do pet, validação e ownership |
| `tests/Feature/SettingsTest.php` | Parâmetros de precificação: leitura/atualização admin, validação, bloqueio de clientes e reflexo imediato no preço |
| `tests/Feature/IngredientTest.php` | Listagem por papel, CRUD admin, validação e autorização |
| `tests/Feature/PetTest.php` | CRUD de pets, escopo por dono, criação junto com a primeira receita (ingredientes ou template ativo; `422` sem receita ou abaixo do peso mínimo, sem criar nada), criação por admin, upload de foto |
| `tests/Feature/RecipeTest.php` | Criação (sempre para um pet do cliente; template só admin)/edição (sem trocar de pet)/listagem/exclusão (bloqueio da última receita do pet e de receita usada em pedido), peso mínimo, `calculate-cost` e **número constante de queries** na listagem (anti N+1) |
| `tests/Feature/DashboardTest.php` | Resumo do dashboard: `next_step` em cada etapa da jornada (pet → receita → pedido), alertas (faturas, vacinas vencidas, pets incompletos), pedido atual, receitas de cada pet, ordenação dos pedidos recentes, dismiss/restore do guia e isolamento entre clientes |
| `tests/Feature/RecipeCloneTest.php` | Clonagem de receita para um pet (`pet_id` obrigatório, só do dono; admin isento): template e própria, cópia privada com custo recalculado, bloqueio de receita alheia |
| `tests/Feature/RecipePricingTest.php` | Custo de receita retornado pela API reflete o preço atual dos ingredientes, mesmo sem resalvar a receita |
| `tests/Feature/RecipeOwnershipMigrationTest.php` | Migration `pet_recipe` → `recipes.pet_id`: receita compartilhada vira uma por pet (ingredientes e histórico de pedidos preservados), template vinculado gera cópia, receita sem pet fica intacta e `down()` recria o pivot |
| `tests/Feature/SubscriptionArchiveMigrationTest.php` | Tabelas de assinatura renomeadas para `legacy_*` (não apagadas) e restauradas no `down()` |
| `tests/Feature/OrderPlanMigrationTest.php` | Backfill de `order_items.duration_days` (duração da receita) e `position` por pedido e pet |

### Convenções

- Todo endpoint novo exige teste de feature cobrindo: caso feliz, validação (422) e autorização (403) quando aplicável.
- Helpers de criação ficam no próprio arquivo de teste (funções globais do Pest — atenção a colisão de nomes entre arquivos).
- Asserções devem verificar o **contrato** (`success`, `message`, `data`/`errors`), não apenas o status HTTP.

## Frontend (Vitest + React Testing Library)

A suíte usa **Vitest** (ambiente jsdom) com **React Testing Library** para componentes. Config em `vitest.config.ts` (alias `@/`, setup com jest-dom em `vitest.setup.ts`); testes co-localizados como `*.test.ts(x)`.

```bash
cd src/frontend
npm test              # vitest run (suíte completa)
npm run test:watch    # modo watch
```

### O que a suíte cobre

| Arquivo | Cobre |
| --- | --- |
| `features/production/cycle.test.ts` | Regras do ciclo de produção (reposição por dia da semana, override do admin), grade do calendário, período (atalhos, inversão de datas, limites inclusivos) e pedidos por período, mês e dia |
| `features/production/components/production-components.test.tsx` | Filtro de período, calendário de pedidos realizados (tiles, seleção de dia, navegação, dias fora do período), painel do dia e lista |
| `lib/validations/recipe.test.ts` | Schemas Zod de receita (create/edit) e de settings de precificação |
| `lib/viacep.test.ts` | Wrapper ViaCEP: mapeamento de campos, CEP inexistente, falha de rede |
| `hooks/useAuth.test.ts` | Store de sessão: setAuth/restore/logout (incl. falha da API), flags de resolução |
| `features/admin-customers/components/PetFormModal.test.tsx` | RTL: seed do formulário em criar vs. editar (com providers intl + react-query) |
| `hooks/use*.test.tsx` | Hooks de dados (pedidos, receitas, pets, clientes, ingredientes, settings, perfil, vacinas, documentos, custo por duração do plano): URLs, payloads e invalidação de cache |
| `features/landing/landing.test.tsx`, `lib/company.test.ts` | Landing: integridade do conteúdo (cada item renderizado tem texto em `pt.json`), âncoras do menu, hero/CTAs, botão que muda com a sessão, FAQ, rodapé, menu mobile, JSON-LD, sitemap e robots |
| `i18n/pathnames.test.ts` | URLs traduzidas: ida e volta canônica ↔ localizada, rotas dinâmicas, query/hash, prioridade estática sobre dinâmica |
| `lib/*.test.ts` | `api-client` (CSRF), `api-error`, `format`, `masks`, `order-status`, `recipe-weight`, `user-roles` |
| `components/address`, `components/layout/nav-links`, `components/ui/view-mode-toggle` | Endereço com ViaCEP, menu por papel, alternador de visualização |
| `features/onboarding`, `features/dashboard`, `features/profile` | Jornada (`journey.ts`), stepper, card do próximo passo, estados vazios, guia "primeiros passos", banner de continuação, alertas, cards de pet, pedidos recentes e medidor de completude da conta |
| `app/[locale]/(dashboard)/dashboard/page.test.tsx` | Estados da tela: conta nova (só guia), guia dispensado, conta ativa, erro com retry e visão de staff |
| `features/orders`, `features/recipes` | Badge/timeline de status, lógica do plano alimentar (`meal-plan.ts`: duração mínima, limites, linha do tempo), intervalos e links dos itens (`order-items.ts`), stepper de duração, card do plano do pet, seletor de ingredientes, painel e hook de custo, rascunho de receita (`draft.ts`) e componentes do fluxo de criação de receita |

### Convenções

- `vitest.setup.ts` mocka `@/i18n/routing` (Link/router) globalmente; `test/render-intl.tsx` (`renderWithProviders`) entrega locale `pt` + QueryClient.
- Componentes que dependem de `useTranslations`/TanStack Query são renderizados com `NextIntlClientProvider` (messages `pt`) + `QueryClientProvider`; `@/lib/api-client` é mockado com `vi.mock`.
- Lógica pura (helpers, schemas, stores) é testada sem render.

Validações complementares:

```bash
npx tsc --noEmit      # typecheck
npx eslint app hooks lib features
npm run build         # build de produção (requer NODE_ENV=production, já no script)
```

> Se o host tiver `node_modules`/`.next` com dono root (efeito do bind mount do Docker), rode o build dentro do container: `docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm run build`. Ver [configuracao.md](configuracao.md#troubleshooting).
