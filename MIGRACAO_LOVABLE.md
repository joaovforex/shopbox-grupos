# Migração para Cloudflare Pages

Este site é totalmente estático e não depende da Lovable em execução.

- Repositório: `joaovforex/shopbox-grupos`
- Build command: deixe vazio
- Output directory: `.`
- Branch de produção: `main`

Antes de alterar o DNS, valide o endereço `*.pages.dev` e todos os links.
Mantenha a publicação antiga disponível até o domínio responder corretamente
pelo Cloudflare. O arquivo `_headers` replica as proteções do Vercel.
