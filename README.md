# ⚔️ Party Loot Bot

Bot Discord para gestão de party loots com **divisão automática por tempo no voice chat**.

## ✨ Funcionalidades

- 🎙️ **Tracking de Voice** — Regista automaticamente o tempo de cada jogador no canal de voz
- ⏱️ **Split por Tempo** — Divide o loot proporcionalmente ao tempo em raid
- 🔄 **Tolerância a Crashes** — Reconexões em menos de 5 minutos não penalizam o jogador
- ⏸️ **Pausa/Retoma** — Controla o tracking durante pausas da raid
- 📢 **Notificações por DM** — Avisa todos os jogadores sobre novos eventos e ganhos
- 🎮 **Multi-jogo** — Suporta múltiplos jogos com classes diferentes
- 📊 **Planos de Subscrição** — Free / Pro / Premium com limites diferentes

## 🚀 Setup

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL

### 2. Instalação

```bash
git clone <repo>
cd discord-party-bot
npm install
```

### 3. Configuração

```bash
cp .env.example .env
```

Edita o `.env`:
```env
DISCORD_TOKEN=token_do_teu_bot
DISCORD_CLIENT_ID=id_da_tua_aplicação
DATABASE_URL=postgresql://user:pass@localhost:5432/partybot
```

### 4. Base de Dados

```bash
npm run db:generate
npm run db:push
```

### 5. Deploy dos Comandos

```bash
npm run deploy-commands
```

### 6. Iniciar

```bash
npm start
# ou em desenvolvimento:
npm run dev
```

## ⚙️ Configuração no Discord

Após adicionar o bot ao servidor:

```
/config-canal tipo:Anúncios canal:#anuncios
/config-canal tipo:Eventos canal:#eventos
/config-canal tipo:Logs canal:#logs

/adicionar-jogo nome:World of Warcraft emoji:⚔️
/adicionar-classe jogo:WoW nome:Warrior role:Tank emoji:🛡️
/adicionar-classe jogo:WoW nome:Priest role:Heal emoji:💚
/adicionar-classe jogo:WoW nome:Mage role:DPS emoji:🔮
```

## 📋 Fluxo Completo de um Evento

```
1. /criar-evento nome:"Molten Core" jogo:WoW data:"25/12/2024 21:00" vagas:20
   → Bot anuncia no canal e envia DM a todos os jogadores do jogo

2. Jogadores: /entrar-evento [id]
   → Confirmam presença

3. Admin: /iniciar-evento [id]
   → Canal de voz criado automaticamente
   → Tracking de tempo começa

4. [Durante o evento]
   /ver-tempo [id]          → Ver tempo em tempo real
   /pausar-tracking [id]    → Pausar durante break
   /retomar-tracking [id]   → Retomar após break
   /ajustar-tempo [id] @user 15 → Corrigir crash (+15 min)

5. Admin: /encerrar-evento [id]
   → Canal de voz removido
   → Tempos congelados

6. Admin: /adicionar-loot evento_id:[id] valor:50000
   → Regista o loot obtido

7. Admin: /calcular-split evento_id:[id]
   → Preview da divisão por tempo

8. Admin: /confirmar-split evento_id:[id]
   → Publica resultado no canal
   → Envia DM individual a cada jogador
```

## 🔧 Comandos Completos

### Jogadores
| Comando | Descrição |
|---------|-----------|
| `/registar` | Regista-te com jogo e classe |
| `/perfil [@user]` | Ver estatísticas de um jogador |

### Eventos
| Comando | Descrição |
|---------|-----------|
| `/criar-evento` | Criar novo evento (Admin) |
| `/iniciar-evento` | Iniciar evento e criar voice (Admin) |
| `/encerrar-evento` | Encerrar evento (Admin) |
| `/entrar-evento` | Inscrever-se num evento |
| `/listar-eventos` | Ver eventos ativos |
| `/ver-tempo` | Ver tracking ao vivo |
| `/pausar-tracking` | Pausar registo de tempo (Admin) |
| `/retomar-tracking` | Retomar registo de tempo (Admin) |
| `/ajustar-tempo` | Corrigir tempo manualmente (Admin) |

### Loot
| Comando | Descrição |
|---------|-----------|
| `/adicionar-loot` | Adicionar gold/item (Admin) |
| `/calcular-split` | Preview da divisão (Admin) |
| `/confirmar-split` | Finalizar e enviar DMs (Admin) |

### Admin
| Comando | Descrição |
|---------|-----------|
| `/config-canal` | Configurar canais |
| `/adicionar-jogo` | Adicionar jogo |
| `/adicionar-classe` | Adicionar classe |
| `/stats-servidor` | Estatísticas gerais |

## 📦 Planos

| Funcionalidade | FREE | PRO | PREMIUM |
|----------------|------|-----|---------|
| Jogadores | 5 | 20 | ∞ |
| Eventos ativos | 1 | ∞ | ∞ |
| Jogos | 1 | 2 | ∞ |
| Tracking de voz | ✅ | ✅ | ✅ |
| Bónus de role | ❌ | ✅ | ✅ |
| Estatísticas | ❌ | ❌ | ✅ |

## 🏗️ Estrutura

```
src/
├── commands/
│   ├── admin/          # Comandos de administração
│   ├── eventos/        # Gestão de eventos
│   ├── jogadores/      # Perfil e registo
│   └── loot/           # Loot e split
├── events/             # Eventos Discord (ready, voice, etc.)
├── services/
│   ├── voiceTracker.js    # Tracking de tempo em voz
│   ├── splitCalculator.js # Cálculo de divisão
│   └── notificationService.js # DMs
└── utils/
    ├── embeds.js       # Embeds padronizados
    └── permissions.js  # Verificação de planos
```
