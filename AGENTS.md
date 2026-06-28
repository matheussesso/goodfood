# Instruções para o Antigravity (Next.js + Laravel)

**System (Gemini/Antigravity)**: siga rigorosamente as regras da equipe para código, refactor e análise de problemas. Em caso de conflito entre estas instruções e o pedido pontual do usuário, sinalize o conflito antes de prosseguir.

---

## Linguagem

- **Código** (todos os identificadores, arquivos, schemas, DTOs, componentes, hooks, etc.): **apenas inglês**.
- **Documentação, chats, artefatos markdown, descrições de PR**: **português**.
- **Comentários inline e blocos de documentação (PHPDoc/TSDoc)**: **inglês**, mesmo que a conversa com o usuário seja em português.

---

## Padrões Gerais de Qualidade

- Aplicar **SOLID, Clean Code, SRP, DRY, KISS**.
- Preferir **early returns** ao invés de aninhamento profundo.
- **Reutilizar** código, componentes, hooks, utilities e padrões existentes do projeto antes de criar novos.
- Evitar overengineering e abstrações prematuras.
- Nunca entregar código incompleto ou pseudocódigo — sempre código **production-ready**, bem tipado, documentado e limpo.
- Toda feature, refactor ou correção de bug **deve incluir ou recomendar** testes apropriados.
- Nenhuma entrega de UI é considerada completa sem validação de **responsividade** (ver seção dedicada abaixo).

---

## Backend (Laravel API)

- Sempre `declare(strict_types=1);`.
- Tipagem estrita para parâmetros e retornos.
- **PHPDoc obrigatório** para classes/interfaces/traits, todos os métodos públicos e métodos protegidos complexos (descrição, `@param`, `@return`, `@throws`).
- **Controllers**: apenas validação (FormRequest) → chamar Service/UseCase com DTO → retornar JsonResource. Nunca colocar lógica de negócio ou queries nos controllers.
- Lógica de negócio → **Services / UseCases**.
- Models Eloquent → apenas relacionamentos simples e accessors/mutators. Lógica complexa → Repository ou Service.
- Usar padrão Repository para queries complexas e abstração de acesso a dados quando justificado.
- **Banco de dados**: otimizar queries (eager loading, indexes, evitar N+1), reduzir queries redundantes.
- **Segurança**: proteger contra SQLi, XSS, CSRF, Mass Assignment. Sempre validar e sanitizar entrada.
- **API**: RESTful quando apropriado, códigos HTTP corretos, formato de resposta consistente, tratamento centralizado de erros.
- **Contrato de Resposta JSON**:
  ```json
  {
    "success": boolean,
    "message": string,
    "data": mixed,
    "errors"?: object
  }
  ```
- Testes Backend: **Pest** para todo código novo ou refatorado.

### Exemplo de PHPDoc esperado

```php
/**
 * Create a new order for the given customer.
 *
 * @param  CreateOrderDTO  $data
 * @return Order
 * @throws InsufficientStockException
 */
public function create(CreateOrderDTO $data): Order
{
    // ...
}
```

---

## Frontend (Next.js 14+ App Router)

- Usar **Next.js App Router** (diretório `app/` preferencialmente).
- **TypeScript** com modo strict habilitado.
- Preferir **Server Components** por padrão. Usar **Client Components** (`"use client"`) apenas quando necessário (interatividade, hooks, APIs do browser).
- Aproveitar **Server Actions** para mutações quando apropriado.
- Usar padrões de **React Server Components** (streaming, suspense, `loading.tsx`, `error.tsx`).

### Estrutura de Pastas (respeitar a existente ou adotar este padrão)

```bash
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route Groups
│   ├── (dashboard)/
│   ├── api/                # Route Handlers (se necessário)
│   ├── globals.css
│   └── layout.tsx
├── components/             # Componentes UI reutilizáveis
├── features/               # Organização por feature
│   └── <feature-name>/
│       ├── components/
│       ├── hooks/
│       ├── api/            # ou queries (TanStack Query)
│       └── actions.ts      # Server Actions
├── lib/                    # Utilitários, config, conexões
├── hooks/                  # Custom hooks globais
├── services/               # Clientes HTTP e integrações externas
├── utils/                  # Funções puras auxiliares
├── types/                  # Tipos TypeScript globais
└── constants/
```

### Boas Práticas Frontend

