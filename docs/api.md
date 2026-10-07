# Referência da API REST

Base URL local: `http://localhost:8000/api` (FrankenPHP → Laravel). O frontend consome via Axios (`src/frontend/lib/api-client.ts`).

## Autenticação

Laravel **Sanctum** em modo **SPA stateful** (cookie de sessão httpOnly):

1. `GET /sanctum/csrf-cookie` — obtém o cookie `XSRF-TOKEN` (o apiClient do frontend faz isso automaticamente antes de qualquer mutação).
2. `POST /api/register` ou `POST /api/login` criam a sessão e retornam `{ user }` — **nenhum token é exposto ao JavaScript**.
3. Requisições seguintes autenticam pelo cookie de sessão (`withCredentials`) + header `X-XSRF-TOKEN`.
4. `POST /api/logout` invalida a sessão e rotaciona o CSRF token.

Requisitos: origem do frontend em `SANCTUM_STATEFUL_DOMAINS` (default inclui `localhost:3000`) e CORS com `supports_credentials` (já configurado em `config/cors.php`). Clientes não-stateful (sem `Origin`/`Referer` confiável) não recebem sessão.

## Contrato de resposta

Toda resposta (sucesso ou erro) segue o mesmo envelope, garantido pelo trait `ApiResponses` e pelos renderers de exceção em `bootstrap/app.php`:

```json
{
  "success": true,
  "message": "Pets fetched successfully",
  "data": { }
}
```

Erros:

```json
{
  "success": false,
  "message": "The name field is required.",
  "errors": { "name": ["The name field is required."] }
}
```

| HTTP | Quando |
| --- | --- |
| `200` / `201` | Sucesso / recurso criado |
| `401` | Não autenticado (`Unauthenticated.`) |
| `403` | Sem permissão (Policy/AdminMiddleware) — `Unauthorized.` |
| `404` | Recurso inexistente (`Resource not found.`) |
| `422` | Validação (FormRequest) — inclui `errors` por campo |

## Validação e autorização

- Cada endpoint de escrita tem um **FormRequest** dedicado em `app/Http/Requests/<Feature>/`.
- Autorização de recurso via **Policies** (`app/Policies/`): dono ou admin. Campos sensíveis (`user_id` de Pet/Recipe, `is_template`) são descartados no `validated()` para não-admins.
- Senhas seguem `Password::defaults()` (mínimo 8, letras e números — definido no `AppServiceProvider`).

## Endpoints

### Auth / Perfil (público ou autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/register` | Cria conta `customer` e inicia a sessão (cookie). Campos de endereço opcionais (a UI não os pede mais: o endereço é cadastrado depois, no perfil ou no primeiro pedido). Throttle: 10 req/min por IP |
| POST | `/login` | Autentica e inicia a sessão (cookie). Throttle: 10 req/min por IP |
| GET | `/me` | Usuário autenticado |
| POST | `/logout` | Encerra a sessão atual |
| PUT | `/profile` | Atualiza dados/endereço do próprio usuário |
| PUT | `/profile/password` | Troca senha (exige `current_password`) |

### Dashboard e onboarding (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/dashboard` | Resumo do cliente em uma única chamada: `progress` (contagens + `next_step`: `add_pet` \| `create_recipe` \| `link_recipe` \| `place_order` \| `complete`, `first_unlinked_recipe_id`, `has_address`), `onboarding_dismissed`, `alerts` (faturas pendentes, vacinas vencidas, pets incompletos), `current_order`, `active_subscription`, `pets` (com receitas vinculadas) e `recent_orders` (5 últimos) |
| POST | `/onboarding/dismiss` | Dispensa o guia "primeiros passos" (grava `users.onboarding_dismissed_at`) |
| DELETE | `/onboarding/dismiss` | Traz o guia de volta (limpa `onboarding_dismissed_at`) |

### Pets (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/pets` | Admin: todos; cliente: apenas os seus (com receitas/ingredientes) |
| POST | `/pets` | Cria pet. Admin pode criar para outro usuário via `user_id` |
| GET | `/pets/{id}` | Detalhe com receitas, pedidos e assinaturas (dono/admin) |
| PUT | `/pets/{id}` | Atualiza (dono/admin). `user_id` só surte efeito para admin |
| DELETE | `/pets/{id}` | Remove (dono/admin) |
| POST | `/pets/upload-photo` | Upload de foto (`photo`: jpeg/png/jpg/webp, máx. 5 MB). Retorna `data.photo_url` |

### Saúde do pet (autenticado; dono ou admin)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/pets/{pet}/vaccines` | Registra vacina (`name`, `application_date`, `next_due_date?` ≥ aplicação) |
| PUT | `/pets/{pet}/vaccines/{vaccine}` | Atualiza vacina |
| DELETE | `/pets/{pet}/vaccines/{vaccine}` | Remove vacina |
| POST | `/pets/{pet}/documents` | Anexa documento (`category`: exam/prescription/report/other, `name`, `file` pdf/jpg/png ≤ 10 MB). Arquivo vai para o disco **privado** |
| GET | `/pets/{pet}/documents/{document}/download` | Entrega o arquivo (dono ou admin; `file_url` da resposta aponta para esta rota) |
| DELETE | `/pets/{pet}/documents/{document}` | Remove documento e arquivo |

