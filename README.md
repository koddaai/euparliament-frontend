# EU Parliament Monitor

Monitor de Membros do Parlamento Europeu (MEPs) com assistente de IA integrado.

**Live:** https://euparliament.kodda.ai

## Funcionalidades

- **Dashboard de MEPs**: Visualizacao dos 717 membros ativos do Parlamento Europeu
- **Estatisticas**: MEPs por pais e grupo politico
- **Tracking de Mudancas**: Monitoramento automatico de entradas, saidas e trocas de grupo
- **Export Excel**: Download de lista completa com abas separadas (MEPs, New Members, Departures, Group Changes)
- **News**: Agregador de noticias europeias (BBC, France24, Guardian, Euronews)
- **Social/X**: Perfis de 401 MEPs no X/Twitter com tweets recentes
- **Chat com IA**: Assistente GPT-4o-mini com acesso ao banco de dados e busca web (Tavily)

## Stack Tecnica

- **Frontend**: Next.js 16 (App Router)
- **Banco de Dados**: NocoDB (hospedado em dados.kodda.ai)
- **IA**: OpenAI GPT-4o-mini com function calling
- **Busca Web**: Tavily API
- **Deploy**: Docker Swarm em VPS

## Arquitetura

```
Frontend (Next.js)
    |
    +-- /api/meps              --> NocoDB (lista de MEPs)
    +-- /api/meps/sync         --> Upsert de MEPs (evita duplicatas)
    +-- /api/stats             --> NocoDB (estatisticas agregadas)
    +-- /api/changes           --> NocoDB (historico de mudancas)
    +-- /api/detect-changes    --> Detecta e registra mudancas
    +-- /api/export/xlsx       --> Export Excel com todas as abas
    +-- /api/news              --> Lista noticias
    +-- /api/news/sync         --> Sync RSS feeds (BBC, France24, etc)
    +-- /api/social/feed       --> Feed de tweets dos MEPs
    +-- /api/social/profiles   --> Perfis X dos MEPs (401 handles)
    +-- /api/social/sync       --> Sync tweets via Apify
    +-- /api/chat              --> OpenAI + Tavily (streaming)
```

## n8n Workflow

Workflow automatizado que roda diariamente:
1. **Schedule Trigger**: 6:00 AM UTC
2. **HTTP Request**: Scrape da lista oficial do Parlamento Europeu
3. **Parse HTML**: Extrai dados dos 718 MEPs
4. **Detect Changes**: Chama `/api/detect-changes` que:
   - Sincroniza MEPs (upsert via `/api/meps/sync`)
   - Detecta joins, leaves e group changes
   - Registra mudancas no NocoDB

**URL:** https://workflows.kodda.ai/workflow/pPWVxQVLSvJCgrTH

## Variaveis de Ambiente

```bash
# NocoDB
NOCODB_URL=https://dados.kodda.ai
NOCODB_TOKEN=...
NOCODB_BASE_ID=...
NOCODB_MEPS_TABLE_ID=...
NOCODB_CHANGES_TABLE_ID=...
NOCODB_NEWS_TABLE_ID=...
NOCODB_TWEETS_TABLE_ID=...

# OpenAI (Chat)
OPENAI_API_KEY=sk-proj-...

# Tavily (Web Search)
TAVILY_API_KEY=tvly-...
```

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Deploy

O projeto roda em Docker Swarm na VPS:

```bash
# Na VPS
cd /opt/stacks/euparliament/app
git pull
docker service update --force euparliament_euparliament
```

## Estrutura de Arquivos

```
src/
  app/
    api/
      chat/route.ts           # API do chat com streaming
      meps/route.ts           # Lista de MEPs
      meps/sync/route.ts      # Upsert de MEPs
      stats/route.ts          # Estatisticas
      changes/route.ts        # Historico de mudancas
      detect-changes/route.ts # Detecta mudancas (entry/exit/group_change)
      export/xlsx/route.ts    # Export Excel com abas
      news/route.ts           # Lista noticias
      news/sync/route.ts      # Sync RSS feeds
      social/feed/route.ts    # Feed de tweets
      social/profiles/route.ts # Perfis X dos MEPs
      social/sync/route.ts    # Sync tweets
    page.tsx                  # Pagina principal (Dashboard)
    news/page.tsx             # Pagina de noticias
    social/page.tsx           # Pagina social/X
  components/
    Changes.tsx               # Recent Changes (entry/exit)
    chat/                     # Componentes do chat
    social/                   # Componentes sociais
    ui/                       # Componentes de UI
  data/
    meps-x-profiles.json      # 401 MEPs com X handles (manual)
  lib/
    chat/
      tools.ts                # Definicoes das tools
      tool-handlers.ts        # Execucao das tools
      system-prompt.ts        # System prompt
    tavily.ts                 # Integracao Tavily
  hooks/
    useChat.ts                # Hook do chat
```

## Status do Projeto

**Fase Atual:** Producao

- [x] Dashboard de MEPs
- [x] Estatisticas por pais/grupo
- [x] Tracking de mudancas (entry/exit/group_change)
- [x] Export Excel com abas (All MEPs, New Members, Departures, Group Changes)
- [x] Pagina de noticias (/news) com RSS feeds
- [x] Pagina social (/social) com tweets dos MEPs
- [x] Chat com IA (GPT-4o-mini)
- [x] Busca web via Tavily
- [x] Workflow n8n para sync diario
- [x] Deploy em VPS (Docker Swarm)
- [x] Fix de duplicatas (upsert)
- [x] Fix SSL em chamadas internas
- [x] Fix mep_id type mismatch (string vs number)
- [x] Fix change_type values (entry/exit em vez de joined/left)
- [ ] Sync automatico de X handles (atual: JSON manual)
- [ ] Historico de votacoes
- [ ] Notificacoes de mudancas

## Notas Tecnicas

### change_type Values (NocoDB)
O campo `change_type` na tabela de changes usa:
- `entry` - MEP entrou no parlamento
- `exit` - MEP saiu do parlamento
- `group_change` - MEP trocou de grupo politico

### X Profiles
Os handles do X/Twitter estao em `src/data/meps-x-profiles.json` (401 MEPs).
Este ficheiro e atualizado manualmente quando necessario.

## Mantido por

[kodda.ai](https://kodda.ai)
