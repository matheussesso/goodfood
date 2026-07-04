# Internacionalização (i18n)

O frontend usa **next-intl** com três locales: `pt` (padrão), `en` e `es`. Toda a interface roda sob o segmento `app/[locale]/`, com roteamento resolvido pelo middleware (`src/frontend/middleware.ts` + `i18n/routing.ts`).

## Regra de ouro

**Nenhum texto visível ao usuário pode ser hardcoded no JSX.** Toda string de UI nasce nos três arquivos de mensagens ao mesmo tempo:

```
src/frontend/messages/pt.json
src/frontend/messages/en.json
src/frontend/messages/es.json
```

Os três arquivos devem manter **paridade total de chaves** (mesma quantidade, mesmos nomes).

## Fluxo obrigatório para texto novo

1. Definir a chave em `pt.json` (fonte).
2. Adicionar a tradução em `en.json` e `es.json`.
3. Consumir no componente com `useTranslations()`:

```tsx
const t = useTranslations("Pets");
<span>{t("photo_change_hint")}</span>
```

Em Server Components/páginas async, usar `getTranslations()` de `next-intl/server`.

## Namespaces

| Namespace | Uso |
| --- | --- |
| `Common` | Rótulos universais: `save`, `cancel`, `loading`, `try_again`, `something_went_wrong`, validações… **Nunca duplicar uma chave que já existe aqui** |
| `Auth`, `Navigation`, `Dashboard` | Áreas transversais |
| `Pets`, `Recipes`, `Orders`, `Subscriptions`, `Catalog`, `Profile`, `Production` | Texto específico de cada feature |
| `admin` | Telas administrativas |
| `Metadata`, `NotFound` | Metadados de página e 404 localizado |

- Chaves semânticas: `Orders.confirm_order`, nunca `Orders.btn2`.
- Interpolações dentro da chave: `"welcome_back": "Bem-vindo, {name}!"` — nunca concatenar strings.

## Exceções permitidas

- Valores monetários/datas formatados por locale (formatação, não tradução).
- Nomes próprios e dados vindos da API (nome do pet, do cliente).
- **`app/global-not-found.tsx` e `app/global-error.tsx`**: renderizam fora da árvore `[locale]` (substituem o root layout), então não têm acesso ao next-intl — o texto é estático em inglês, por definição da plataforma.

## Verificação de paridade

Antes de commitar mudanças nos messages:

```bash
cd src/frontend
node -e '
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>typeof v==="object"?flat(v,p+k+"."):[p+k]);
const s={};["pt","en","es"].forEach(l=>s[l]=new Set(flat(require("./messages/"+l+".json"))));
console.log(Object.entries(s).map(([l,x])=>l+": "+x.size).join(" | "));
for(const a of Object.keys(s)) for(const b of Object.keys(s)) 
  [...s[a]].filter(k=>!s[b].has(k)).forEach(k=>console.log("faltando em "+b+": "+k));
'
```

Saída esperada: mesmas contagens e nenhuma linha "faltando".
