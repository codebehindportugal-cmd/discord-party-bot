require('dotenv').config();
const { ChannelType, Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const { sendPanel } = require('../src/interactions/panel');

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    console.log(`Bot ligado como ${client.user.tag}`);

    for (const guild of client.guilds.cache.values()) {
      let panelChannel = guild.channels.cache.find(
        c => c.name === 'mordsfocas' && c.type === ChannelType.GuildText
      );

      if (!panelChannel && guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        panelChannel = await guild.channels.create({
          name: 'mordsfocas',
          type: ChannelType.GuildText,
          reason: 'Canal de painel do MordsFocas',
        }).catch(() => null);
      }

      const fallbackChannel = guild.systemChannel || guild.channels.cache.find(
        c => c.isTextBased() && c.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
      );

      const targetChannel = panelChannel || fallbackChannel;
      if (!targetChannel) {
        console.log(`${guild.name}: sem canal com permissao para enviar mensagem`);
        continue;
      }

      await sendPanel(targetChannel);
      console.log(`${guild.name}: painel publicado em #${targetChannel.name}`);
    }

    client.destroy();
  });

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
