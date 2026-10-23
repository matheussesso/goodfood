# Funcionalidades do Sistema

Documentação funcional das telas e fluxos do GoodFood System — o que cada funcionalidade faz, quem pode usar, e as regras de negócio por trás dela. Para o modelo de dados por trás de cada entidade, ver [dominio.md](dominio.md); para o contrato REST, ver [api.md](api.md).

Dois perfis de usuário: **cliente** (tutor do pet) e **admin** (equipe GoodFood). A maioria das funcionalidades tem uma versão para cada um.

---

## Landing page (site institucional)

Página pública em `/` que apresenta a Good Food Pet e leva o visitante ao sistema. Conteúdo **somente em português** (ver [internacionalizacao.md](internacionalizacao.md)).

- **Seções (enxutas, foco em funcionalidades e facilidade de pedir):** hero com etiqueta interativa e CTAs (Criar conta / Entrar / link do WhatsApp), **Como funciona** (os 3 passos do sistema: pet → receita → plano/pedido), **Funcionalidades** (perfil do pet, avisos, receitas com valor ao vivo e pedidos acompanhados — com miniaturas ilustrativas em código, dados fictícios e sem preços), **Peça do seu jeito** (receita única × plano alimentar com várias receitas em sequência + caldo de ossos via WhatsApp), **Sobre** (institucional: quem somos, valores e o processo de produção em 5 etapas), FAQ com 6 perguntas e CTA final.
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
- **Jornada de 3 passos**: cadastrar o pet (já com a primeira receita) → receita do pet → montar o plano e fazer o pedido. Como todo pet novo nasce com receita, o passo da receita só fica pendente para pets antigos sem receita (o botão leva a `/pets/[id]/recipes/new` desse pet). O backend calcula o `next_step`; o frontend mostra o passo atual com um único botão.
- **Início** (`/dashboard`, URL pública `/inicio` em português): conta nova vê só o guia "Primeiros passos" (dispensável — depois fica um banner "Continuar configuração"); conta ativa vê alertas (fatura pendente, vacina vencida, perfil de pet incompleto, endereço ausente), pedido atual com timeline, pets com ação rápida (*Pedir* ou *Criar receita para {pet}*), pedidos recentes e ações rápidas.
- **Guia** (`/guide` → `/guia`): explica cada passo (o quê, por quê, dica) e traz um FAQ.
- **Estados vazios guiados**: `/pets`, `/orders` e `/orders/new` mostram onde o cliente está na jornada e o botão do passo atual.
- **Atalhos entre passos**: ao salvar um pet (com a receita), a tela de sucesso oferece "Fazer pedido para {pet}" e "Completar perfil"; no pedido, um pet sem receita tem link direto "Criar receita para {pet}".
- **Templates em 1 clique**: toda criação de receita começa pela escolha do ponto de partida (`RecipeStartStep`): "Usar como está" copia o template para o pet (no cadastro do pet via `recipe.template_id`; numa receita nova do pet via `POST /recipes/{id}/clone`), "Personalizar" abre o formulário preenchido e "Criar do zero" começa em branco.
- **Minha conta**: medidor de completude (telefone, endereço, primeiro pet) e seções navegáveis por `?section=` (`personal`, `address`, `security`, `preferences`).

---

## Pets

Cadastro dos pets do cliente — base para receitas e pedidos (tudo pertence a um pet).

- **Cliente**: `/pets` (listagem em cards ou tabela), `/pets/new` e `/pets/[id]/edit` (páginas dedicadas, não modal), `/pets/[id]` (perfil completo, com abas de visão geral, receitas e pedidos — `?tab=recipes`/`?tab=orders`).
- **Cadastro em 2 passos** (`/pets/new`): dados do pet → primeira receita (template como está, template personalizado ou do zero). Pet e receita são salvos juntos, numa única chamada (`POST /pets`) — não existe pet novo sem receita.
- **Campos**: nome, espécie (`dog`/`cat`), sexo, raça, peso, idade, castrado, foto (upload), microchip, veterinário responsável (nome/telefone), restrições/alergias/necessidades especiais.
- **Saúde**: vacinas (nome, data de aplicação, próxima dose) e documentos anexados (exame, receita, laudo, outro — PDF/imagem). Os documentos ficam em disco privado e só abrem para o dono do pet ou admin, via rota autenticada.
- Sexo, castrado, raça, peso e idade são **obrigatórios** no formulário do cliente (validação só no frontend — o backend aceita esses campos como opcionais para não quebrar o modal de admin, que ainda não tem todos esses campos).
- **Admin**: gerencia pets de qualquer cliente via modal dentro do detalhe do cliente (`/admin/customers/[id]`) — tela separada da do cliente, propositalmente mais simples; ao criar um pet, o admin escolhe o template que será a primeira receita. O perfil do pet para o admin fica em `/admin/customers/[id]/pets/[petId]`.

