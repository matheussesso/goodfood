# Funcionalidades do Sistema

Documentação funcional das telas e fluxos do GoodFood System — o que cada funcionalidade faz, quem pode usar, e as regras de negócio por trás dela. Para o modelo de dados por trás de cada entidade, ver [domain.md](domain.md); para o contrato REST, ver [api.md](api.md).

Dois perfis de usuário: **cliente** (tutor do pet) e **admin** (equipe GoodFood). A maioria das funcionalidades tem uma versão para cada um.

---

## Pets

Cadastro dos pets do cliente — base para receitas, pedidos e assinaturas (tudo é vinculado a um pet).

- **Cliente**: `/pets` (listagem em cards ou tabela), `/pets/new` e `/pets/[id]/edit` (páginas dedicadas, não modal), `/pets/[id]` (perfil completo).
- **Campos**: nome, espécie (`dog`/`cat`), sexo, raça, peso, idade, castrado, foto (upload), microchip, veterinário responsável (nome/telefone), restrições/alergias/necessidades especiais.
- **Saúde**: vacinas (nome, data de aplicação, próxima dose) e documentos anexados (exame, receita, laudo, outro — PDF/imagem).
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
- **Visibilidade**: um cliente vê templates + suas próprias receitas + receitas vinculadas aos seus pets. Não pode editar template (só admin).

### Preço sempre atual (custo ao vivo)

O sistema **nunca confia em um preço de receita guardado no banco para exibir ou cobrar** — toda vez que uma receita aparece (catálogo, pedido, assinatura), o custo é recalculado na hora a partir do preço *atual* dos ingredientes. Isso significa:

- Editar o `cost_per_unit` de um ingrediente no catálogo já muda o preço mostrado em qualquer receita que o usa, na próxima vez que ela for carregada — sem precisar reabrir/resalvar a receita.
- Um pedido cobra o preço de hoje, não um preço antigo. Uma assinatura mostra o custo total do plano com base no preço de hoje.
- Existe uma coluna cacheada (`base_cost`/`ingredient_cost`) só para uso interno (ex. ordenação); ela nunca é a fonte usada para exibir ou cobrar.

## Pedidos

Compra avulsa de uma ou mais receitas para um ou mais pets.

- **Cliente**: `/orders` (cards com progresso do status, accordion de itens), `/orders/new` (escolhe pet(s) → receita(s) → endereço de entrega opcional).
- Cada pedido pode ter **vários itens**, cada item é uma receita + pet (a mesma receita pode aparecer em itens diferentes, para pets diferentes).
- **Preço**: calculado ao vivo no momento da criação — ver "Preço sempre atual" acima. Nunca lido de um valor cacheado.
- **Fatura**: criada automaticamente junto com o pedido (vencimento em 3 dias).
- **Status** (só admin altera): `pending_payment` → `pending` → `in_production` → `ready` → `out_for_delivery` → `delivered` (ou `cancelled` a qualquer momento).
- **Admin**: `/admin/orders` (listagem com filtro por status, busca), `/admin/orders/[id]` (detalhe + troca de status).

## Assinaturas

Plano alimentar semanal de duração fixa para um pet — pensado para quem já sabe o que vai alimentar nas próximas semanas e quer deixar isso salvo, sem repetir a escolha toda vez.

- **Cliente**: `/subscriptions` (listagem com busca e filtro de status), `/subscriptions/new` (criação), `/subscriptions/[id]/edit` (edição).
- **Duração do plano**: começa em 14 dias e sobe de 7 em 7 (14, 21, 28, 35...) — sempre um múltiplo de 7, escolhido por um stepper (+/−).
- **Uma receita por semana**: a duração é dividida em blocos de 7 dias (`total_cycles = duration_days / 7`); o cliente escolhe **exatamente uma receita para cada semana** — não dá pra deixar semana em branco nem sobrar receita sem semana. O backend rejeita (`422`) se a contagem não bater.
- **Custo do plano**: soma o custo de cada receita escolhida, mas **sempre cobrando 7 dias por semana** — mesmo que a receita esteja cadastrada no catálogo com outra duração nativa (ex. uma receita de "14 dias" entra no plano custando o equivalente a 1 semana, não 2). Combinado com o preço sempre atual dos ingredientes, o valor mostrado é sempre o real.
- **Progresso**: a tela mostra "Semana X de Y" com base na data de início — só para acompanhamento, não afeta nada.
- **Ações**: pausar, retomar, cancelar (cancelamento é lógico — o histórico fica preservado).
- **Sem relação com Pedidos**: uma assinatura **nunca gera um pedido sozinha**. Não existe job/scheduler rodando em segundo plano criando pedidos a partir de assinaturas — é puramente um plano salvo que o cliente usa como referência. (Isso já foi diferente no passado; ver [domain.md](domain.md#subscription) se encontrar menção a "rotação"/"próxima entrega" em código ou anotações antigas — está desatualizado.)
- **Admin**: `/admin/subscriptions` — só leitura + ações de pausar/retomar/cancelar de qualquer cliente. Sem criação/edição pelo admin.

## Administração

Área exclusiva para `role = admin` (`AdminMiddleware` nas rotas de backend, guard de rota no frontend):

- **Clientes** (`/admin/customers`): listagem com busca, ordenação, criação de cliente; detalhe (`/admin/customers/[id]`) mostra pets, pedidos, receitas — e permite gerenciar pets do cliente via modal.
- **Pedidos** (`/admin/orders`): listagem de todos os pedidos da plataforma, troca de status.
- **Assinaturas** (`/admin/subscriptions`): listagem de todos os planos, ações de status.
- **Catálogo** (`/admin/catalog`): ingredientes, receitas modelo, configurações de precificação (ver acima).

## Internacionalização e responsividade

Toda tela é traduzida (pt/en/es, chaves em `messages/`) e responsiva (mobile/tablet/desktop) — ver [i18n.md](i18n.md) para o fluxo de tradução e o `AGENTS.md` na raiz do projeto para os critérios de responsividade.
