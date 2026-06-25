# Configuração e Execução do Projeto

Este guia aborda os pré-requisitos e os passos necessários para executar o ambiente de desenvolvimento local do GoodFood System utilizando o **Docker Compose**.

## Pré-requisitos

Certifique-se de que sua máquina possui as seguintes ferramentas instaladas:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) (ou Docker Desktop para Windows/Mac)
- [Docker Compose](https://docs.docker.com/compose/install/)

*(Opcional: Caso você queira rodar scripts nativamente no host para IDEs, considere instalar PHP 8.4, Composer e Node.js 20+)*.

---

## Inicializando o Ambiente (Docker Compose)

Como o projeto está fortemente orquestrado em contêineres, todo o fluxo principal se dá pelo `docker-compose`.

### 1. Clonando o Repositório
```bash
git clone <url-do-repositorio>
cd goodfood-system-new
```

### 2. Configurações Iniciais (.env)
O backend exige variáveis de ambiente (especialmente para a conexão com o banco). Se o arquivo `/src/backend/.env` não existir, você precisa copiá-lo:
```bash
cp src/backend/.env.example src/backend/.env
```
Verifique se os dados do banco de dados no seu `.env` do backend estão iguais aos do `docker-compose.yml`:
```env
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=goodfood
DB_USERNAME=root
DB_PASSWORD=rootpassword
```

### 3. Subindo os Contêineres
Na raiz do projeto, execute:
```bash
docker compose up -d
```
O Docker irá:
1. Realizar o *build* customizado da imagem PHP.
2. Realizar o *build* da imagem Node.
3. Subir o Postgres, Nginx, Backend e Frontend.

### 4. Instalando Dependências

Após subirmos os containers pela primeira vez, as pastas `vendor` (Backend) e `node_modules` (Frontend) podem estar vazias. Execute os comandos abaixo dentro de seus respectivos containers:

**Para o Backend (Laravel):**
```bash
docker exec -it goodfood_backend composer install
docker exec -it goodfood_backend php artisan key:generate
docker exec -it goodfood_backend php artisan migrate --seed
```

**Para o Frontend (Next.js):**
```bash
docker exec -it goodfood_frontend npm install
```

---

## Acessando a Aplicação

Se todos os processos foram iniciados com sucesso, você terá acesso aos seguintes endereços na sua máquina local:

- 🌐 **Frontend (UI do Usuário):** [http://localhost:3000](http://localhost:3000)
- 🚀 **Backend (API Base URL):** [http://localhost:8000](http://localhost:8000)
- 🗄️ **Banco de Dados (Postgres):** Servidor em `localhost` na porta `5432`.

### Encerrando a Execução

Para parar os contêineres e manter os dados salvos (volume do DB persistido):
```bash
docker compose stop
```

Para remover e desligar os contêineres, a rede criada e (opcionalmente) os volumes:
```bash
# Apaga os contêineres
docker compose down

# Apaga os contêineres e reseta o volume do banco de dados!
docker compose down -v
```
