require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    const guilds = [...client.guilds.cache.values()];
    console.log(`Bot ligado como ${client.user.tag}`);
    console.log(`Servidores encontrados: ${guilds.length}`);

    for (const guild of guilds) {
      const server = await prisma.server.upsert({
        where: { discordId: guild.id },
        update: { name: guild.name },
        create: {
          discordId: guild.id,
          name: guild.name,
          plan: 'FREE',
          language: (process.env.DEFAULT_LANGUAGE || 'pt').toUpperCase(),
        },
      });

      console.log(`${guild.name} | ${guild.id} | ${server.plan}`);
    }

    await prisma.$disconnect();
    client.destroy();
  });

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
