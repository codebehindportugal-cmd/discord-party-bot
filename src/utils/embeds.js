const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x57F287,
  error: 0xED4245,
  warning: 0xFEE75C,
  info: 0x5865F2,
  gold: 0xF0A500,
  voice: 0x3BA55D,
};

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function eventEmbed(event, game, participantCount) {
  const statusEmoji = {
    OPEN: '🟢',
    IN_PROGRESS: '🔴',
    CALCULATING: '🟡',
    COMPLETED: '✅',
    CANCELLED: '❌',
  };

  const lootTypeLabel = {
    TIME_BASED: '⏱️ Por Tempo de Voz',
    EQUAL: '⚖️ Divisão Igual',
    LOOT_COUNCIL: '👑 Loot Council',
  };

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`${game.emoji} ${event.name}`)
    .addFields(
      { name: '🎮 Jogo', value: game.name, inline: true },
      { name: '📅 Data', value: `<t:${Math.floor(new Date(event.scheduledAt).getTime() / 1000)}:F>`, inline: true },
      { name: '👥 Vagas', value: `${participantCount}/${event.maxSlots}`, inline: true },
      { name: '💰 Tipo de Loot', value: lootTypeLabel[event.lootType], inline: true },
      { name: '📊 Status', value: `${statusEmoji[event.status]} ${event.status}`, inline: true },
    )
    .setFooter({ text: `ID: ${event.id}` })
    .setTimestamp();

  if (event.description) embed.setDescription(event.description);
  if (game.imageUrl) embed.setThumbnail(game.imageUrl);

  return embed;
}

function splitEmbed(event, splits, server) {
  const totalAmount = splits.reduce((acc, s) => acc + s.amount, 0);
  const totalMinutes = splits.reduce((acc, s) => acc + s.minutes, 0);

  const rows = splits
    .sort((a, b) => b.minutes - a.minutes)
    .map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const hours = Math.floor(s.minutes / 60);
      const mins = Math.round(s.minutes % 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return `${medal} <@${s.player.discordId}> — **${timeStr}** (${s.percentage.toFixed(1)}%) → **${s.amount.toFixed(0)} ${server.currencySymbol}**`;
    })
    .join('\n');

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.round(totalMinutes % 60);

  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`💰 Split Final — ${event.name}`)
    .setDescription(rows)
    .addFields(
      { name: '⏱️ Tempo Total', value: `${totalHours}h ${totalMins}m`, inline: true },
      { name: '💰 Total Distribuído', value: `${totalAmount.toFixed(0)} ${server.currencySymbol}`, inline: true },
      { name: '👥 Jogadores', value: `${splits.length}`, inline: true },
    )
    .setTimestamp();
}

function voiceTimeEmbed(event, sessions) {
  const rows = sessions
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .map((s, i) => {
      const hours = Math.floor(s.totalMinutes / 60);
      const mins = Math.round(s.totalMinutes % 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      const status = s.isActive ? '🟢' : '⚫';
      return `${status} ${i + 1}. <@${s.discordId}> — **${timeStr}**`;
    })
    .join('\n');

  return new EmbedBuilder()
    .setColor(COLORS.voice)
    .setTitle(`⏱️ Tempo em Voz — ${event.name}`)
    .setDescription(rows || '*Nenhum jogador em voz ainda.*')
    .setFooter({ text: '🟢 Em voz agora  ⚫ Saiu' })
    .setTimestamp();
}

module.exports = {
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  eventEmbed,
  splitEmbed,
  voiceTimeEmbed,
  COLORS,
};
