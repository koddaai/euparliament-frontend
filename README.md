# EU Parliament Monitor

Monitor de Membros do Parlamento Europeu (MEPs) com assistente de IA integrado.

**Live:** https://euparliament.kodda.ai

## Funcionalidades

- **Dashboard de MEPs**: Visualizacao dos 718 membros do Parlamento Europeu
- **Estatisticas**: MEPs por pais e grupo politico
- **Tracking de Mudancas**: Monitoramento de entradas, saidas e trocas de grupo
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
    +-- /api/meps          --> NocoDB (lista de MEPs)
    +-- /api/stats         --> NocoDB (estatisticas agregadas)
    +-- /api/changes       --> NocoDB (historico de mudancas)
    +-- /api/detect-changes --> Detecta e registra mudancas
    +-- /api/meps/sync     --> Upsert de MEPs (evita duplicatas)
    +-- /api/meps/cleanup  --> Remove duplicatas
    +-- /api/chat          --> OpenAI + Tavily (streaming)
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
      chat/route.ts         # API do chat com streaming
      meps/route.ts         # Lista de MEPs
      meps/sync/route.ts    # Upsert de MEPs
      meps/cleanup/route.ts # Remove duplicatas
      stats/route.ts        # Estatisticas
      changes/route.ts      # Historico de mudancas
      detect-changes/route.ts # Detecta mudancas
    page.tsx                # Pagina principal
  components/
    chat/                   # Componentes do chat
    ui/                     # Componentes de UI
  lib/
    chat/
      tools.ts              # Definicoes das tools
      tool-handlers.ts      # Execucao das tools
      system-prompt.ts      # System prompt
    tavily.ts               # Integracao Tavily
  hooks/
    useChat.ts              # Hook do chat
```

## Status do Projeto

**Fase Atual:** Producao

- [x] Dashboard de MEPs
- [x] Estatisticas por pais/grupo
- [x] Tracking de mudancas
- [x] Chat com IA (GPT-4o-mini)
- [x] Busca web via Tavily
- [x] Workflow n8n para sync diario
- [x] Deploy em VPS
- [x] Fix de duplicatas (upsert)
- [x] Fix SSL em chamadas internas
- [ ] Historico de votacoes
- [ ] Notificacoes de mudancas

## Mantido por

[kodda.ai](https://kodda.ai)
