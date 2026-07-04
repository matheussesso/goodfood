# Modelo de Domínio

O GoodFood System é uma plataforma de alimentação natural para pets por assinatura: tutores cadastram seus pets, recebem receitas personalizadas e fazem pedidos avulsos ou recorrentes. A empresa administra catálogo, produção e entregas.

## Entidades

```text
User (tutor ou admin)
 ├── Pet (1:N)
 │    └── Recipe (N:M via pet_recipe — receitas vinculadas ao pet)
 ├── Recipe (1:N — receitas criadas pelo usuário; templates têm user_id null ou de admin)
 ├── Subscription (1:N)
 │    ├── Pet (N:1)
 │    └── Recipe (N:M via subscription_recipes, ordenada por `position` — rotação)
 └── Order (1:N)
      ├── OrderItem (1:N — cada item aponta para Recipe e opcionalmente Pet)
      ├── Invoice (1:1)
      └── Subscription (N:1 opcional — pedidos gerados por assinatura)

Ingredient
 └── Recipe (N:M via ingredient_recipe, pivot com `quantity` e `unit`)

GeneralSetting (singleton, id=1 — parâmetros globais de precificação)
```

### User
- Campos principais: `name`, `email`, `password`, `phone`, endereço desmembrado (`street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zipcode`), `whatsapp_notifications`.
- **`role`**: `customer` (padrão) | `admin` | `producer` | `delivery`. O campo **não é mass assignable** — é atribuído explicitamente no código (registro público sempre cria `customer`).
- Helpers: `isAdmin()`, `isCustomer()`.

### Pet
- Pertence a um `User`. Campos: `name`, `type` (`dog`|`cat`), `breed`, `weight` (kg), `age` (meses), `birth_date`, `restrictions`, `allergies`, `special_needs`, `photo_url`.
- Foto enviada via `POST /api/pets/upload-photo` (armazenada em `storage/app/public/pets`).

### Ingredient
- Catálogo global (não pertence a usuário). Campos: `name`, `category`, `unit` (kg, g, unit, l), `cost_per_unit`/`unit_cost`, `loss_rate` (fator de perda), `difficulty_multiplier`, `stock_quantity`, `is_active`.
- Somente admins criam/editam/removem; clientes veem apenas os ativos.

### Recipe
- Pode ser **template** (`is_template = true`, criada por admin, visível a todos) ou **receita de cliente** (vinculada a `user_id` e opcionalmente a pets).
- Campos: `name`, `description`, `pet_type` (`dog`|`cat`|`all`), `duration_days`, `daily_portions`, `instructions`, `base_cost`, `ingredient_cost`, `is_active`.
- Ingredientes via pivot com `quantity` e `unit`. Ao salvar, `updateBaseCost()` recalcula `base_cost`/`ingredient_cost` usando o serviço de custo (abaixo).
- Visibilidade para clientes: templates + receitas próprias + receitas vinculadas a seus pets (ver `RecipePolicy`).

### Order / OrderItem / Invoice
- `Order`: `user_id`, `subscription_id` (opcional), `total_price`, `status`, `delivery_address`, `delivery_date`, `scheduled_reposicao_date`.
- Status possíveis: `pending_payment`, `pending`, `in_production`, `ready`, `out_for_delivery`, `delivered`, `cancelled`. Somente admins alteram status.
- `OrderItem`: um por receita selecionada, com `pet_id` opcional (a mesma receita pode aparecer em itens diferentes para pets diferentes) e `unit_price` congelado no momento da compra.
- `Invoice`: criada junto com o pedido (`amount`, `status` inicial `pending`, `due_date` = hoje + 3 dias).

### Subscription
- `user_id`, `pet_id`, `interval_days` (mínimo 14, múltiplo de 7), `status` (`active`|`paused`|`cancelled`), `start_date`, `next_delivery_date`.
- **Rotação de receitas**: N receitas ordenadas por `position` no pivot `subscription_recipes`. A cada ciclo, a receita da vez é usada para gerar o pedido.
- Cancelamento é lógico (status `cancelled`) — histórico preservado, sem hard delete.

### GeneralSetting
- Registro singleton (`GeneralSetting::getInstance()`) com os parâmetros globais da fórmula de precificação: custos fixos e multiplicadores de produção, logística, reserva, marketing, fiscal, cobrança, agendamento e dificuldade.

## Regras de negócio principais

### Cálculo de custo de receita (`RecipeCostCalculatorService`)
Calcula o custo estimado de uma receita a partir dos ingredientes selecionados (`quantity` × custo unitário × `loss_rate` × `difficulty_multiplier`), da duração (`duration_days`) e porções diárias, aplicando os parâmetros do `GeneralSetting` (produção, logística, margens etc.). Retorna `estimatedCost`, `ingredientCost`, `costPerKg` e o `costBreakdown` detalhado. Exposto também via `POST /api/recipes/calculate-cost` para simulação sem persistir.

### Geração de pedidos por assinatura (`SubscriptionOrderGenerationService`)
Roda diariamente via scheduler (`subscriptions:generate-orders`, registrado em `bootstrap/app.php`):

1. Seleciona assinaturas `active` com `next_delivery_date <= hoje`.
2. Para cada uma, pega a receita da vez na rotação (`recipeForCycle`).
3. Cria `Order` (+ `OrderItem` + `Invoice`) com preço recalculado no momento.
4. Avança `next_delivery_date` em `interval_days`.

### Autorização (Policies)
- `PetPolicy`, `OrderPolicy`, `SubscriptionPolicy`: dono ou admin (admin tem bypass via `before()`).
- `RecipePolicy`: visualização inclui templates e receitas ligadas aos pets do usuário; clientes não modificam templates nem transferem propriedade.
- `IngredientPolicy`: mutações somente admin.
- Rotas `/customers` e `/settings` exigem `AdminMiddleware` além do Sanctum.
