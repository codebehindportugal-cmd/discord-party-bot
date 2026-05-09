# Party Loot Site

Site de gestão para o Discord Party Loot Bot.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth com conta local por email/password
- Stripe para subscrições
- Recharts para gráficos

## Arranque

```bash
cd site
npm install
cp .env.example .env
npm run dev
```

Depois abre `http://localhost:3000`.

## Login

O site usa contas locais por email/password. A primeira conta criada recebe role `ADMIN`.

Para restringir o super-admin a emails específicos, coloca no `site/.env`:

```env
SUPER_ADMIN_EMAILS=admin@example.com
```

## Integração com o bot

Define o mesmo segredo nos dois lados:

```env
# bot/.env
SITE_API_URL=http://localhost:3000/api
SITE_API_KEY=um_segredo_forte

# site/.env
BOT_API_KEY=um_segredo_forte
```

Endpoints disponíveis:

- `GET /api/bot/server/:discordId`
- `POST /api/bot/event`
- `PUT /api/bot/event/:id`
- `POST /api/bot/split`
- `GET /api/bot/players/:serverId`

Todos usam o header:

```http
x-api-key: um_segredo_forte
```

## Super-admin

O painel `/admin` permite:

- Dar acesso `FREE`, `PRO` ou `PREMIUM` a um servidor Discord.
- Criar jogos globais disponíveis para os servidores.
- Criar classes globais por jogo.

Quando `DATABASE_URL` estiver ligado a PostgreSQL, os endpoints `/api/admin/games`, `/api/admin/classes` e `/api/admin/subscriptions` persistem estes dados via Prisma.

## Próximos passos de produção

- Trocar as listas mockadas do dashboard por queries Prisma reais.
- Trocar as listas mockadas do dashboard por queries Prisma reais.
- Implementar Stripe Checkout, Customer Portal e validação do webhook.
- Fazer o bot chamar `SITE_API_URL` para sincronizar eventos e splits.
