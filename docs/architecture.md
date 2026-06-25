# Arquitetura do Sistema GoodFood

A arquitetura do GoodFood System é desenhada para promover separação de responsabilidades (Frontend vs Backend API), escalabilidade e facilidade de desenvolvimento, através de conteinerização com Docker.

## Visão Geral
O sistema é constituído pelos seguintes componentes:

1. **Frontend**: Aplicação Web.
2. **Backend**: API RESTful.
3. **Database**: Banco de dados relacional.
4. **Infraestrutura**: Configuração unificada e isolada usando Docker Compose.

---

## 1. Frontend (Next.js)

Localizado em `/src/frontend`, o frontend é uma aplicação **Next.js 14+ (App Router)**.

### Características e Tecnologias:
- **Server Components**: Renderização no servidor por padrão para melhor SEO e velocidade. Client components (`"use client"`) são usados apenas em componentes interativos.
- **Server Actions**: Usadas para gerenciar mutações de dados de forma nativa pelo Next.js sem depender estritamente de endpoints tradicionais para todas as interações da UI.
- **TypeScript**: Habilitado em modo *strict* para maior robustez do código.
- **Tailwind CSS**: Estilização baseada em utilitários, otimizada com bibliotecas auxiliares como `clsx` e `tailwind-merge`.
- **TanStack Query (React Query)**: Responsável por gerenciar o estado da API, gerenciar cache e lidar com estados de loading e erros durante a sincronização de dados com o backend.
- **Gerenciamento de Formulários**: Utilizando React Hook Form + Zod.

---

## 2. Backend API (Laravel)

Localizado em `/src/backend`, o backend opera como uma API JSON para alimentar o Frontend. Desenvolvido em **PHP 8.4** usando o framework **Laravel 11+**.

### Características e Arquitetura Interna:
- **Camada de Transporte (Controllers)**: Recebe a requisição, invoca o `FormRequest` para validação e delega a lógica para os `Services`. Retorna `JsonResource` para padronizar as respostas da API.
- **Lógica de Negócio (Services / Use Cases)**: Todas as regras de negócios da aplicação vivem aqui, independentes de infraestrutura ou HTTP.
- **Modelos (Eloquent)**: Os modelos devem conter apenas relacionamentos, mutators e accessors simples.
- **Acesso a Dados**: Dependendo da complexidade das queries, o padrão Repository pode ser adotado para evitar lógicas massivas de consulta vazando para os controllers.
- **Padrão de Resposta JSON**:
  Todas as chamadas à API seguem um formato de contrato rígido:
  ```json
  {
    "success": boolean,
    "message": string,
    "data": mixed,
    "errors": object
  }
  ```

---

## 3. Banco de Dados

- **PostgreSQL 16**: O sistema utiliza um banco de dados relacional (PostgreSQL) para gerenciar todas as entidades, estruturado de maneira conteinerizada e exposta na porta 5432 apenas para o escopo local e de desenvolvimento.

---

## 4. Infraestrutura Docker

O projeto usa **Docker Compose** e as definições ficam em `/docker` e `/docker-compose.yml`.

- **Serviço `backend`**: Baseado na imagem oficial `php:8.4-fpm`, com as extensões (`pdo_pgsql`, `mbstring`, `gd`, etc.) pré-compiladas.
- **Serviço `nginx`**: Atua como o servidor web e proxy reverso para processar os arquivos `.php` mapeados para o container `backend` pela porta 9000.
- **Serviço `frontend`**: Roda a imagem `node:20-alpine` inicializando diretamente os scripts do `package.json` (`npm run dev`).
- **Serviço `db`**: Container com PostgreSQL persistido num volume local do Docker (`dbdata`).
