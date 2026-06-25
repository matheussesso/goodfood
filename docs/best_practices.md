# Boas Práticas e Qualidade de Código

A equipe do GoodFood System adota regras rigorosas para o desenvolvimento. A consistência no estilo de codificação, na arquitetura e na manutenção é a nossa prioridade.

**Regra Dourada Geral**: Todo código-fonte (identificadores, pastas, variáveis, classes, componentes, hooks, logs) deve ser redigido puramente em **Inglês**. Toda documentação (tais como arquivos README e PRs) deve ser elaborada em **Português**.

---

## Princípios Arquiteturais e Padrões (SOLID e Clean Code)
- Respeite o SRP (Single Responsibility Principle) e o DRY (Don't Repeat Yourself).
- Favoreça **Early Returns** (ou Guard Clauses) em detrimento a múltiplos `if/else` aninhados.
- Reutilize recursos já presentes na aplicação (componentes compartilhados, hooks customizados e services existentes) antes de decidir por criar novos equivalentes.

---

## Backend (Laravel PHP)

- **Tipagem Estrita**: É obrigatório declarar `declare(strict_types=1);` na primeira linha de todo script PHP que for gerado. Retornos de funções e parâmetros devem sempre ser tipados.
- **Sem Lógica em Controllers**: Controllers não processam lógicas de negócios e nem executam "queries raw". Eles existem apenas para extrair a requisição, validá-la (usando **FormRequest**), despachar o processamento para uma classe de **Service** ou **UseCase** e empacotar a resposta (usando **JsonResource**).
- **Documentação PHPDoc OBRIGATÓRIA**: Você deve documentar as suas classes, interfaces, métodos públicos e métodos protegidos muito complexos usando *docblocks*.
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
- **Performance de Banco**: Preze por otimizações. Use Eager Loading para evitar o clássico problema `N+1`. Evite queries inúteis dentro de laços de repetição.
- **Testes com Pest**: Nenhum código deve ser promovido à ramificação principal sem testes utilizando a biblioteca de testes **Pest**.

---

## Frontend (Next.js TypeScript)

- **App Router e RSC**: Utilize a nova arquitetura do Next.js (pasta `app/`) com foco em React Server Components. Diretivas de cliente como `"use client"` são permitidas estritamente quando você for interagir com APIs do navegador (window, useEffect) ou manipulação complexa de estados.
- **Documentação TSDoc OBRIGATÓRIA**: O Frontend não é isento de documentação em código. Documente as props de componentes, o valor de retorno de hooks customizados e lógicas de Services via TSDoc.
  ```tsx
  /**
   * Fetches the authenticated user's orders, paginated.
   *
   * @param page - The page number to fetch (1-indexed).
   * @param pageSize - The number of items per page. Defaults to 20.
   * @returns A paginated list of orders.
   */
  ```
- **Gerência de Estados de API**: Evite implementar lógicas soltas com `useEffect` ou `fetch` puramente do lado do cliente; aposte na biblioteca central **TanStack Query** (antigo React Query).
- **Tratamento de Exceções**: Abrace funcionalidades do React Server Components como a implementação de `error.tsx` e `loading.tsx` aliados com Suspense Boundaries para fornecer um carregamento gracioso aos usuários.

### Critério Absoluto de Responsividade
Em nosso Frontend, **nenhuma entrega de UI está completa se não for validada a responsividade**.
- Utilize sempre o conceito de desenvolvimento **Mobile-First**.
- O componente/visualização deve ser testado sob 3 quebras de dimensão essenciais: **Mobile (~375px), Tablet (~768px) e Desktop (~1280px+)**.
- Prefira unidades relativas (`%`, `rem`, `auto`) e utilitários responsivos do Tailwind (como `md:`, `lg:`). Evite larguras absolutas de `pixels` sempre que puder.
