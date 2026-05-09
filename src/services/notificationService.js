const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embeds');

/**
 * Envia DM a todos os jogadores registados num jogo
 * Com delay para evitar rate limit do Discord
 */
async function notifyPlayers(client, players, embed, delayMs = 500) {
  const results = { sent: 0, failed: 0 };

  for (const player of players) {
    try {
      await delay(delayMs);
      const user = await client.users.fetch(player.discordId);
      await user.send({ embeds: [embed] });
      results.sent++;
    } catch (err) {
      results.failed++;
      console.warn(`⚠️ Não foi possível enviar DM para ${player.discordId}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Notifica sobre novo evento criado
 */
async function notifyNewEvent(client, players, event, game, server) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`📢 Novo Evento — ${event.name}`)
    .setDescription(`Um novo evento de **${game.name}** foi criado no servidor!`)
    .addFields(
      { name: '📅 Data', value: `<t:${Math.floor(new Date(event.scheduledAt).getTime() / 1000)}:F>`, inline: true },
      { name: '👥 Vagas', value: `${event.maxSlots}`, inline: true },
      { name: '💰 Loot', value: event.lootType === 'TIME_BASED' ? '⏱️ Por Tempo de Voz' : '⚖️ Divisão Igual', inline: true },
    )
    .setFooter({ text: `Usa /entrar-evento ${event.id} para te inscrever` })
    .setTimestamp();

  if (game.imageUrl) embed.setThumbnail(game.imageUrl);

  return notifyPlayers(client, players, embed);
}

/**
 * Notifica evento a iniciar
 */
async function notifyEventStarting(client, participants, event, voiceChannel) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.voice)
    .setTitle(`🎙️ Evento a Começar — ${event.name}`)
    .setDescription(`O evento está prestes a começar! Junta-te ao canal de voz.`)
    .addFields(
      { name: '🔊 Canal de Voz', value: voiceChannel ? `<#${voiceChannel.id}>` : 'Verificar no servidor', inline: true },
    )
    .setFooter({ text: 'O tempo começa a contar quando entras no voice!' })
    .setTimestamp();

  return notifyPlayers(client, participants.map(p => p.player), embed, 300);
}

/**
 * Notifica split individual após evento
 */
async function notifyPlayerSplit(client, split, event, server) {
  try {
    const user = await client.users.fetch(split.discordId);
    const h = Math.floor(split.minutes / 60);
    const m = Math.round(split.minutes % 60);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(`💰 Os teus Ganhos — ${event.name}`)
      .setDescription(`O evento terminou! Aqui está o teu resultado:`)
      .addFields(
        { name: '⏱️ Tempo em Voz', value: timeStr, inline: true },
        { name: '📊 Participação', value: `${split.percentage.toFixed(1)}%`, inline: true },
        { name: '💰 Ganhos', value: `**${split.amount.toFixed(0)} ${server.currencySymbol}**`, inline: true },
      )
      .setTimestamp();

    await user.send({ embeds: [embed] });
  } catch (err) {
    console.warn(`⚠️ Erro ao enviar split para ${split.discordId}: ${err.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  notifyPlayers,
  notifyNewEvent,
  notifyEventStarting,
  notifyPlayerSplit,
};
