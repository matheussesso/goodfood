# Good Food System

## Visão Geral

Bem-vindo ao **Good Food System**, uma aplicação moderna estruturada com backend em Laravel, frontend em Next.js e banco de dados PostgreSQL. O ambiente de desenvolvimento é totalmente conteinerizado utilizando Docker Compose, garantindo um setup rápido, previsível e isolado.

## Objetivos do Projeto

### Para Clientes (Tutores)
- Cadastrar e gerenciar pets.
- Visualizar receitas baseadas nas necessidades de seus pets.
- Acompanhar pedidos e histórico de compras.

### Para a Empresa
- Cadastrar e gerenciar receitas para os pets.
- Visualizar todos os pets e clientes cadastrados.
- Gerenciar pedidos e visualizar histórico completo.
- Ter controle total sobre o fluxo de produção e entregas.

## Stack Tecnológica

- **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript
- **Backend**: Laravel (API REST), PHP 8.4
- **Banco de Dados**: PostgreSQL
- **Infraestrutura**: Docker & Docker Compose

## Documentação Relacionada

Criamos guias separados para facilitar a integração e alinhar a qualidade e arquitetura da equipe de desenvolvimento:

- **[Arquitetura do Sistema](docs/architecture.md)**
- **[Setup e Execução Local](docs/setup.md)**
- **[Boas Práticas e Qualidade](docs/best_practices.md)**
- **[Git Flow](docs/git_flow.md)**

## Estrutura do Projeto

```text
├── src/
│   ├── backend/        # API REST desenvolvida em Laravel
│   │   ├── app/        # Controladores, Models, Services, etc.
│   │   ├── config/     # Configurações do framework
│   │   ├── database/   # Migrations e Seeders
│   │   ├── routes/     # Definição das rotas (api.php)
│   │   └── tests/      # Testes unitários e de integração (Pest)
│   └── frontend/       # Aplicação web desenvolvida em Next.js
│       ├── app/        # App Router (páginas, layouts, api routes)
│       ├── components/ # Componentes UI reutilizáveis
│       ├── hooks/      # Hooks customizados
│       ├── i18n/       # Configuração de internacionalização
│       ├── lib/        # Utilitários e configurações de bibliotecas
│       └── messages/   # Arquivos de tradução (pt, en, es)
├── docs/               # Documentação detalhada do projeto
└── docker/             # Configurações e Dockerfiles (nginx, php, etc)
```

## Módulos & Features do Sistema

1. **Autenticação e Autorização**
   - Sistema seguro de login para clientes e administradores.
   - Controle de acesso baseado em roles (RBAC).

2. **Cadastro e Gestão de Pets**
   - Criação de perfis detalhados para os pets.
   - Histórico de necessidades e restrições alimentares.

3. **Catálogo e Gestão de Receitas**
   - Listagem de receitas disponíveis.
   - Associação de receitas às necessidades específicas dos pets.

4. **Gestão de Pedidos e Fluxo de Produção**
   - Carrinho de compras e checkout.
   - Acompanhamento do status do pedido desde a preparação até a entrega.

5. **Internacionalização (i18n)**
   - Suporte multi-idioma (Português, Inglês e Espanhol) em toda a interface visual.

## Instalação e Configuração (Docker)

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos Básicos para Execução

1. **Clonar o repositório:**
```bash
git clone <url-do-repositorio>
cd goodfood-system-new
```

2. **Configurar variáveis de ambiente do Backend:**
```bash
cp src/backend/.env.example src/backend/.env
```
*(Verifique se os dados do banco de dados estão iguais aos do `docker-compose.yml`)*

3. **Subir os contêineres:**
```bash
docker compose up -d
```

4. **Instalar dependências e preparar o banco (Backend):**
```bash
docker exec -it goodfood_backend composer install
docker exec -it goodfood_backend php artisan key:generate
docker exec -it goodfood_backend php artisan migrate --seed
```

5. **Instalar dependências (Frontend):**
```bash
docker exec -it goodfood_frontend npm install
```

🌐 Acesse o **Frontend** em: [http://localhost:3000](http://localhost:3000)
🚀 Acesse o **Backend API** em: [http://localhost:8000](http://localhost:8000)

*(Para mais detalhes, consulte o guia completo de [Setup](docs/setup.md))*

## Comandos Úteis do Dia a Dia

**Gerenciamento dos Contêineres:**
```bash
# Iniciar a aplicação em background
docker compose up -d

# Parar os contêineres sem remover volumes
docker compose stop

# Remover contêineres e redes (mantém volumes)
docker compose down

# Remover contêineres e zerar o banco de dados
docker compose down -v
```

**Comandos no Backend (Laravel):**
```bash
# Limpar cache geral da aplicação
docker exec -it goodfood_backend php artisan optimize:clear

# Rodar os testes (Pest)
docker exec -it goodfood_backend php artisan test

# Criar uma nova migration
docker exec -it goodfood_backend php artisan make:migration nome_da_migration
```

**Comandos no Frontend (Next.js):**
```bash
# Rodar linter
docker exec -it goodfood_frontend npm run lint
```