- Componentes UI devem ser **presentational** (dumb) sempre que possível.
- Lógica de negócio e estado → Custom Hooks, Server Actions ou Services.
- Usar **TanStack Query (React Query)** para gerenciamento de estado do servidor.
- Formulários: **React Hook Form** + **Zod** para validação.
- Estilização: preferir **Tailwind CSS** + `clsx` / `tailwind-merge`.
- Evitar duplicação de lógica, componentes gigantes ou regras de negócio dentro do JSX.
- Usar **Suspense** e estados de loading adequadamente.
- Implementar **error boundaries** e tratamento de erros (`error.tsx`).
- Otimização de performance: `next/image`, `next/font`, dynamic imports, caching (`revalidatePath`, `revalidateTag`, `cache`).
- Acessibilidade: seguir padrões ARIA, HTML semântico.
- Lógica crítica (hooks, utils, services, componentes complexos) **deve ter testes unitários** (Vitest + React Testing Library + MSW quando necessário).

### Documentação obrigatória no Next.js (equivalente ao PHPDoc)

Assim como o backend exige PHPDoc, **todo código TypeScript/TSX deve ser documentado com TSDoc/JSDoc**. Isso é obrigatório, não opcional, e vale tanto para Server quanto Client Components.

**Onde é obrigatório:**
- Todo **componente** (função exportada que retorna JSX): descrição do propósito, `@param` para cada prop relevante (ou referência ao tipo de `Props`), `@returns` quando não for óbvio.
- Todo **custom hook**: descrição, parâmetros, valor de retorno e efeitos colaterais relevantes (ex.: chamadas de rede, subscriptions).
- Toda **função em `services/`, `utils/`, `lib/`**: descrição, `@param`, `@returns`, `@throws` quando aplicável.
- Toda **Server Action**: descrição, `@param`, `@returns`, e observação se há `revalidatePath`/`revalidateTag` envolvido.
- Tipos e interfaces complexos (DTOs, payloads de API): comentário descrevendo o propósito do tipo e de cada campo não trivial.
- Componentes simples e auto-evidentes (ex.: um `<Spinner />` sem props) podem ter um comentário de uma linha — não é necessário um bloco completo quando não há ambiguidade.

**Padrão de bloco (TSDoc):**

```tsx
/**
 * Displays a customer's order summary with status badge and total.
 *
 * @param order - The order data to render.
 * @param onRetry - Callback invoked when the user retries a failed order.
 * @returns A card element summarizing the order.
 */
interface OrderSummaryCardProps {
  order: Order;
  onRetry?: () => void;
}

export function OrderSummaryCard({ order, onRetry }: OrderSummaryCardProps) {
  // ...
}
```

```ts
/**
 * Fetches the authenticated user's orders, paginated.
 *
 * @param page - The page number to fetch (1-indexed).
 * @param pageSize - The number of items per page. Defaults to 20.
 * @returns A paginated list of orders.
 * @throws {ApiError} When the request fails or the user is unauthenticated.
 */
export async function getOrders(page: number, pageSize = 20): Promise<PaginatedOrders> {
  // ...
}
```

```ts
/**
 * Manages the state and submission flow of the checkout form.
 *
 * @param cartId - The id of the cart being checked out.
 * @returns Form state, validation errors, and a submit handler.
 */
export function useCheckoutForm(cartId: string) {
  // ...
}
```

- Comentários inline dentro do corpo das funções seguem a mesma regra geral: **em inglês**, explicando o "porquê" quando não for óbvio pelo "o quê".
- Se o projeto já tiver ESLint configurado, sugerir/habilitar regras como `eslint-plugin-jsdoc` para reforçar a obrigatoriedade dos blocos em PRs.

---

## Responsividade (ponto de atenção obrigatório em toda entrega de UI)

Responsividade não é um detalhe opcional nem uma etapa de "polimento" — é critério de aceite de qualquer componente, página ou alteração visual. Em **toda** tarefa de frontend, o agente deve:

1. **Pensar mobile-first**: construir/alterar estilos partindo do menor breakpoint e then adicionar overrides para telas maiores (`sm:`, `md:`, `lg:`, `xl:`, `2xl:` no Tailwind).
2. **Validar pelo menos 3 larguras de referência** antes de considerar a tarefa concluída:
   - Mobile (~375px)
   - Tablet (~768px)
   - Desktop (~1280px+)
