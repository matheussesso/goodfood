# Funcionalidades do Sistema

Documentação funcional das telas e fluxos do GoodFood System — o que cada funcionalidade faz, quem pode usar, e as regras de negócio por trás dela. Para o modelo de dados por trás de cada entidade, ver [dominio.md](dominio.md); para o contrato REST, ver [api.md](api.md).

Dois perfis de usuário: **cliente** (tutor do pet) e **admin** (equipe GoodFood). A maioria das funcionalidades tem uma versão para cada um.

---

## Landing page (site institucional)

Página pública em `/` que apresenta a Good Food Pet e leva o visitante ao sistema. Conteúdo **somente em português** (ver [internacionalizacao.md](internacionalizacao.md)).

- **Seções (enxutas, foco em funcionalidades e facilidade de pedir):** hero com etiqueta interativa e CTAs (Criar conta / Entrar / link do WhatsApp), **Como funciona** (os 4 passos do sistema: pet → receita → vínculo → pedido), **Funcionalidades** (perfil do pet, avisos, receitas com valor ao vivo e pedidos acompanhados — com miniaturas ilustrativas em código, dados fictícios e sem preços), **Peça do seu jeito** (avulso × assinatura + caldo de ossos via WhatsApp), **Sobre** (institucional: quem somos, valores e o processo de produção em 5 etapas), FAQ com 6 perguntas e CTA final.
- **Sessão:** visitante logado vê "Ir para meu painel" no lugar de "Criar conta/Entrar".
- **Contato:** botão flutuante e links para o WhatsApp (61) 98142-5385, Instagram @goodfood.pet e Linktree, configuráveis por `NEXT_PUBLIC_*` (ver [configuracao.md](configuracao.md)).
- **Pedidos hoje:** confirmados por WhatsApp; a landing já convida a criar conta e montar receitas, e o FAQ informa que o processo todo passará para o sistema (com integração ao WhatsApp). Entrega: Brasília-DF.
- **SEO:** metadata e Open Graph (`public/og-image.png`), JSON-LD (`Organization` e `FAQPage`), `sitemap.xml`, `robots.txt` (áreas autenticadas bloqueadas), `/en` e `/es` com `noindex`.
- **Acessibilidade/desempenho:** Server Components, FAQ com `<details>`, skip link, foco visível, alvos ≥ 44px, `prefers-reduced-motion` respeitado, sem libs novas.
- **Visual:** vermelho da marca em blocos grandes sobre branco e preto, sem texturas nem estampas; títulos em Bricolage Grotesque e texto em Figtree. O destaque é uma **etiqueta de receita interativa** no hero (o visitante liga/desliga ingredientes e vê o total em gramas, com dados fictícios e sem preços); as funcionalidades aparecem em abas com telas ilustrativas.
- **Código:** `app/[locale]/page.tsx`, `features/landing/` (componentes por seção, `content.ts`, `json-ld.ts`), `lib/company.ts`, paleta `gf-*` em `globals.css`.

---

## Conta do cliente: dashboard, guia e primeiros passos

Pensado para quem acabou de criar a conta e ainda não tem pets nem receitas.

- **Cadastro enxuto**: nome, e-mail, telefone e senha. O endereço é pedido só quando necessário (perfil → seção *Endereço*, ou no primeiro pedido, com a opção "Salvar este endereço na minha conta").
- **Jornada de 4 passos**: cadastrar o pet → criar a receita → vincular a receita ao pet → fazer o pedido. O backend calcula o `next_step`; o frontend mostra o passo atual com um único botão.
- **Início** (`/dashboard`, URL pública `/inicio` em português): conta nova vê só o guia "Primeiros passos" (dispensável — depois fica um banner "Continuar configuração"); conta ativa vê alertas (fatura pendente, vacina vencida, perfil de pet incompleto, endereço ausente), pedido atual com timeline, assinatura ativa, pets com ação rápida (*Pedir* ou *Criar receita para {pet}*), pedidos recentes e ações rápidas.
- **Guia** (`/guide` → `/guia`): explica cada passo (o quê, por quê, dica) e traz um FAQ.
- **Estados vazios guiados**: `/pets`, `/recipes` e `/orders` mostram onde o cliente está na jornada e o botão do passo atual.
- **Atalhos entre passos**: ao salvar um pet, a tela de sucesso oferece "Criar receita para {pet}"; ao salvar uma receita, "Fazer um pedido" (se vinculada) ou "Vincular a um pet"; no pedido/assinatura sem receitas há link direto para criar uma.
- **Templates em 1 clique**: na criação de receita, "Usar direto" clona o template já vinculado aos pets escolhidos (`POST /recipes/{id}/clone`); "Personalizar" abre o formulário preenchido.
- **Minha conta**: medidor de completude (telefone, endereço, primeiro pet) e seções navegáveis por `?section=` (`personal`, `address`, `security`, `preferences`).

