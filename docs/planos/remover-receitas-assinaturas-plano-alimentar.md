# Plano: receitas dentro do pet, fim das assinaturas e plano alimentar no pedido

Branch: `feature/remove-recipes-subscriptions-meal-plans` (a partir da `main`).

## Objetivo

1. **Receitas pertencem ao pet.** A seção independente de receitas sai do sistema. Todo pet é cadastrado junto com a sua primeira receita, e as demais receitas são criadas e editadas dentro do próprio pet.
2. **Sem assinaturas.** O módulo de assinaturas é removido; o sistema trabalha só com pedidos.
3. **Pedido = plano alimentar.** No pedido, cada receita tem a sua duração em dias (editável), e um pet pode ter várias receitas em sequência, formando um plano alimentar.

## Decisões de modelagem

| Tema | Antes | Depois |
| --- | --- | --- |
| Vínculo receita ↔ pet | N:N (`pet_recipe`) + coluna `recipes.pet_id` sem uso | 1:N: `recipes.pet_id` (cada receita de cliente pertence a um pet; um pet tem 1..N receitas) |
| Templates do catálogo (admin) | Receitas `is_template` | Continuam iguais, sem pet; servem de ponto de partida para a receita do pet |
| Criação de pet | Só dados do pet | `POST /pets` exige o objeto `recipe` (montada do zero ou a partir de um template) e cria pet + receita numa transação |
| Exclusão de receita | Livre (apagava itens de pedidos em cascata) | Bloqueada se for a última receita do pet ou se já estiver em algum pedido (`422`) |
| Assinaturas | Tabelas `subscriptions` e `subscription_recipes` | Tabelas renomeadas para `legacy_subscriptions` e `legacy_subscription_recipes` (dados preservados); todo o código removido |
| Item de pedido | Receita + pet, preço pela duração da receita | Receita + pet (obrigatório) + `duration_days` (7 a 90) + `position` (ordem no plano do pet); preço calculado para a duração escolhida |

## Etapas

### Etapa 1 — Receitas vinculadas ao pet

**Backend**
- Migration `2026_10_22_000001_make_recipes_belong_to_a_single_pet`:
  - receita de cliente com 1 pet no pivot → `pet_id` desse pet;
  - receita com N pets → mantém a original para o primeiro pet e cria uma cópia (com ingredientes) para cada pet a mais; itens de pedido daquele pet passam a apontar para a cópia;
  - template vinculado a pets → cópia privada para cada pet (o template continua no catálogo);
  - receita de cliente sem nenhum pet → fica como está (`pet_id` nulo), oculta na interface; o histórico de pedidos não é afetado;
  - remove a tabela `pet_recipe`. O `down()` recria o pivot a partir de `recipes.pet_id`.
- `Recipe`: remove `pets()`; `Pet::recipes()` vira `hasMany`.
- `RecipeController` / `StoreRecipeRequest` / `UpdateRecipeRequest` / `CloneRecipeRequest`: cliente precisa informar `pet_id` de um pet seu; `pet_ids` deixa de existir; `index` aceita `?pet_id=` e `?templates=1`.
- `RecipePolicy`: cliente vê templates e receitas dos seus pets; edita/exclui só receitas dos seus pets.
- `PetController::store` + `StorePetRequest`: exige `recipe` (com `ingredients` ou `template_id`), cria tudo numa transação.
- `DashboardService`: jornada passa a ser pet → receita → pedido (`add_pet`, `create_recipe`, `place_order`, `complete`), com `first_pet_without_recipe_id` para pets antigos sem receita.
- Testes Pest: criação de pet com receita (feliz, 422 sem receita, 403 em pet alheio), receitas por pet, bloqueio de exclusão, migração de dados.

**Frontend**
- Remove as páginas `/recipes`, `/recipes/new`, `/recipes/[id]`, `/recipes/[id]/edit`, o item "Receitas" do menu e os atalhos.
- `/pets/new` vira um fluxo em 2 passos: dados do pet → receita (template ou montar com ingredientes) → salva tudo de uma vez.
- `/pets/[id]` lista as receitas do pet; novas rotas `/pets/[id]/recipes/new` e `/pets/[id]/recipes/[recipeId]/edit` (`/pets/12/receitas/criar` em português).
- Jornada de onboarding, guia, landing e i18n (pt/en/es) atualizados.

### Etapa 2 — Remoção das assinaturas

**Backend**
- Migration `2026_10_22_000002_archive_subscriptions_tables`: renomeia as tabelas para `legacy_*` (sem perda de dados; `down()` desfaz).
- Remove `Subscription`, `SubscriptionRecipe`, `SubscriptionController`, requests, policy, resource, seeder, rotas e testes; remove `subscriptions` de `User`, `Pet`, `UserResource`, `PetResource`, `CustomerController` e do dashboard (`active_subscription`, `subscriptions_count`).