3. **Evitar armadilhas comuns**:
   - Larguras/alturas fixas em `px` quando `%`, `rem`, `fr`, `auto` ou `min/max` resolveriam melhor.
   - Tabelas e grids que quebram em telas pequenas sem scroll horizontal controlado ou layout alternativo (cards/stack).
   - Textos, botões e áreas de toque pequenas demais em mobile (alvo mínimo recomendado: 44x44px).
   - Imagens sem `next/image` com `sizes`/`fill` adequados, causando layout shift ou overflow.
   - Modais, dropdowns e overlays que não se adaptam a viewports pequenas.
3. **Usar utilitários responsivos do Tailwind** de forma consistente (`flex`/`grid` com `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, etc.) em vez de media queries customizadas, salvo quando o projeto já tiver um padrão diferente estabelecido.
4. **Componentes reutilizáveis devem ser responsivos por padrão**, não responsivos "quando lembrarem de usar em outro lugar". Se um componente já existente não for responsivo, isso é um code smell a ser reportado, mesmo que não seja o foco da tarefa.
5. **Reportar explicitamente** no resumo da entrega quais breakpoints foram testados/considerados e se há alguma limitação conhecida.

---

## Internacionalização (i18n) — obrigatório em todo texto de UI

**Nenhum texto visível ao usuário pode ser hardcoded** diretamente no JSX/TSX. Toda string de interface deve obrigatoriamente:

1. **Ser registrada nos 3 arquivos de mensagens**: `messages/pt.json`, `messages/en.json`, `messages/es.json` — simultaneamente, antes de usar.
2. **Usar `useTranslations()`** do `next-intl` para consumir a chave no componente.
3. **Nomear chaves de forma semântica** (`Orders.confirm_order`, não `Orders.btn2`), agrupadas por namespace (`Auth`, `Navigation`, `Common`, `Catalog`, `Recipes`, `Pets`, `Orders`, `Dashboard`, `admin`).
4. **Interpolações dinâmicas** (`{name}`, `{count}`) devem ser incluídas na chave, não concatenadas na string.

### Regras de escopo

- **Namespace `Common`**: rótulos universais (`save`, `cancel`, `edit`, `delete`, `loading`, `view`, `back`, `status`…).
- **Namespaces de feature** (`Orders`, `Pets`, `Recipes`…): texto específico da feature.
- **Nunca duplicar** uma chave que já existe em `Common` — reutilizar.

### Fluxo obrigatório ao adicionar qualquer texto novo

```
1. Definir a chave em pt.json (português)
2. Adicionar a tradução equivalente em en.json (inglês)
3. Adicionar a tradução equivalente em es.json (espanhol)
4. Consumir com useTranslations() no componente
```

### Exceções permitidas

- Valores monetários formatados (`R$ 0,00`) — formatação de locale, não i18n.
- Nomes próprios / ids retornados pela API (ex.: nome do pet, nome do cliente).
- Placeholders de desenvolvimento (nunca chegar em produção).

### Como o agente deve agir

- **Antes de escrever qualquer string de UI**: verificar se já existe chave equivalente nos arquivos de mensagens.
- **Ao criar página ou componente novo**: listar todos os textos necessários, criar as chaves nos 3 arquivos, só então escrever o JSX.
- **Ao corrigir texto existente**: atualizar nos 3 arquivos simultaneamente.
- **Se detectar string hardcoded em código existente**: reportar como code smell e corrigir no mesmo PR.

---

## Regras do Agente

- **Antes de alterar qualquer coisa**: entender o contexto, arquitetura atual, padrões existentes e impacto potencial (performance, bundle size, SEO, limite server/client, responsividade).
- Respeitar e seguir as convenções e estrutura de pastas do projeto.
- Priorizar sempre: **qualidade, segurança, performance, escalabilidade, manutenibilidade, responsividade e DX (Developer Experience)**.
- Se encontrar bugs, code smells, problemas arquiteturais, de segurança ou de responsividade → **reportar claramente** antes de implementar mudanças.
- Ao sugerir refactors, explicar benefícios e possíveis trade-offs.
- Preferir **melhorias incrementais** ao invés de grandes rewrites, exceto quando claramente justificável.
- Nenhum componente ou página de UI deve ser entregue como "concluído" sem confirmação de que foi pensado/testado para diferentes tamanhos de tela.