---

## Pets

Cadastro dos pets do cliente — base para receitas, pedidos e assinaturas (tudo é vinculado a um pet).

- **Cliente**: `/pets` (listagem em cards ou tabela), `/pets/new` e `/pets/[id]/edit` (páginas dedicadas, não modal), `/pets/[id]` (perfil completo).
- **Campos**: nome, espécie (`dog`/`cat`), sexo, raça, peso, idade, castrado, foto (upload), microchip, veterinário responsável (nome/telefone), restrições/alergias/necessidades especiais.
- **Saúde**: vacinas (nome, data de aplicação, próxima dose) e documentos anexados (exame, receita, laudo, outro — PDF/imagem). Os documentos ficam em disco privado e só abrem para o dono do pet ou admin, via rota autenticada.
- Sexo, castrado, raça, peso e idade são **obrigatórios** no formulário do cliente (validação só no frontend — o backend aceita esses campos como opcionais para não quebrar o modal de admin, que ainda não tem todos esses campos).
- **Admin**: gerencia pets de qualquer cliente via modal dentro do detalhe do cliente (`/admin/customers/[id]`) — tela separada da do cliente, propositalmente mais simples.

## Catálogo (admin)

Base de dados que alimenta o cálculo de custo de toda receita do sistema. Aba única em `/admin/catalog` com três seções:

- **Ingredientes**: nome, categoria, unidade (kg/g/l/ml/unidade), custo por unidade, taxa de perda, multiplicador de dificuldade, estoque, ativo/inativo. CRUD completo, só admin.
- **Receitas modelo** (`is_template = true`): receitas prontas visíveis a todos os clientes, para usar como base ou vincular direto a um pet.
- **Configurações de precificação**: parâmetros globais da fórmula de custo (produção, logística, margem de reserva, marketing, fiscal, cobrança, agendamento, dificuldade) — usados por toda receita do sistema, sempre.

> Mudar o custo de um ingrediente aqui **reflete na hora** em toda receita, pedido em criação e assinatura que usa esse ingrediente — nada fica desatualizado esperando alguém resalvar uma receita (ver "Preço sempre atual" abaixo).

## Receitas

Composição de ingredientes que define o que um pet come — pode ser criada pelo próprio cliente (vinculada aos seus pets) ou vir de um template do catálogo.

- **Cliente**: `/recipes` (listagem com composição em accordion), `/recipes/new`, `/recipes/[id]/edit`, `/recipes/[id]` (detalhe).
- **Campos**: nome, descrição, espécie (`dog`/`cat`/`all`), duração em dias, porções por dia, instruções, ingredientes (com quantidade/unidade cada).
- **Custo**: nunca é um valor fixo digitado — é sempre calculado a partir dos ingredientes selecionados, da duração e das porções diárias, usando os parâmetros do catálogo. Ver "Preço sempre atual" abaixo.
- **Peso mínimo**: receita de cliente precisa de ao menos 1,5 kg de ingredientes no total (peso diário × duração); a tela avisa e o backend também valida.
- **Visibilidade**: um cliente vê templates + suas próprias receitas + receitas vinculadas aos seus pets. Não pode editar template (só admin).

### Preço sempre atual (custo ao vivo)

O sistema **nunca confia em um preço de receita guardado no banco para exibir ou cobrar** — toda vez que uma receita aparece (catálogo, pedido, assinatura), o custo é recalculado na hora a partir do preço *atual* dos ingredientes. Isso significa:

- Editar o `cost_per_unit` de um ingrediente no catálogo já muda o preço mostrado em qualquer receita que o usa, na próxima vez que ela for carregada — sem precisar reabrir/resalvar a receita.
- Um pedido cobra o preço de hoje, não um preço antigo. Uma assinatura mostra o custo total do plano com base no preço de hoje.
- Existe uma coluna cacheada (`base_cost`/`ingredient_cost`) só para uso interno (ex. ordenação); ela nunca é a fonte usada para exibir ou cobrar.

## Pedidos

Seção única que reúne os dois jeitos de comprar receitas para os pets: **pedido avulso** (compra única) e **assinatura recorrente** (plano semanal). Cliente e admin enxergam ambos os tipos juntos na mesma listagem — não existe mais uma área separada de "Assinaturas".

- **Cliente**: `/orders` — listagem unificada (cards ou lista), com seções "Em andamento"/"Histórico" e filtro por tipo (Todos/Avulsos/Assinaturas). Cada item mostra um selo indicando o tipo.
- **Novo pedido**: `/orders/new` abre uma tela de escolha — **Pedido avulso** ou **Assinatura recorrente** — antes de entrar no formulário correspondente.
- **Admin**: `/admin/orders` — mesma listagem unificada (todos os clientes), com filtro por tipo e, quando um tipo é selecionado, filtro pelo status daquele tipo.

