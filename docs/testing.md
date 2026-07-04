# Testes

## Backend (Pest)

A suíte usa **Pest** com `RefreshDatabase` sobre SQLite em memória (configurado no `phpunit.xml`, incluindo `APP_KEY` fixo para o ambiente de teste).

### Como rodar

> ⚠️ O PHP do host pode não ter os drivers PDO (`pdo_sqlite`). O caminho garantido é rodar dentro do container:

```bash
# Suíte completa
docker compose run --rm --no-deps backend ./vendor/bin/pest

# Um arquivo específico
docker compose run --rm --no-deps backend ./vendor/bin/pest tests/Feature/OwnershipTest.php

# Com filtro por nome de teste
docker compose run --rm --no-deps backend ./vendor/bin/pest --filter="cannot transfer"
```

Com os containers já de pé, também funciona:

```bash
docker exec -it goodfood_backend php artisan test
```

### O que a suíte cobre

| Arquivo | Cobre |
| --- | --- |
| `tests/Feature/AuthTest.php` | Registro (incl. tentativa de injetar `role=admin`), política de senha, login/logout, revogação de tokens, contrato de erro 401/422, bloqueio de rotas admin para clientes |
| `tests/Feature/OwnershipTest.php` | IDOR/ownership: pets, receitas, pedidos e ingredientes de outros usuários; regressões de transferência de propriedade via `user_id`; regras de template |
| `tests/Feature/SubscriptionTest.php` | Criação de assinatura com rotação, validação de `interval_days`, pausa/cancelamento, recálculo de `next_delivery_date`, geração de pedidos pelo serviço |

### Convenções

- Todo endpoint novo exige teste de feature cobrindo: caso feliz, validação (422) e autorização (403) quando aplicável.
- Helpers de criação ficam no próprio arquivo de teste (funções globais do Pest — atenção a colisão de nomes entre arquivos).
- Asserções devem verificar o **contrato** (`success`, `message`, `data`/`errors`), não apenas o status HTTP.

## Frontend

Ainda **não há** suíte de testes no frontend (Vitest + React Testing Library estão no roadmap — ver README). Validações atuais no CI local:

```bash
cd src/frontend
npx tsc --noEmit      # typecheck
npx eslint app hooks lib
npm run build         # build de produção (requer NODE_ENV=production, já no script)
```

> Se o host tiver `node_modules`/`.next` com dono root (efeito do bind mount do Docker), rode o build dentro do container: `docker compose run --rm --no-deps frontend npm run build`. Ver [setup.md](setup.md#troubleshooting).
