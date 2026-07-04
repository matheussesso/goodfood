# Boas Práticas e Qualidade de Código

A equipe do GoodFood System adota regras rigorosas para o desenvolvimento. A consistência no estilo de codificação, na arquitetura e na manutenção é a nossa prioridade.

**Regra Dourada Geral**: Todo código-fonte (identificadores, pastas, variáveis, classes, componentes, hooks, logs, comentários e docblocks) deve ser redigido puramente em **Inglês**. Toda documentação (README, arquivos em `docs/`, descrições de PR) deve ser elaborada em **Português**.

---

## Princípios Arquiteturais e Padrões (SOLID e Clean Code)

- Respeite o SRP (Single Responsibility Principle) e o DRY (Don't Repeat Yourself).
- Favoreça **Early Returns** (Guard Clauses) em detrimento de múltiplos `if/else` aninhados.
- Reutilize recursos já presentes na aplicação (componentes compartilhados, hooks customizados, utils e services existentes) antes de criar novos equivalentes.
- Evite overengineering e abstrações prematuras.

---

## Backend (Laravel / PHP)

- **Tipagem estrita**: `declare(strict_types=1);` na primeira linha de todo arquivo PHP. Parâmetros e retornos sempre tipados.
- **Controllers finos**: sem lógica de negócio nem queries complexas. Fluxo: **FormRequest** (validação + autorização) → Service/Model → resposta via trait `ApiResponses` (contrato `{success, message, data, errors?}`). A adoção de **JsonResource** para serialização é o próximo passo do roadmap — ao criar endpoints novos com payloads não triviais, prefira já criar o Resource.
- **Autorização via Policies**: nunca escreva checks de ownership inline no controller — crie/estenda a Policy do model (`app/Policies/`).
- **Mass assignment**: campos sensíveis (ex.: `role`) ficam fora do fillable e são atribuídos explicitamente.
- **PHPDoc obrigatório** em classes, métodos públicos e protegidos complexos:
  ```php
  /**
   * Create a new order for the given customer.
   *
   * @param  CreateOrderDTO  $data
   * @return Order
   * @throws InsufficientStockException
   */
  public function create(CreateOrderDTO $data): Order
  ```
- **Performance de banco**: Eager Loading contra `N+1`; nada de queries dentro de laços.
- **Testes com Pest**: nenhuma feature/refactor/correção sobe sem testes ([testing.md](testing.md)). Cobrir caso feliz, validação e autorização.

---

## Frontend (Next.js / TypeScript)

- **App Router e RSC**: preferir Server Components; `"use client"` apenas quando houver interatividade, hooks ou APIs do browser. (Estado atual: maioria das telas ainda é client-side — ver [architecture.md](architecture.md); novas telas devem puxar na direção de RSC quando possível.)
- **TSDoc obrigatório** em componentes, hooks, services e utils:
  ```tsx
  /**
   * Fetches the authenticated user's orders, paginated.
   *
   * @param page - The page number to fetch (1-indexed).
   * @returns A paginated list of orders.
   */
  ```
- **Estado de servidor**: sempre **TanStack Query** — nada de `fetch`/`useEffect` soltos para dados da API. HTTP exclusivamente via `apiClient` (`lib/api-client.ts`); APIs externas ganham wrapper em `lib/` (ex.: `lib/viacep.ts`).
- **Formulários**: React Hook Form; a validação com **Zod + @hookform/resolvers** está no roadmap — novos formulários complexos devem adotá-la.
- **Tratamento de erros/carregamento**: `error.tsx` e `loading.tsx` por route group + Suspense.
- **i18n obrigatório**: nenhuma string de UI hardcoded — fluxo completo em [i18n.md](i18n.md).
- **Imagens**: sempre `next/image` (nunca `<img>`), com `remotePatterns` configurado.

### Critério absoluto de responsividade

**Nenhuma entrega de UI está completa sem validação de responsividade.**

- Desenvolvimento **Mobile-First**.
- Testar em 3 larguras: **Mobile (~375px), Tablet (~768px) e Desktop (~1280px+)**.
- Unidades relativas (`%`, `rem`, `auto`) e utilitários responsivos do Tailwind (`md:`, `lg:`) em vez de larguras fixas em `px`.
- Tabelas/grids largos precisam de scroll horizontal controlado ou layout alternativo em telas pequenas; alvos de toque ≥ 44×44px.