### Ingredients (autenticado; mutações admin)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/ingredients` | Admin: todos; cliente: apenas ativos |
| POST/PUT/DELETE | `/ingredients[/{id}]` | Somente admin |
| GET | `/ingredients/{id}` | Somente admin |

### Recipes (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/recipes` | Admin: todas; cliente: templates + próprias + vinculadas aos seus pets |
| POST | `/recipes` | Cria receita com `ingredients[]` (`{id, quantity, unit}`) e `pet_ids[]`. Cliente nunca cria template e precisa de **≥ 1,5 kg de ingredientes no total** (peso diário × `duration_days`; g/ml ÷ 1000, kg/l, unit = 0,1 kg) — senão `422` em `ingredients`. Admin é isento |
| GET | `/recipes/{id}` | Detalhe (ver visibilidade acima) |
| PUT | `/recipes/{id}` | Atualiza e re-sincroniza ingredientes/pets; recalcula custo. Cliente não altera template |
| DELETE | `/recipes/{id}` | Dono/admin |
| POST | `/recipes/{id}/clone` | Copia uma receita (template ou própria) para o usuário: `name` opcional e `pet_ids[]` opcional (devem ser pets do próprio usuário; admin isento). A cópia é privada, não-template, com ingredientes copiados e custo recalculado ao vivo. Retorna `201` com a receita |
| POST | `/recipes/calculate-cost` | Simula custo sem persistir (`ingredients[]`, `duration_days`, `daily_portions`) |

### Orders (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/orders` | Admin: todos; cliente: os seus (com itens, receitas, invoice) |
| POST | `/orders` | Cria pedido com `items[]` (`{recipe_id, pet_id?}`) e `delivery_address?`. Valida posse dos pets e visibilidade das receitas (receita privada de outro cliente → `403`); cria pedido, fatura e itens em transação; `unit_price`/`total_price` são sempre calculados ao vivo a partir do custo atual dos ingredientes (nunca de uma coluna cacheada); gera `Invoice` automática |
| GET | `/orders/{id}` | Detalhe (dono/admin) |
| PUT | `/orders/{id}` | Cliente: `delivery_address`, `delivery_date`. Admin: também `status` e `scheduled_reposicao_date` |

Status de pedido: `pending_payment` → `pending` → `in_production` → `ready` → `out_for_delivery` → `delivered` (ou `cancelled`).

### Subscriptions (autenticado)

Plano alimentar semanal fixo — **sem relação com `Order`**, nunca gera pedido sozinho. Ver [dominio.md](dominio.md#subscription).

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/subscriptions` | Admin: todas; cliente: as suas (com pet e receitas do plano) |
| POST | `/subscriptions` | Cria o plano: `pet_id` (próprio), `recipe_ids[]` (uma por semana, na ordem), `start_date` (≥ hoje), `duration_days` (≥ 14, múltiplo de 7). `recipe_ids` deve ter exatamente `duration_days / 7` itens, ou `422` |
| GET | `/subscriptions/{id}` | Detalhe (dono/admin) |
| PUT | `/subscriptions/{id}` | `status` sozinho (`active`/`paused`/`cancelled`) altera só o status. `duration_days` e `recipe_ids` são **atômicos**: só um dos dois é rejeitado com `422` — mudar a duração sempre exige reenviar a rotação completa (mesma regra de contagem exata do `POST`) |
| DELETE | `/subscriptions/{id}` | Cancela (soft — muda status, preserva histórico) |

Campos calculados na resposta (sempre ao vivo, nunca cacheados): `total_cycles` (`duration_days / 7`), `current_cycle_index` (semana atual 0-indexed, ou `null` fora do período do plano), `estimated_price` (soma do custo de cada receita **fixado em 7 dias**, a partir do preço atual dos ingredientes — não a `duration_days` nativa da receita).

### Admin (autenticado + `AdminMiddleware`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/customers` | Lista usuários com contagem de pets/pedidos; filtros `?search=` e `?role=` |
| POST | `/customers` | Cria usuário de qualquer papel (`role`: customer, admin, producer, delivery, vet, petshop; padrão `customer`) |
| GET | `/customers/{id}` | Detalhe completo (pets, pedidos, assinaturas, receitas) |
| PUT | `/customers/{id}` | Atualiza dados do usuário, inclusive `role` |
| GET | `/settings` | Parâmetros globais de precificação |
| PUT | `/settings` | Atualiza parâmetros |

## Exemplo

```bash
# 1. Cookie CSRF (necessário antes de qualquer login/mutação)
curl -s -c cookies.txt http://localhost:8000/sanctum/csrf-cookie

# 2. Login — grava o cookie de sessão no mesmo jar
XSRF=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')
curl -s -c cookies.txt -b cookies.txt -X POST http://localhost:8000/api/login \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email": "admin@example.com", "password": "Password123"}'

# 3. Criar pedido — reusa o cookie de sessão (sem Bearer token, não existe)
curl -s -c cookies.txt -b cookies.txt -X POST http://localhost:8000/api/orders \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"items": [{"recipe_id": 1, "pet_id": 2}], "delivery_address": "Rua X, 100"}'
```
