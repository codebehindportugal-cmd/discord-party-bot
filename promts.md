## Sistema de Voice Chat por Evento

### Criação automática do canal de voz
- Ao usar /iniciar-evento [id], o bot cria automaticamente um canal de voz
  temporário com o nome do evento (ex: "⚔️ Raid Molten Core")
- O canal é criado na categoria configurada com /config-canal [voz] [categoria]
- Apenas jogadores confirmados no evento conseguem entrar no canal
- O bot começa a registar o timestamp de entrada e saída de cada jogador

### Tracking de tempo no voice
- O bot escuta os eventos voiceStateUpdate do Discord.js em tempo real
- Quando um jogador entra: regista { playerId, eventId, joinedAt: Date.now() }
- Quando um jogador sai (ou é desconectado): regista { leftAt: Date.now() },
  calcula o tempo parcial e acumula
- Se o jogador entrar e sair múltiplas vezes, o tempo é somado (sessões múltiplas)
- Se o jogador perder ligação e voltar em menos de 5 minutos, o tempo não é interrompido (tolerância AFK/crash)
- /ver-tempo [id_evento] — mostra tabela com tempo de cada jogador em tempo real

### Cálculo do split por tempo
- Fórmula base:
  participação_jogador (%) = tempo_jogador / soma_total_tempo_todos_jogadores * 100
- Exemplo:
  Jogador A: 120min → 50%
  Jogador B: 90min  → 37.5%
  Jogador C: 30min  → 12.5%
  Gold total: 10.000 → A recebe 5.000 / B recebe 3.750 / C recebe 1.250

### Modificadores opcionais (configurável pelo admin)
- Bonus por role: tank e healer podem ter multiplicador (ex: 1.2x) para compensar
  a escassez destas classes
- Tempo mínimo: admin pode definir tempo mínimo para receber loot
  (ex: jogadores com menos de 15 minutos não recebem)
- Cap máximo: admin pode definir % máxima por jogador para evitar dominância
  (ex: ninguém recebe mais de 40% independentemente do tempo)

### Encerramento do evento
- /encerrar-evento [id] — o bot:
  1. Expulsa todos do canal de voz
  2. Apaga o canal de voz temporário
  3. Congela os tempos registados
  4. Calcula automaticamente o split
  5. Mostra preview com embed antes de confirmar
- /confirmar-split [id] — envia os resultados finais:
  - Embed no canal com tabela (jogador / tempo / % / gold recebido)
  - DM individual a cada jogador com o seu valor

### Modelos de dados adicionais
- VoiceSession { id, eventId, playerId, joinedAt, leftAt, durationMinutes }
- EventTimeReport { eventId, playerId, totalMinutes, percentage, finalAmount }

### Comandos de gestão
- /ajustar-tempo [@user] [id_evento] [minutos] — admin pode corrigir tempo manualmente
  (para casos de crash, ban de bot, etc.) com log da alteração
- /ver-tempo [id_evento] — tabela ao vivo com tempos acumulados
- /pausar-tracking [id_evento] — pausa o registo (ex: durante pausa da raid)
- /retomar-tracking [id_evento] — retoma o registo

Adicionar ao PROMPT do Site
## Dashboard — Detalhe de Evento com Tracking de Tempo

### Página de detalhe do evento
- Timeline visual de cada jogador: barra horizontal mostrando quando entrou
  e saiu do voice ao longo da duração do evento
- Tabela final: jogador | tempo total | % de participação | valor recebido
- Gráfico de pizza com a divisão percentual por jogador
- Indicador de modificadores aplicados (bonus de role, tempo mínimo, cap)
- Histórico de sessões de voice por jogador (entradas/saídas individuais)

### Estatísticas globais do jogador
- No perfil do jogador: média de tempo por evento, total de horas em raids,
  gráfico de ganhos ao longo do tempo correlacionado com horas jogadas
- Ranking do servidor por horas totais em eventos

🧮 Resumo da Lógica de Divisão
Loot Total
    ÷
Soma de todos os minutos
    ×
Minutos do jogador X
    =
