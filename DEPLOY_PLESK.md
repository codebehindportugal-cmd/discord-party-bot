# Deploy on Plesk with Git

This repo contains two Node.js apps:

- `discord-party-bot`: the Discord bot at the repository root.
- `party-loot-site`: the Next.js dashboard inside `site/`.

Use the same MySQL database URL for both apps if the bot and site should share data.

## 1. Push the repo to Git

```bash
git add .
git commit -m "Add Plesk deployment notes"
git push origin main
```

## 2. Create the database in Plesk

1. Open **Databases** in Plesk.
2. Create a MySQL database, for example `partybot`.
3. Create or assign a database user.
4. Copy the connection string:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/partybot"
```

If MySQL runs on the same server, `HOST` is often `localhost`.

## 3. Deploy the Next.js site

In Plesk:

1. Open the domain or subdomain for the site, for example `party.example.com`.
2. Open **Git** and clone the repository.
3. Set the deploy branch to `main`.
4. Open **Node.js** and use:

```text
Application root: site
Document root: site/public
Application startup file: server.js
Node.js version: 18 or newer
Application mode: production
```

Set these environment variables in the Plesk Node.js screen:

```env
NODE_ENV=production
NEXTAUTH_URL=https://party.example.com
NEXTAUTH_SECRET=replace_with_a_long_random_secret
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/partybot"
SUPER_ADMIN_EMAILS=admin@example.com
BOT_API_KEY=replace_with_the_same_secret_as_SITE_API_KEY
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_key
STRIPE_PRO_PRICE_ID=price_id
STRIPE_PREMIUM_PRICE_ID=price_id
```

After every Git deploy, run these commands from Plesk **Terminal**:

```bash
cd /var/www/vhosts/YOUR_DOMAIN/httpdocs/site
npm install
npm run db:generate
npm run db:push
npm run build
npm run check:prod
```

Then click **Restart App** in Plesk Node.js.

If the browser shows **403 Forbidden**, Plesk is usually serving the document root directly instead of the Node.js app. Check:

- Node.js is enabled for this domain or subdomain.
- **Application root** is `site`.
- **Document root** is `site/public`.
- **Application startup file** is `server.js`.
- `npm run build` was executed inside `site`.
- The Node.js app was restarted after the build.

## 4. Deploy the Discord bot

The bot is a long-running Node.js process, so it should be configured as a second Node.js app. A clean setup is to use a subdomain such as `bot.example.com`, even if it does not serve web pages.

In Plesk:

1. Open the bot domain or subdomain.
2. Open **Git** and clone the same repository.
3. Open **Node.js** and use:

```text
Application root: /
Document root: /
Application startup file: src/index.js
Node.js version: 18 or newer
Application mode: production
```

Set these environment variables:

```env
NODE_ENV=production
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_discord_application_client_id
PREFIX=!
DEFAULT_LANGUAGE=pt
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/partybot"
SITE_API_URL=https://party.example.com/api
SITE_API_KEY=replace_with_the_same_secret_as_BOT_API_KEY
FREE_MAX_PLAYERS=5
FREE_MAX_EVENTS=1
FREE_MAX_GAMES=1
PRO_MAX_PLAYERS=20
PRO_MAX_EVENTS=999
PRO_MAX_GAMES=2
CRASH_TOLERANCE_MINUTES=5
```

After every Git deploy, run:

```bash
cd /var/www/vhosts/YOUR_BOT_DOMAIN/httpdocs
npm install
npm run db:generate
npm run db:push
npm run deploy-commands
```

Then click **Restart App** in Plesk Node.js.

If `npm run deploy-commands` returns **DiscordAPIError[0]: 401 Unauthorized**, the Discord credentials in Plesk are wrong:

- `DISCORD_TOKEN` must be the bot token from **Discord Developer Portal > Bot > Reset/View Token**.
- Do not include the prefix `Bot `.
- Do not use the Client Secret as the bot token.
- `DISCORD_CLIENT_ID` must be the **Application ID** from the same Discord application.
- After changing variables in Plesk, run `npm run deploy-commands` again.

## 5. Recommended Git deployment actions

If your Plesk Git screen has **Additional deployment actions**, you can paste one of these.

For the site:

```bash
cd site
npm install
npm run db:generate
npm run db:push
npm run build
```

For the bot:

```bash
npm install
npm run db:generate
npm run db:push
npm run deploy-commands
```

Restart the Node.js app after deployment. Some Plesk installs restart automatically, but many require the manual **Restart App** button.

## 6. Quick checks

- Visit the site domain and confirm the login page loads.
- Register the first account; it becomes admin.
- Invite the Discord bot with the required permissions.
- Run `/comandos` or one of the slash commands in Discord.
- Confirm both apps use the same `DATABASE_URL`.
- Confirm `BOT_API_KEY` and `SITE_API_KEY` are exactly the same value.