## Catálogo (admin)

Base de dados que alimenta o cálculo de custo de toda receita do sistema. Aba única em `/admin/catalog` com três seções:

- **Ingredientes**: nome, categoria, unidade (kg/g/l/ml/unidade), custo por unidade, taxa de perda, multiplicador de dificuldade, estoque, ativo/inativo. CRUD completo, só admin.
- **Receitas modelo** (`is_template = true`): receitas prontas visíveis a todos os clientes, sem pet — ponto de partida da receita de um pet (usadas como estão ou personalizadas; o pet sempre recebe uma cópia própria).
- **Configurações de precificação**: parâmetros globais da fórmula de custo (produção, logística, margem de reserva, marketing, fiscal, cobrança, agendamento, dificuldade) — usados por toda receita do sistema, sempre.

> Mudar o custo de um ingrediente aqui **reflete na hora** em toda receita e pedido em criação que usa esse ingrediente — nada fica desatualizado esperando alguém resalvar uma receita (ver "Preço sempre atual" abaixo).

## Receitas

Composição de ingredientes que define o que um pet come. **Toda receita de cliente pertence a um único pet** e vive dentro dele — não existe mais uma seção de receitas separada no menu. Pode ser montada do zero ou partir de um template do catálogo.

- **Cliente**: aba *Receitas* do perfil do pet (`/pets/[id]?tab=recipes`), criação em `/pets/[id]/recipes/new` e edição em `/pets/[id]/recipes/[recipeId]/edit` (em português, `/pets/12/receitas/criar` e `/pets/12/receitas/7/editar`). Um pet pode ter várias receitas.
- **Exclusão**: bloqueada para a única receita do pet (todo pet precisa de ao menos uma) e para receitas que já fazem parte de algum pedido.
- **Campos**: nome, descrição, espécie (`dog`/`cat`/`all`), duração em dias, porções por dia, instruções, ingredientes (com quantidade/unidade cada).
- **Custo**: nunca é um valor fixo digitado — é sempre calculado a partir dos ingredientes selecionados, da duração e das porções diárias, usando os parâmetros do catálogo. Ver "Preço sempre atual" abaixo.
- **Peso mínimo**: receita de cliente precisa de ao menos 1,5 kg de ingredientes no total (peso diário × duração); a tela avisa e o backend também valida.
- **Visibilidade**: um cliente vê templates + as receitas dos seus pets. Não pode editar template (só admin).

### Preço sempre atual (custo ao vivo)

O sistema **nunca confia em um preço de receita guardado no banco para exibir ou cobrar** — toda vez que uma receita aparece (catálogo, perfil do pet, pedido), o custo é recalculado na hora a partir do preço *atual* dos ingredientes. Isso significa:

- Editar o `cost_per_unit` de um ingrediente no catálogo já muda o preço mostrado em qualquer receita que o usa, na próxima vez que ela for carregada — sem precisar reabrir/resalvar a receita.
- Um pedido cobra o preço de hoje, não um preço antigo — calculado para a duração escolhida de cada receita do plano.
- Existe uma coluna cacheada (`base_cost`/`ingredient_cost`) só para uso interno (ex. ordenação); ela nunca é a fonte usada para exibir ou cobrar.

## Pedidos

Cada pedido é um **plano alimentar**: para cada pet, uma ou mais receitas em sequência, cada uma com a sua duração em dias.

- **Cliente**: `/orders` — listagem (cards ou lista), com seções "Em andamento"/"Histórico" e busca.
- **Admin**: `/admin/orders` — listagem de todos os clientes, com busca, filtro por status e troca de status.