Gold do jogador X

🤖 PROMPT — Bot Discord
Cria um bot Discord completo em Node.js usando a biblioteca Discord.js v14.

## Objetivo
Bot de gestão de party loots para jogos online, vendido por subscrição mensal.
Permite criar eventos de grupo, anunciar aos jogadores registados,
e no final dividir automaticamente os lucros/loot entre os participantes.

## Funcionalidades principais

### Sistema de Subscrição
- Cada servidor Discord tem um plano (Free / Pro / Premium)
- Free: máximo 1 evento ativo, 5 jogadores registados
- Pro: eventos ilimitados, 20 jogadores, 2 jogos
- Premium: tudo ilimitado + estatísticas avançadas
- O bot verifica via API REST se o servidor tem subscrição ativa antes de executar comandos premium

### Jogadores
- /registar [classe] [jogo] — regista o utilizador no servidor
- /perfil [@user] — mostra estatísticas do jogador (eventos, ganhos totais, % de participação)
- /editar-classe [nova_classe] — atualiza a classe do jogador
- Suporte a múltiplos jogos simultaneamente (ex: WoW, FFXIV, Lost Ark, etc.)
- Cada jogo tem classes específicas configuráveis pelo admin

### Eventos / Parties
- /criar-evento [jogo] [nome] [data] [vagas] [tipo_loot] — cria um evento
- O bot anuncia automaticamente no canal de eventos com embed rico (imagem do jogo, vagas, data)
- O bot envia DM a todos os jogadores registados naquele jogo
- /entrar-evento [id] — jogador confirma presença
- /sair-evento [id] — jogador cancela presença
- /listar-eventos — mostra eventos ativos com status de vagas
- /cancelar-evento [id] — admin cancela o evento

### Sistema de Loot / Ganhos
- Tipos de loot: Gold Split (divisão igual), Loot Council (admin atribui manualmente),
  DKP (sistema de pontos), Percentage Based (por role/classe)
- /iniciar-loot [id_evento] — abre sessão de registo de ganhos
- /adicionar-loot [item/gold] [valor] [moeda] — regista item ou gold obtido
- /atribuir-loot [@user] [item] — no modo Loot Council
- /calcular-split — calcula a divisão automática e mostra preview
- /confirmar-split — envia resultado final em embed para o canal e DM a cada participante
- /historico [id_evento] — mostra histórico completo do evento