**Frontend**
- Remove `/orders/subscriptions/*`, `hooks/useSubscriptions`, `features/subscriptions`, `ActiveSubscriptionCard`, abas de assinaturas (pedidos do cliente, admin de pedidos e admin de cliente), a tela de escolha "avulso × assinatura" e o bloco de assinatura da landing.

### Etapa 3 — Pedido como plano alimentar

**Backend**
- Migration `2026_10_22_000003_add_duration_and_position_to_order_items`: `duration_days` (preenchido nos itens antigos com a duração da receita, ou 15) e `position`.
- `StoreOrderRequest`: `items.*.pet_id` obrigatório, `items.*.duration_days` entre 7 e 90; a receita precisa pertencer ao pet do item.
- `OrderController::store`: preço de cada item = custo da receita para a duração escolhida; `position` segue a ordem enviada por pet.
- `OrderItemResource`: expõe `duration_days` e `position`.

**Frontend**
- `/orders/new`: para cada pet, monta o plano escolhendo receitas, a duração de cada uma (passos de 1 dia, atalhos de 7/15/30) e a ordem; mostra a linha do tempo (dias 1–15, 16–30…), o custo de cada receita para a duração escolhida e o total.
- Detalhe do pedido (cliente e admin) e painel da produção mostram a duração e a sequência do plano.

### Etapa 4 — Documentação

`api.md`, `dominio.md`, `funcionalidades.md`, `arquitetura.md`, `testes.md` e este plano.

## Arquivos e módulos impactados

- **Backend**: `app/Models/{Recipe,Pet,User,Order,OrderItem}`, `app/Models/{Subscription,SubscriptionRecipe}` (removidos), `app/Http/Controllers/{Recipe,Pet,Order,Customer,Dashboard}Controller`, `SubscriptionController` (removido), `app/Http/Requests/{Recipe,Pet,Order}/*`, `Requests/Subscription/*` (removidos), `app/Policies/{Recipe,Subscription}Policy`, `app/Http/Resources/{Recipe,Pet,User,OrderItem,Dashboard,Subscription}Resource`, `app/Services/DashboardService`, `routes/api.php`, migrations novas, seeders e `tests/Feature/*`.
- **Frontend**: `app/[locale]/(dashboard)/{recipes,orders/subscriptions}/*` (removidos), `pets/*`, `orders/*`, `admin/{customers,orders}/*`, `dashboard`, `guide`, `features/{recipes,subscriptions,onboarding,dashboard,orders,landing,admin-customers}`, `hooks/{useRecipes,useSubscriptions,usePets,useOrders,useDashboard,useCustomers,useRecipeCycleCost}`, `components/layout/nav-links`, `i18n/pathnames`, `lib/order-status`, `messages/{pt,en,es}.json`.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Migrations rodam sozinhas no deploy (entrypoint) | Alteração de dados em produção no merge | **Backup do banco (`pg_dump`) antes do merge.** Migrations idempotentes e com `down()` |
| Receita ligada a vários pets | Precisa virar várias receitas | Cópia por pet, com ingredientes; itens de pedido re-apontados para a cópia do pet |
| Receita de cliente sem pet | Não cabe no novo modelo | Mantida com `pet_id` nulo (oculta); histórico de pedidos intacto |
| Pets antigos sem receita | Violam a nova regra "pet sempre tem receita" | Não dá para inventar receitas: o dashboard e a tela do pet pedem para criar a receita antes de pedir; o pedido exige receita do pet |
| `order_items.recipe_id` com `cascadeOnDelete` | Excluir receita apagava itens de pedidos antigos | Exclusão bloqueada para receitas já usadas em pedidos |
| Assinaturas existentes | Clientes deixam de ver os planos salvos | Tabelas preservadas como `legacy_*` (consultáveis pelo admin via banco); comunicar os clientes. Assinatura nunca gerou pedidos, então não há cobrança em andamento afetada |
| Links antigos (`/receitas`, `/pedidos/assinaturas/...`) | 404 | Rotas removidas do mapa de URLs; o menu e a jornada não apontam mais para elas |
| Quebra de contrato da API | Só o próprio frontend consome a API | Backend e frontend vão juntos neste PR |
| Duração diferente da receita | Preço muda | Preço sempre recalculado no servidor para a duração do item; o cliente vê o mesmo cálculo antes de confirmar |

## Como testar

1. Faça backup do banco e rode `php artisan migrate`.
2. Cadastre um pet: o fluxo pede a receita (template ou ingredientes); sem receita não salva.
3. No pet, crie uma segunda receita e tente excluir a única/uma receita usada em pedido (deve bloquear).
4. Em "Fazer pedido", monte um plano com duas receitas para o mesmo pet, com durações diferentes, e confira linha do tempo, preços e total; confirme e veja o detalhe do pedido.
5. Confira que não existem mais menu de receitas, rotas `/receitas` e telas de assinatura.
6. Suítes: `docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest` e `npm test` + `npm run build` no frontend.
