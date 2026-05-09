# Party Loot Site

Site de gestao para o Discord Party Loot Bot.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma + MySQL
- NextAuth com conta local por email/password
- Stripe para subscricoes
- Recharts para graficos

## Arranque

```bash
cd site
npm install
cp .env.example .env
npm run dev
```

Depois abre `http://localhost:3000`.

## Login

O site usa contas locais por email/password. Contas criadas pelo formulario entram sempre com role `USER`.

Para criar ou atualizar uma conta admin, usa:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='uma_password_forte' npm run seed:admin
```

Para restringir o super-admin a emails especificos, coloca no `site/.env`:

```env
SUPER_ADMIN_EMAILS=admin@example.com
```

Se contas foram promovidas a admin por engano, mantem apenas os emails admin nesta lista:

```bash
ADMIN_EMAILS=admin@example.com npm run demote:users
```

## Integracao com o bot

Define o mesmo segredo nos dois lados:

```env
# bot/.env
SITE_API_URL=http://localhost:3000/api
SITE_API_KEY=um_segredo_forte

# site/.env
BOT_API_KEY=um_segredo_forte
```

Endpoints disponiveis:

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
- Criar jogos globais disponiveis para os servidores.
- Criar classes globais por jogo.

Quando `DATABASE_URL` estiver ligado a MySQL, os endpoints `/api/admin/games`, `/api/admin/classes` e `/api/admin/subscriptions` persistem estes dados via Prisma.

## Proximos passos de producao

- Trocar as listas mockadas do dashboard por queries Prisma reais.
- Implementar Stripe Checkout, Customer Portal e validacao do webhook.
- Fazer o bot chamar `SITE_API_URL` para sincronizar eventos e splits.