### Administração do Servidor
- /config-canal [anuncios/logs/eventos] [#canal] — configura canais do bot
- /adicionar-jogo [nome] [imagem_url] — adiciona jogo suportado no servidor
- /adicionar-classe [jogo] [classe] [role: tank/heal/dps] — adiciona classe ao jogo
- /remover-jogo / /remover-classe
- /definir-moeda [nome] [símbolo] — define a moeda padrão do servidor
- /ver-config — mostra configuração atual do servidor
- /stats-servidor — estatísticas gerais (eventos, jogadores, gold total distribuído)

## Arquitetura técnica
- Node.js + Discord.js v14 com Slash Commands
- Base de dados: PostgreSQL com Prisma ORM
- Autenticação com a API do site via JWT
- Redis para cache de sessões de loot ativas
- Sistema de filas com Bull para envio de DMs em massa (evitar rate limit)
- Webhook para notificar o site sobre eventos criados/concluídos
- Estrutura de pastas: /commands /events /services /prisma /utils

## Modelos de dados principais
- Server { id, discordId, planId, configJson }
- Player { id, discordId, serverId, gameId, classId, totalEarnings }
- Game { id, name, imageUrl, serverId }
- Class { id, name, role, gameId }
- Event { id, name, gameId, date, slots, lootType, status, serverId }
- EventParticipant { eventId, playerId, confirmed }
- LootEntry { id, eventId, type, value, currency, assignedTo }
- LootSplit { id, eventId, playerId, amount, confirmedAt }

## Comportamento de UX
- Todos os comandos retornam embeds visuais com cores por tipo (verde=sucesso, vermelho=erro, amarelo=aviso)
- Botões interativos (entrar/sair de evento, confirmar split)
- Mensagens efémeras para erros (só o utilizador vê)
- Logs de todas as ações no canal de logs configurado
- Idioma configurável por servidor (PT / EN)

🌐 PROMPT — Site de Gestão
Cria um site web completo para gestão de um bot Discord de party loots,
com dashboard para administradores de servidor e painel de super-admin.

## Stack
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: API Routes do Next.js
- Base de dados: PostgreSQL + Prisma
- Auth: NextAuth.js com login via Discord OAuth2
- Pagamentos: Stripe (subscrições recorrentes mensais)
- Gráficos: Recharts
- Deploy: Vercel + Railway (DB)

## Páginas e funcionalidades

### Área Pública
- Landing Page com hero animado, features, planos de preço, FAQ e CTA
- Página de Preços com comparação de planos (Free / Pro / Premium)
- Documentação dos comandos do bot
- Status page (uptime do bot)

### Autenticação
- Login via Discord OAuth2 (NextAuth)
- Ao fazer login, o sistema associa os servidores Discord do utilizador
- Redirecionamento automático para o dashboard

### Dashboard do Servidor (Admin)
- Seletor de servidor (se o utilizador for admin em múltiplos servidores)
- Visão geral: eventos este mês, gold distribuído, jogadores ativos, eventos pendentes
- Gráficos: ganhos por semana, jogadores mais ativos, jogos mais jogados
- Aba "Eventos": tabela com todos os eventos (filtro por status/jogo/data), detalhes expandíveis com participantes e loot
- Aba "Jogadores": lista de jogadores registados, estatísticas individuais, classes, ganhos históricos
- Aba "Jogos & Classes": CRUD de jogos (nome, imagem, ativo/inativo), CRUD de classes por jogo com role (tank/heal/dps) e cor
- Aba "Configurações": canais Discord configurados, moeda padrão, idioma do bot, gestão de roles com permissão de admin
- Aba "Subscrição": plano atual, data de renovação, botão para upgrade/downgrade, histórico de faturas (via Stripe Customer Portal)

### Painel Super-Admin (acesso restrito)
- Lista de todos os servidores registados com plano e estado
- Gestão global de jogos base (disponíveis para todos os servidores)
- Gestão de planos e limites
- Métricas globais: MRR, churn, servidores ativos, eventos totais
- Logs de ações do bot em tempo real
- Ferramenta para dar subscrição gratuita (trial) a um servidor

### Sistema de Subscrições (Stripe)
- Checkout com Stripe para upgrade de plano
- Webhooks do Stripe para: pagamento bem-sucedido, falha, cancelamento, renovação
- Ao receber webhook, atualiza a tabela Server no DB e notifica o bot via API interna
- Cancelamento com período de graça até fim do ciclo
- Portal do cliente Stripe para gestão de cartão e faturas

### API interna (usada pelo bot)
- GET /api/bot/server/:discordId — devolve config e plano do servidor
- POST /api/bot/event — regista evento criado pelo bot
- PUT /api/bot/event/:id — atualiza status do evento
- POST /api/bot/split — regista split concluído
- GET /api/bot/players/:serverId — lista jogadores do servidor
- Autenticação via API Key secreta partilhada com o bot

## Design
- Tema escuro (dark mode) com cores inspiradas no Discord (#5865F2 como accent)
- Sidebar fixa com navegação, responsiva (colapsável em mobile)
- Componentes: cards com bordas subtis, badges coloridas por status, tabelas com paginação, modais para criação/edição
- Micro-animações com Framer Motion nas transições de página e nos cards
- Toasts para feedback de ações (shadcn/ui Toaster)
- Skeleton loaders durante carregamento de dados

## Modelos de dados adicionais (além dos do bot)
- Plan { id, name, maxEvents, maxPlayers, maxGames, priceMonthly, stripePriceId }
- Subscription { serverId, planId, stripeSubId, status, currentPeriodEnd }
- Invoice { id, serverId, amount, paidAt, stripeInvoiceId }
- AuditLog { id, serverId, userId, action, metadata, createdAt }