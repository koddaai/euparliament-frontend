# EU Parliament Monitor - Status do Projeto

## Stack
- **Database**: NocoDB (https://dados.kodda.ai)
- **Workflows**: n8n (https://workflows.kodda.ai)
- **Frontend**: Next.js 16.1.6 + React 19 + Tailwind 4
- **Deploy**: Docker Swarm na VPS (manager02)
- **URL**: https://euparliament.kodda.ai

---

## Configuracao NocoDB

- **Base**: EU Parliament
- **Base ID**: prdfu6o4wbwp1um
- **Host**: https://dados.kodda.ai

### Tabelas

| Tabela | Table ID | Status |
|--------|----------|--------|
| meps | mlfaa9jzkg1fhtg | OK - 719 registros (718 ativos, 1 inativo) |
| changes_log | mckqnd62x5hf49w | OK - 4 registros (entry, exit, group_change) |
| mep_committees | - | NAO CRIADA |
| mep_delegations | - | NAO CRIADA |

### Schema changes_log
| Campo | Tipo | Descricao |
|-------|------|-----------|
| mep_id | SingleLineText | ID do MEP |
| mep_name | SingleLineText | Nome do MEP |
| change_type | SingleSelect | entry, exit, group_change |
| old_value | SingleLineText | Valor anterior (ex: grupo politico antigo) |
| new_value | SingleLineText | Novo valor (ex: grupo politico novo) |
| detected_at | SingleLineText | Data/hora da deteccao |

### API Tokens
- `euparliament-sync` - usado pelo n8n
- `frontend` - usado pelo frontend

---

## Estado Atual

### O QUE FUNCIONA

| Item | Status | Notas |
|------|--------|-------|
| NocoDB Base | OK | Base criada com 719 MEPs |
| Workflow n8n Daily Sync | OK | Roda 6h UTC diariamente |
| Frontend Deploy | OK | Docker Swarm + Traefik |
| SSL/HTTPS | OK | Via Traefik + Let's Encrypt |
| API /api/meps | OK | Lista MEPs com filtros |
| API /api/meps/[id] | OK | Detalhes de um MEP |
| API /api/stats | OK | Estatisticas agregadas |
| API /api/changes | OK | Lista mudancas detectadas |
| API /api/detect-changes | OK | Detecta entradas, saidas e mudancas de grupo |
| API /api/export/xlsx | OK | Download Excel com 4 abas |
| Componente Stats | OK | Exibe estatisticas |
| Componente SearchFilters | OK | Filtros por grupo/pais |
| Componente MEPList | OK | Grid de cards |
| Componente MEPCard | OK | Card individual |
| Componente Changes | OK | Timeline de mudancas |
| Componente ExportButton | OK | Download Excel funcionando |
| Deteccao de mudancas | OK | Detecta novos MEPs, saidas e mudancas de grupo automaticamente |

### O QUE NAO FUNCIONA / INCOMPLETO

| Item | Problema | Acao Necessaria |
|------|----------|-----------------|
| Tabela mep_committees | Nao existe | Criar no NocoDB |
| Tabela mep_delegations | Nao existe | Criar no NocoDB |
| Scraping detalhado | Nao implementado | Workflow n8n para pegar comissoes/delegacoes |

---

## Historico de Mudancas Detectadas

| Data | MEP | Tipo | Detalhe |
|------|-----|------|---------|
| 2026-03-11 | Sander SMIT | Mudanca de Grupo | EPP → ECR |
| 2026-03-11 | Jessika VAN LEEUWEN | Mudanca de Grupo | EPP → ECR |
| 2026-03-04 | Willemien KONING | Entrada | EPP, Netherlands, CDA |
| 2026-03-02 | Daniel CASPARY | Saida | EPP |

---

## Progresso por Etapa

### Passo 1: Configurar NocoDB
- [x] Criar Base "EU Parliament"
- [x] Criar tabela `meps` (campos essenciais)
- [x] Criar tabela `changes_log`
- [ ] Criar tabela `mep_committees`
- [ ] Criar tabela `mep_delegations`
- [x] Obter API Tokens
- [x] Obter Base ID

### Passo 2: Criar Workflow n8n
- [x] Configurar credenciais NocoDB
- [x] Criar workflow "EU Parliament - Daily Sync"
- [x] Schedule Trigger (6h UTC diario)
- [x] HTTP Request (GET lista de MEPs)
- [x] Parse HTML (Code JavaScript)
- [x] Get Existing MEPs (NocoDB Get Many)
- [x] Create MEPs (NocoDB Create)
- [x] Ativar workflow
- [x] Deteccao de mudancas (via API /api/detect-changes)
- [x] Sync de MEPs (via API /api/meps/sync)
- [x] Log de changes (via API /api/detect-changes)

### Passo 3: Executar Primeiro Scraping
- [x] Executar workflow manualmente
- [x] Validar dados no NocoDB - **719 MEPs criados**

### Passo 4: Deploy Frontend Next.js
- [x] Criar projeto Next.js
- [x] Implementar API routes
- [x] Implementar componentes
- [x] Testar frontend localmente
- [x] Configurar docker-compose.yml
- [x] Deploy no Docker Swarm
- [x] Configurar Traefik labels

### Passo 5: Configurar Dominio e SSL
- [x] DNS apontando para VPS
- [x] Traefik como reverse proxy
- [x] SSL via Let's Encrypt (certresolver)

### Passo 6: Testar Tudo
- [x] Acessar https://euparliament.kodda.ai
- [x] Testar filtros funcionando
- [x] Testar busca por nome
- [x] Verificar workflow scheduled no n8n
- [x] Testar deteccao de mudancas
- [x] Testar export Excel

---

## Ambiente de Deploy (VPS)

```
Host: manager02
Stack: euparliament
Diretorio: /opt/stacks/euparliament
Network: network_swarm_public
Proxy: Traefik v2.11.0
```

### Docker Compose (resumo)
```yaml
services:
  euparliament:
    image: node:20-alpine
    command: sh -c "npm install --include=dev && npm run build && npm start"
    volumes:
      - ./app:/app
    environment:
      - NODE_ENV=production
      - NOCODB_URL=https://dados.kodda.ai
      - NOCODB_TOKEN=***
      - NOCODB_BASE_ID=prdfu6o4wbwp1um
      - NOCODB_MEPS_TABLE_ID=mlfaa9jzkg1fhtg
      - NOCODB_CHANGES_TABLE_ID=mckqnd62x5hf49w
    deploy:
      labels:
        - traefik.http.routers.euparliament.rule=Host(`euparliament.kodda.ai`)
```

### Comandos de Deploy
```bash
# Na VPS (manager02)
cd /opt/stacks/euparliament/app && git pull && cd .. && docker stack deploy -c docker-compose.yml euparliament
```

---

## Proximos Passos

### Prioridade Alta
1. [x] ~~Testar o site https://euparliament.kodda.ai no browser~~
2. [x] ~~Verificar se os filtros funcionam corretamente~~
3. [ ] Testar a API de export XML

### Prioridade Media
4. [ ] Criar tabelas mep_committees e mep_delegations no NocoDB
5. [ ] Implementar scraping de detalhes (comissoes, delegacoes, contatos)

### Prioridade Baixa (futuro)
6. [ ] Notificacoes por email quando houver mudancas
7. [ ] Dashboard de analytics
8. [ ] API publica documentada

---

## Credenciais (referencia)
- **n8n**: https://workflows.kodda.ai - pedro@kodda.ai / bjv-UYX2ycv8gyn*qaz
- **NocoDB**: https://dados.kodda.ai - pedro@kodda.ai / ytb-VWE1hue5qpe@vyq
- **GitHub**: https://github.com/koddaai/euparliament-frontend

## Notas
- Iniciado em: 2026-02-25
- Ultima atualizacao: 2026-03-12
- Deploy fix: NODE_ENV=production requer `npm install --include=dev` para instalar typescript
- Bug fix (2026-03-04): Corrigido ordem de operacoes em /api/detect-changes para detectar novos MEPs corretamente
- Bug fix (2026-03-12): Adicionado `cache: 'no-store'` em /api/detect-changes, /api/meps/sync e /api/export/xlsx para evitar dados stale do Next.js e garantir deteccao correta de group_change
- Schema fix (2026-03-12): Adicionada opcao `group_change` no campo change_type e criada coluna `new_value` na tabela changes_log

## Deteccao de Mudancas

O sistema detecta automaticamente 3 tipos de mudancas quando o workflow n8n roda (6h UTC):

| Tipo | Descricao | Exemplo |
|------|-----------|---------|
| entry | MEP novo aparece no scrape | Novo membro entra no Parlamento |
| exit | MEP ativo desaparece do scrape | Membro deixa o Parlamento |
| group_change | MEP muda de grupo politico | EPP → ECR |

### Fluxo de Deteccao
1. n8n faz scrape do site oficial do Parlamento Europeu
2. Envia dados para `/api/detect-changes`
3. API compara dados scraped vs banco de dados (com `cache: 'no-store'`)
4. Detecta e registra mudancas na tabela `changes_log`
5. Atualiza status dos MEPs na tabela `meps`