### Novo pedido (plano alimentar)

Formulário em `/orders/new`: para cada pet, monta o plano → endereço de entrega opcional → confirmação.

- **Receitas do plano**: só as receitas do próprio pet; a mesma receita pode se repetir. Pet sem receita mostra o atalho "Criar receita para {pet}".
- **Duração de cada receita**: de 7 a 90 dias, com stepper de 1 em 1 dia, valor digitado e atalhos de 7/15/30 dias. Nunca abaixo do mínimo da receita para somar 1,5 kg de ingredientes (a tela avisa; o backend também valida).
- **Ordem**: as receitas podem ser reordenadas; a linha do tempo mostra a sequência (ex.: dias 1–15, 16–30).
- **Preço**: cada receita é precificada ao vivo para a duração escolhida (`POST /recipes/calculate-cost`); o resumo agrupa as etapas por pet e mostra o total. No servidor o preço é recalculado do mesmo jeito — ver "Preço sempre atual" acima. Nunca lido de um valor cacheado.
- **Fatura**: criada automaticamente junto com o pedido (vencimento em 3 dias).
- **Status** (só admin altera): `pending_payment` → `pending` → `in_production` → `ready` → `out_for_delivery` → `delivered` (ou `cancelled` a qualquer momento).
- **Detalhe**: `/orders/[id]` (cliente) e `/admin/orders/[id]` (admin, com troca de status) mostram, por pet, cada receita com a sua duração e o intervalo de dias no plano. O link da receita leva ao perfil do pet (cliente) ou à página do pet do cliente (admin).

### Produção (admin e produção)

Tela `/production` com os **pedidos realizados**, cada um no dia em que foi feito, em **calendário** ou **lista**.

- **Período do pedido**: campos "De" e "Até" (qualquer um pode ficar vazio) e atalhos "Últimos 7 dias", "Últimos 30 dias" e "Este mês". Datas digitadas fora de ordem são invertidas. Ao escolher um período, o calendário vai para o mês do início; os dias fora do período ficam esmaecidos.
- **Calendário**: cada pedido aparece no dia em que foi realizado, com número, cliente e total. Em telas largas, dias cheios mostram 3 pedidos e "+N mais"; em telas pequenas cada pedido vira um ponto.
- **Lista**: sem período, mostra o mês (com navegação entre meses); com período, mostra todos os pedidos do período, do mais antigo para o mais novo. Cada linha traz a previsão do ciclo semanal (reposição na segunda seguinte, produção no dia seguinte e entrega 7 dias depois da reposição).
- **Dia selecionado**: clicar no número do dia abre a lista completa dos pedidos daquele dia (horário, cliente, status e total) e daí o detalhe do pedido.
- **Filtros**: busca (número, cliente, e-mail, receita), status e período valem juntos.
- **Detalhe do pedido** (`OrderDetailPanel`): cada receita aparece com a sua duração e o intervalo de dias no plano do pet, para a produção saber quanto preparar de cada uma.
- **Código**: `features/production/cycle.ts` (ciclo, período e agrupamento de pedidos — helpers puros), `components/DateRangeFilter`, `MonthHeader`, `ProductionCalendar`, `DayOrdersPanel`, `ProductionList` e `OrderDetailPanel`.

## Administração

Área exclusiva para `role = admin` (`AdminMiddleware` nas rotas de backend, guard de rota no frontend):

- **Clientes** (`/admin/customers`): listagem com busca, ordenação, criação de cliente; detalhe (`/admin/customers/[id]`) mostra pets, pedidos, receitas (cada uma ligada ao seu pet) — e permite gerenciar pets do cliente via modal.
- **Pedidos** (`/admin/orders`): pedidos de todos os clientes, com busca, filtro por status e troca de status.
- **Catálogo** (`/admin/catalog`): ingredientes, receitas modelo, configurações de precificação (ver acima).

## Internacionalização e responsividade

Toda tela é traduzida (pt/en/es, chaves em `messages/`) e responsiva (mobile/tablet/desktop) — ver [internacionalizacao.md](internacionalizacao.md) para o fluxo de tradução e o `AGENTS.md` na raiz do projeto para os critérios de responsividade.