### Pedido avulso

Compra avulsa de uma ou mais receitas para um ou mais pets.

- Formulário em `/orders/new` (após escolher "Pedido avulso"): pet(s) → receita(s) → endereço de entrega opcional.
- Cada pedido pode ter **vários itens**, cada item é uma receita + pet (a mesma receita pode aparecer em itens diferentes, para pets diferentes).
- **Preço**: calculado ao vivo no momento da criação — ver "Preço sempre atual" acima. Nunca lido de um valor cacheado.
- **Fatura**: criada automaticamente junto com o pedido (vencimento em 3 dias).
- **Status** (só admin altera): `pending_payment` → `pending` → `in_production` → `ready` → `out_for_delivery` → `delivered` (ou `cancelled` a qualquer momento).
- **Detalhe**: `/orders/[id]` (cliente) e `/admin/orders/[id]` (admin, com troca de status).

### Assinatura recorrente

Plano alimentar semanal de duração fixa para um pet — pensado para quem já sabe o que vai alimentar nas próximas semanas e quer deixar isso salvo, sem repetir a escolha toda vez.

- Criação em `/orders/subscriptions/new` (após escolher "Assinatura recorrente" em `/orders/new`); detalhe em `/orders/subscriptions/[id]`; edição (só do dono) em `/orders/subscriptions/[id]/edit`.
- **Duração do plano**: começa em 14 dias e sobe de 7 em 7 (14, 21, 28, 35...) — sempre um múltiplo de 7, escolhido por um stepper (+/−).
- **Uma receita por semana**: a duração é dividida em blocos de 7 dias (`total_cycles = duration_days / 7`); o cliente escolhe **exatamente uma receita para cada semana** — não dá pra deixar semana em branco nem sobrar receita sem semana. O backend rejeita (`422`) se a contagem não bater.
- **Custo do plano**: soma o custo de cada receita escolhida, mas **sempre cobrando 7 dias por semana** — mesmo que a receita esteja cadastrada no catálogo com outra duração nativa (ex. uma receita de "14 dias" entra no plano custando o equivalente a 1 semana, não 2). Combinado com o preço sempre atual dos ingredientes, o valor mostrado é sempre o real.
- **Progresso**: a tela mostra "Semana X de Y" com base na data de início — só para acompanhamento, não afeta nada.
- **Ações**: pausar, retomar, cancelar (cancelamento é lógico — o histórico fica preservado). Disponíveis tanto na listagem quanto no detalhe, para o dono e para o admin.
- **Edição** (duração + receitas): só o dono do plano vê o botão de editar — a página de detalhe (`/orders/subscriptions/[id]`) esconde essa ação quando quem está vendo não é o dono, mesmo que seja admin (admin altera status, mas não o conteúdo do plano de outro cliente).
- **Sem relação com Pedidos avulsos**: uma assinatura **nunca gera um pedido sozinha**. Não existe job/scheduler rodando em segundo plano criando pedidos a partir de assinaturas — é puramente um plano salvo que o cliente usa como referência, agora listado lado a lado com os avulsos por conveniência de navegação. (Isso já foi diferente no passado; ver [dominio.md](dominio.md#subscription) se encontrar menção a "rotação"/"próxima entrega" em código ou anotações antigas — está desatualizado.)

> A unificação é só de navegação/listagem no frontend — no backend, `Order` e `Subscription` continuam sendo entidades e endpoints independentes (ver [dominio.md](dominio.md) e [api.md](api.md)); não há FK entre eles.

## Administração

Área exclusiva para `role = admin` (`AdminMiddleware` nas rotas de backend, guard de rota no frontend):

- **Clientes** (`/admin/customers`): listagem com busca, ordenação, criação de cliente; detalhe (`/admin/customers/[id]`) mostra pets, pedidos, receitas — e permite gerenciar pets do cliente via modal.
- **Pedidos** (`/admin/orders`): listagem unificada de pedidos avulsos e assinaturas de todos os clientes, com filtro por tipo e status, troca de status de pedido e pausar/retomar/cancelar assinatura.
- **Catálogo** (`/admin/catalog`): ingredientes, receitas modelo, configurações de precificação (ver acima).

## Internacionalização e responsividade

Toda tela é traduzida (pt/en/es, chaves em `messages/`) e responsiva (mobile/tablet/desktop) — ver [internacionalizacao.md](internacionalizacao.md) para o fluxo de tradução e o `AGENTS.md` na raiz do projeto para os critérios de responsividade.
