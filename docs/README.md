# Documentação — GoodFood System

Índice da documentação técnica do projeto. Comece pelo [README principal](../README.md) para uma visão geral.

| Documento | Conteúdo |
| --- | --- |
| [configuracao.md](configuracao.md) | Pré-requisitos, subida do ambiente Docker, comandos do dia a dia e **troubleshooting** |
| [implantacao_vps.md](implantacao_vps.md) | Deploy em VPS: Docker de produção, pipeline CI/CD e configuração de SSH/Secrets |
| [arquitetura.md](arquitetura.md) | Arquitetura do sistema: camadas do backend, padrões do frontend, infraestrutura |
| [dominio.md](dominio.md) | Modelo de domínio: entidades, relacionamentos e regras de negócio (assinaturas, custo de receitas) |
| [funcionalidades.md](funcionalidades.md) | Documentação funcional das telas e fluxos: pets, catálogo, receitas, pedidos, assinaturas, administração |
| [api.md](api.md) | Referência da API REST: autenticação, contrato de resposta, endpoints e autorização |
| [testes.md](testes.md) | Como rodar e escrever testes (Pest), o que a suíte cobre |
| [internacionalizacao.md](internacionalizacao.md) | Fluxo obrigatório de internacionalização do frontend (pt/en/es) |
| [boas_praticas.md](boas_praticas.md) | Padrões de código, arquitetura e qualidade adotados pela equipe |
| [fluxo_git.md](fluxo_git.md) | Fluxo de branches, commits e pull requests |

## Para quem está chegando agora

1. [configuracao.md](configuracao.md) — suba o ambiente.
2. [arquitetura.md](arquitetura.md) + [dominio.md](dominio.md) + [funcionalidades.md](funcionalidades.md) — entenda o sistema.
3. [boas_praticas.md](boas_praticas.md) + [fluxo_git.md](fluxo_git.md) — antes do primeiro PR.
4. [api.md](api.md) — ao trabalhar em integrações frontend ↔ backend.
