# Referência da API REST

Base URL local: `http://localhost:8000/api` (Nginx → Laravel). O frontend consome via Axios (`src/frontend/lib/api-client.ts`).

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
| POST | `/register` | Cria conta `customer` e retorna token. Campos de endereço opcionais |
| POST | `/login` | Autentica e retorna token |
| GET | `/me` | Usuário autenticado |
| POST | `/logout` | Revoga token atual |
| PUT | `/profile` | Atualiza dados/endereço do próprio usuário |
| PUT | `/profile/password` | Troca senha (exige `current_password`) |

### Pets (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/pets` | Admin: todos; cliente: apenas os seus (com receitas/ingredientes) |
| POST | `/pets` | Cria pet. Admin pode criar para outro usuário via `user_id` |
| GET | `/pets/{id}` | Detalhe com receitas, pedidos e assinaturas (dono/admin) |
| PUT | `/pets/{id}` | Atualiza (dono/admin). `user_id` só surte efeito para admin |
| DELETE | `/pets/{id}` | Remove (dono/admin) |
| POST | `/pets/upload-photo` | Upload de foto (`photo`: jpeg/png/jpg/webp, máx. 5 MB). Retorna `data.photo_url` |

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
| POST | `/recipes` | Cria receita com `ingredients[]` (`{id, quantity, unit}`) e `pet_ids[]`. Cliente nunca cria template |
| GET | `/recipes/{id}` | Detalhe (ver visibilidade acima) |
| PUT | `/recipes/{id}` | Atualiza e re-sincroniza ingredientes/pets; recalcula custo. Cliente não altera template |
| DELETE | `/recipes/{id}` | Dono/admin |
| POST | `/recipes/calculate-cost` | Simula custo sem persistir (`ingredients[]`, `duration_days`, `daily_portions`) |

### Orders (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/orders` | Admin: todos; cliente: os seus (com itens, receitas, invoice) |
| POST | `/orders` | Cria pedido com `items[]` (`{recipe_id, pet_id?}`) e `delivery_address?`. Valida posse dos pets; gera `Invoice` automática |
| GET | `/orders/{id}` | Detalhe (dono/admin) |
| PUT | `/orders/{id}` | Cliente: `delivery_address`, `delivery_date`. Admin: também `status` e `scheduled_reposicao_date` |

Status de pedido: `pending_payment` → `pending` → `in_production` → `ready` → `out_for_delivery` → `delivered` (ou `cancelled`).

### Subscriptions (autenticado)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/subscriptions` | Admin: todas; cliente: as suas (com rotação e contagem de pedidos) |
| POST | `/subscriptions` | Cria assinatura: `pet_id` (próprio), `recipe_ids[]` (rotação ordenada), `start_date` (≥ hoje), `interval_days` (≥ 14, múltiplo de 7) |
| GET | `/subscriptions/{id}` | Detalhe (dono/admin) |
| PUT | `/subscriptions/{id}` | Altera `status` (`active`/`paused`/`cancelled`), rotação ou intervalo (recalcula `next_delivery_date`) |
| DELETE | `/subscriptions/{id}` | Cancela (soft — muda status, preserva histórico) |

### Admin (autenticado + `AdminMiddleware`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/customers` | Lista clientes com contagem de pets/pedidos; filtro `?search=` |
| POST | `/customers` | Cria cliente (role sempre `customer`) |
| GET | `/customers/{id}` | Detalhe completo (pets, pedidos, assinaturas, receitas) |
| PUT | `/customers/{id}` | Atualiza dados do cliente |
| GET | `/settings` | Parâmetros globais de precificação |
| PUT | `/settings` | Atualiza parâmetros |

## Exemplo

```bash
# Login
curl -s -X POST http://localhost:8000/api/login \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email": "admin@example.com", "password": "Password123"}'

# Criar pedido
curl -s -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"items": [{"recipe_id": 1, "pet_id": 2}], "delivery_address": "Rua X, 100"}'
```
