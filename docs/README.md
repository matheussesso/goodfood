# Documentação — GoodFood System

Índice da documentação técnica do projeto. Comece pelo [README principal](../README.md) para uma visão geral.

| Documento | Conteúdo |
| --- | --- |
| [setup.md](setup.md) | Pré-requisitos, subida do ambiente Docker, comandos do dia a dia e **troubleshooting** |
| [vps_deploy.md](vps_deploy.md) | Deploy em VPS: Docker de produção, pipeline CI/CD e configuração de SSH/Secrets |
| [architecture.md](architecture.md) | Arquitetura do sistema: camadas do backend, padrões do frontend, infraestrutura |
| [domain.md](domain.md) | Modelo de domínio: entidades, relacionamentos e regras de negócio (assinaturas, custo de receitas) |
| [api.md](api.md) | Referência da API REST: autenticação, contrato de resposta, endpoints e autorização |
| [testing.md](testing.md) | Como rodar e escrever testes (Pest), o que a suíte cobre |
| [i18n.md](i18n.md) | Fluxo obrigatório de internacionalização do frontend (pt/en/es) |
| [best_practices.md](best_practices.md) | Padrões de código, arquitetura e qualidade adotados pela equipe |
| [git_flow.md](git_flow.md) | Fluxo de branches, commits e pull requests |

## Para quem está chegando agora

1. [setup.md](setup.md) — suba o ambiente.
2. [architecture.md](architecture.md) + [domain.md](domain.md) — entenda o sistema.
3. [best_practices.md](best_practices.md) + [git_flow.md](git_flow.md) — antes do primeiro PR.
4. [api.md](api.md) — ao trabalhar em integrações frontend ↔ backend.
