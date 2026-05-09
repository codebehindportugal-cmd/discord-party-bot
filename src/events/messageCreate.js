const { Events, PermissionsBitField } = require('discord.js');
const { getFeatureConfig } = require('../services/features');

const recentMessages = new Map();

function getBucketKey(message) {
  return `${message.guild.id}:${message.author.id}`;
}

function getDuration(config, strikeCount) {
  const durations = Array.isArray(config.muteDurationsSeconds)
    ? config.muteDurationsSeconds
    : [300, 600, 1800, 3600, 14400, 28800, 86400];
  return durations[Math.min(Math.max(strikeCount - 1, 0), durations.length - 1)] || 300;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    const config = await getFeatureConfig(client, message.guild.id, 'antispam').catch(() => ({ enabled: false }));
    if (!config.enabled) return;

    const limit = Number(config.messageLimit || 5);
    const windowSeconds = Number(config.timeWindowSeconds || 10);
    const key = getBucketKey(message);
    const now = Date.now();
    const timestamps = (recentMessages.get(key) || []).filter((timestamp) => now - timestamp <= windowSeconds * 1000);

    timestamps.push(now);
    recentMessages.set(key, timestamps);

    if (timestamps.length < limit) return;
    recentMessages.set(key, []);

    const member = message.member;
    if (!member || member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

    const strike = await client.prisma.antiSpamStrike.upsert({
      where: {
        serverId_discordId: {
          serverId: message.guild.id,
          discordId: message.author.id,
        },
      },
      create: {
        serverId: message.guild.id,
        discordId: message.author.id,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    const durationSeconds = getDuration(config, strike.count);

    await message.delete().catch(() => {});
    await member.timeout(durationSeconds * 1000, 'Spam detetado pelo MordsFocas').catch(() => {});

    const warning = await message.channel.send({
      content: `${message.author}, evita enviar muitas mensagens seguidas. Silenciado por ${Math.round(durationSeconds / 60)} minutos.`,
    }).catch(() => null);

    if (warning) {
      setTimeout(() => warning.delete().catch(() => {}), 8000);
    }

    await client.prisma.auditLog.create({
      data: {
        serverId: message.guild.id,
        userId: message.author.id,
        action: 'ANTISPAM_TIMEOUT',
        metadata: {
          discordGuildId: message.guild.id,
          channelId: message.channel.id,
          strike: strike.count,
          durationSeconds,
        },
      },
    }).catch(() => {});
  },
};
