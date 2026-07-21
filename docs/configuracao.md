# Setup e Execução Local

Guia para subir o ambiente de desenvolvimento com **Docker Compose** e resolver os problemas mais comuns.

## Pré-requisitos

- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)

*Opcional (tooling de IDE no host): PHP 8.4 com extensões PDO, Composer e Node.js 20+.*

> **`docker-compose.yml` (raiz) é o compose de PRODUÇÃO** (usado no VPS, ver
> [implantacao_vps.md](implantacao_vps.md)) — ele referencia imagens do GHCR, não builda
> a partir do código local. Localmente use sempre `docker-compose.dev.yml`.
> Para não repetir `-f` a cada comando: `export COMPOSE_FILE=docker-compose.dev.yml`.

---

## Subindo o ambiente

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd goodfood-system-new
```

### 2. Variáveis de ambiente do backend

```bash
cp src/backend/.env.example src/backend/.env
```

Confirme que a conexão de banco casa com o `docker-compose.dev.yml`:

```env
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=goodfood
DB_USERNAME=root
DB_PASSWORD=rootpassword
```

### 3. Subir os containers

```bash
docker compose -f docker-compose.dev.yml up -d
```

Sobe `db` (Postgres), `backend` (FrankenPHP), `scheduler` e `frontend`.

### 4. Dependências e banco (primeira vez)

```bash
# Backend
docker exec -it goodfood_backend composer install
docker exec -it goodfood_backend php artisan key:generate
docker exec -it goodfood_backend php artisan migrate --seed
docker exec -it goodfood_backend php artisan storage:link   # fotos de pets

# Frontend
docker exec -it goodfood_frontend npm install
```

### 5. Acessos

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api |
| PostgreSQL | `localhost:5432` (`root` / `rootpassword`) |

---

## Comandos do dia a dia

```bash
# Containers
docker compose -f docker-compose.dev.yml up -d          # iniciar
docker compose -f docker-compose.dev.yml stop           # parar (mantém volumes)
docker compose -f docker-compose.dev.yml down           # remover containers/rede (mantém volumes)
docker compose -f docker-compose.dev.yml down -v        # remover TUDO, inclusive o banco

# Backend
docker exec -it goodfood_backend php artisan optimize:clear
docker exec -it goodfood_backend php artisan make:migration nome_da_migration
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest    # testes (ver docs/testes.md)

# Frontend
docker exec -it goodfood_frontend npm run lint
docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm run build       # build de produção
```

---

## Troubleshooting

### Arquivos com dono `root` no host (`EACCES` em npm/git/build)

Os containers rodam como root e os bind mounts fazem `node_modules`, `.next` e arquivos gerados no backend ficarem com dono `root` no host. Sintomas: `npm install` falha com `EACCES`, `next build` não escreve em `.next/trace`, `git stash`/`checkout` falham com `unable to unlink`.

```bash
sudo chown -R $USER:$USER src/frontend/node_modules src/frontend/.next src/backend
```

Alternativas sem `chown`: rodar o comando dentro do container (`docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm run build`) ou, para mudanças só de dependências, `npm install --package-lock-only`.

### Testes do backend falham no host com `could not find driver`

O PHP do host pode não ter `pdo_sqlite`/`pdo_pgsql`. Rode a suíte no container:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps backend ./vendor/bin/pest
```

### Build do frontend falha em `/_global-error` (`useContext` null)

Bug conhecido do Next 16 quando `NODE_ENV` não está definido no build ([vercel/next.js#86178](https://github.com/vercel/next.js/issues/86178)). O script `npm run build` já define `NODE_ENV=production` — não remova. Se invocar `next build` diretamente, exporte a variável antes.

### Fotos de pets não aparecem (404 em `/storage/...`)

Falta o symlink de storage:

```bash
docker exec -it goodfood_backend php artisan storage:link
```

### Porta em uso (3000/8000/5432)

Outro processo local ocupa a porta. Pare-o ou ajuste o mapeamento em `docker-compose.dev.yml`.
