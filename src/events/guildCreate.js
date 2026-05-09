const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { sendPanel } = require('../interactions/panel');

const DEFAULT_LANGUAGE = (process.env.DEFAULT_LANGUAGE || 'pt').toUpperCase();

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    const prisma = client.prisma;

    console.log(`Bot adicionado ao servidor: ${guild.name} (${guild.id})`);

    await prisma.server.upsert({
      where: { discordId: guild.id },
      update: { name: guild.name },
      create: {
        discordId: guild.id,
        name: guild.name,
        plan: 'FREE',
        language: DEFAULT_LANGUAGE,
      },
    });

    let panelChannel = guild.channels.cache.find(
      c => c.name === 'party-loot-bot' && c.type === ChannelType.GuildText
    );

    if (!panelChannel && guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      panelChannel = await guild.channels.create({
        name: 'party-loot-bot',
        type: ChannelType.GuildText,
        reason: 'Canal de painel do Party Loot Bot',
      }).catch(() => null);
    }

    const fallbackChannel = guild.systemChannel || guild.channels.cache.find(
      c => c.isTextBased() && c.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    const targetChannel = panelChannel || fallbackChannel;
    if (!targetChannel) return;

    await sendPanel(targetChannel).catch(() => {});
  },
};
