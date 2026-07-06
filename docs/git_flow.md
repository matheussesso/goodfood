# Git Flow e Padrões de Controle de Versão

Este documento descreve como nós trabalhamos e operamos o controle de versionamento no GoodFood System. Para manter o histórico legível e facilitar CI/CD e auditoria, seguimos o **Git Flow** adaptado.

## Resumo das Branches Estruturais

A nossa organização baseia-se em 2 ramificações principais, permanentes na árvore:
- **`main`**: Representa a linha do tempo principal. Nela todo o código já foi exaustivamente testado. O que está na `main` reflete integralmente o que o cliente/usuário acessa em ambiente de **Produção**. *Commits manuais diretamente aqui são veementemente proibidos.*
- **`develop`**: Nossa branch central de trabalho. Ela recebe toda contribuição da equipe de desenvolvimento e representa o ambiente de testes (Staging/QA).

---

## Tipos de Ramificações de Tarefa

Todo trabalho (sem exceção) deve nascer a partir de uma branch dedicada. Nunca começamos a codificar na `develop`. As nomenclaturas das branches devem ser autoexplicativas e seguir os prefixos:

1. **`feature/nome-da-funcionalidade`**: Utilizado para desenvolvimento de novas entregas e requisitos. Baseia-se e sofre fusão na `develop`.
2. **`bugfix/identificacao-do-bug`**: Utilizado para correções de fluxos indesejados encontrados no ambiente de desenvolvimento (`develop`).
3. **`hotfix/descricao-do-incidente`**: Trata-se do único momento que uma branch é ramificada da `main` visando corrigir uma falha urgente que está impactando a Produção. É retornada e mesclada tanto para a `main` quanto para a `develop`.
4. **`release/vX.Y.Z`**: Ramificações preparatórias criadas à partir da `develop` que antecedem uma entrega oficial. Servem para testes estabilizadores ou incrementos de build/versões sem interferir com os novos desenvolvimentos na `develop`.

---

## Fluxo de Trabalho (Step-by-step)

Ao receber uma nova atividade:

1. Vá até a `develop` e mantenha-a atualizada:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. Crie a sua nova branch com o tipo adequado e um nome explicativo:
   ```bash
   git checkout -b feature/carrinho-de-compras
   ```

3. Durante o desenvolvimento, faça commits concisos e semânticos (ver abaixo Padrões de Commit).

4. Realize testes exaustivos:
   - Validou as responsividades obrigatórias?
   - Os testes backend via *Pest* estão todos com a cor verde?
   - Os pre-commits/linters acusaram erros?

5. Abra um **Pull Request (PR)** da sua branch de Feature diretamente para a `develop`.
   - Adicione capturas de telas ou trechos em formato `.gif` de componentes da UI.
   - Descreva inteiramente a solução da Tarefa de forma clara em Português.

6. **Code Review**: O seu PR será analisado pela equipe. Havendo aprovação, ele fará o `merge`. Logo em seguida, apague a sua branch local e remota.

---

## Padrões de Commit

Mantenha a coerência nos registros de Commits adotando Commits Semânticos (*Conventional Commits*), sempre em **Inglês**:

- `feat:` Nova funcionalidade
- `fix:` Correção de um bug
- `docs:` Modificações exclusivas de documentação ou comentários
- `style:` Formatações, organização, ponto-e-vírgula (não é refatoração)
- `refactor:` Ajustes de código limpo que não alteram comportamentos ou interfaces de APIs
- `test:` Inserção ou correções de casos de teste
- `chore:` Trabalhos mecânicos (ex: atualização de dependências e libs)

---

## CI/CD

Todo push e PR contra `main` ou `develop` dispara o pipeline em
[`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml):

```
Prepare → Quality (Pint, ESLint, tsc) → Test (Pest, Vitest) → Build* → Deploy*
```

\* **Build** (imagens Docker → GHCR) e **Deploy** (SSH no VPS) só rodam em
**push direto na `main`** — nunca em PR, nunca em push na `develop`. Ou seja:

| Evento | Quality | Test | Build | Deploy |
| --- | --- | --- | --- | --- |
| PR → `develop` ou `main` | ✅ | ✅ | — | — |
| Push em `develop` (merge de PR) | ✅ | ✅ | — | — |
| Push em `main` (merge de release) | ✅ | ✅ | ✅ | ✅ (produção) |

Implicações práticas:

- **Um PR só pode ser mergeado com Quality + Test verdes** (configure isso
  como *required status check* em Settings → Branches → Branch protection
  rules, tanto para `main` quanto `develop`).
- Merge/push na `main` publica automaticamente em produção no VPS — trate
  esse merge com o mesmo cuidado de um deploy manual. Normalmente isso
  acontece ao fechar uma `release/vX.Y.Z` ou um `hotfix/*`.
- Deploy de produção, Docker (dev vs. prod) e configuração do VPS/GHCR/Cloudflare
  estão documentados em [vps_deploy.md](vps_deploy.md).
