const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { COLORS, successEmbed, errorEmbed, warningEmbed } = require('../utils/embeds');
const { isAdmin } = require('../utils/permissions');

function groupSlots(slots) {
  return slots.reduce((groups, slot) => {
    groups[slot.party] = groups[slot.party] || [];
    groups[slot.party].push(slot);
    return groups;
  }, {});
}

function formatDate(date) {
  return new Date(date).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function remainingText(date) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'já começou';
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return `${days}d ${hours}h ${mins}m`;
}

function legacyEventEmbed(event) {
  const status = event.status === 'CANCELLED'
    ? { label: 'Cancelado', color: COLORS.error }
    : event.status === 'CALCULATING' || event.status === 'COMPLETED'
      ? { label: 'Terminado', color: COLORS.error }
      : event.status === 'IN_PROGRESS'
        ? { label: 'Ativo', color: COLORS.warning }
        : { label: 'Preparado', color: COLORS.success };

  const embed = new EmbedBuilder()
    .setColor(status.color)
    .setTitle(`${event.game?.emoji || '🎮'} ${event.name} - ${event.game?.name || 'Evento'}`)
    .setDescription([
      `**Status:** ${status.label}`,
      `🕒 Início: \`${formatDate(event.scheduledAt)}\``,
      `⏳ Tempo restante: \`${remainingText(event.scheduledAt)}\``,
      event.description ? `📝 ${event.description}` : null,
      event.voiceChannelId ? `🎧 Canal de voz: <#${event.voiceChannelId}>` : '🎧 Canal de voz: sem canal de voz',
    ].filter(Boolean).join('\n'));

  const grouped = groupSlots(event.slots || []);
  for (const [party, slots] of Object.entries(grouped)) {
    const lines = ['`#` | Função | Estado'];
    for (const slot of slots.sort((a, b) => a.position - b.position)) {
      lines.push(`\`${slot.position}\` | ${slot.label} | ${slot.player ? `❌ <@${slot.player.discordId}>` : '🟢'}`);
    }
    embed.addFields({ name: `Party: ${party}`, value: lines.join('\n').slice(0, 1024), inline: true });
  }

  if (!event.slots?.length) {
    embed.addFields({ name: 'Slots', value: 'Sem classes configuradas para este jogo.', inline: false });
  }

  embed.setFooter({ text: `ID: ${event.id}` }).setTimestamp();
  return embed;
}

function legacyEventComponents(event) {
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`plb:event_join:${event.id}`).setLabel('Participar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`plb:event_leave:${event.id}`).setLabel('Sair do Evento').setStyle(ButtonStyle.Danger),
    ),
  ];

  if (event.status === 'OPEN') {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`plb:event_cancel:${event.id}`).setLabel('Cancelar Evento').setStyle(ButtonStyle.Secondary),
    ));
  }

  if (event.status === 'IN_PROGRESS') {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`plb:event_close:${event.id}`).setLabel('Encerrar Evento').setStyle(ButtonStyle.Danger),
    ));
  }

  return rows;
}

async function createSlotsFromClasses(prisma, eventId, gameId) {
  const classes = await prisma.class.findMany({
    where: { gameId },
    orderBy: [{ party: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  const counters = {};
  for (const classRow of classes) {
    const party = classRow.party || 'Team';
    counters[party] = counters[party] || 0;
    counters[party] += 1;
    await prisma.eventSlot.create({
      data: {
        eventId,
        party,
        position: classRow.position || counters[party],
        label: classRow.name,
      },
    });
  }
}

async function getEvent(prisma, eventId, guildId) {
  return prisma.event.findFirst({
    where: { id: eventId, server: { discordId: guildId } },
    include: {
      game: true,
      server: true,
      slots: { include: { player: true }, orderBy: [{ party: 'asc' }, { position: 'asc' }] },
    },
  });
}

async function updateEventMessage(client, guild, eventId) {
  const event = await getEvent(client.prisma, eventId, guild.id);
  if (!event?.server?.eventsChanId || !event.announceMessageId) return event;

  const channel = guild.channels.cache.get(event.server.eventsChanId);
  if (!channel) return event;

  const message = await channel.messages.fetch(event.announceMessageId).catch(() => null);
  if (!message) return event;

  await message.edit({ embeds: [legacyEventEmbed(event)], components: legacyEventComponents(event) }).catch(() => {});
  return event;
}

async function publishLegacyEvent(client, guild, eventId) {
  const event = await getEvent(client.prisma, eventId, guild.id);
  if (!event) return null;

  const channelId = event.server.eventsChanId || event.server.announceChanId;
  const channel = channelId ? guild.channels.cache.get(channelId) : null;
  if (!channel) return null;

  const message = await channel.send({
    embeds: [legacyEventEmbed(event)],
    components: legacyEventComponents(event),
  });

  await client.prisma.event.update({ where: { id: event.id }, data: { announceMessageId: message.id } });
  return message;
}

async function showPartySelect(interaction, client, eventId) {
  const event = await getEvent(client.prisma, eventId, interaction.guild.id);
  if (!event || event.status !== 'OPEN') {
    return interaction.reply({ embeds: [errorEmbed('Evento indisponível', 'Este evento não está aberto para inscrições.')], ephemeral: true });
  }

  const parties = [...new Set(event.slots.map((slot) => slot.party))].slice(0, 25);
  if (!parties.length) {
    return interaction.reply({ embeds: [warningEmbed('Sem slots', 'Este evento não tem classes configuradas.')], ephemeral: true });
  }

  return interaction.reply({
    content: 'Escolhe a party:',
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`plb:event_party:${event.id}`)
          .setPlaceholder('Escolhe a party')
          .addOptions(parties.map((party) => ({ label: party.slice(0, 100), value: party }))),
      ),
    ],
    ephemeral: true,
  });
}

async function showSlotSelect(interaction, client, eventId, party) {
  const event = await getEvent(client.prisma, eventId, interaction.guild.id);
  if (!event || event.status !== 'OPEN') {
    return interaction.update({ content: 'Este evento já não está aberto.', components: [] });
  }

  const slots = event.slots.filter((slot) => slot.party === party).slice(0, 25);
  return interaction.update({
    content: `Escolhe função na ${party}:`,
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`plb:event_slot:${event.id}`)
          .setPlaceholder(`Escolhe função na ${party}`)
          .addOptions(slots.map((slot) => ({
            label: `${slot.position}. ${slot.label} ${slot.player ? '(ocupado)' : '(livre)'}`.slice(0, 100),
            value: slot.id,
          }))),
      ),
    ],
  });
}

async function joinSlot(interaction, client, eventId, slotId) {
  const prisma = client.prisma;
  const event = await getEvent(prisma, eventId, interaction.guild.id);
  const slot = event?.slots.find((item) => item.id === slotId);
  if (!event || !slot || event.status !== 'OPEN') {
    return interaction.update({ content: 'Este slot já não está disponível.', components: [] });
  }
  if (slot.playerId) {
    return interaction.update({ content: 'Esse slot já está ocupado. Escolhe outro.', components: [] });
  }

  const player = await prisma.player.upsert({
    where: {
      discordId_serverId_gameId: {
        discordId: interaction.user.id,
        serverId: event.serverId,
        gameId: event.gameId,
      },
    },
    update: { username: interaction.user.username },
    create: {
      discordId: interaction.user.id,
      username: interaction.user.username,
      serverId: event.serverId,
      gameId: event.gameId,
    },
  });

  await prisma.eventSlot.updateMany({
    where: { eventId: event.id, player: { discordId: interaction.user.id } },
    data: { playerId: null },
  });

  await prisma.eventSlot.update({ where: { id: slot.id }, data: { playerId: player.id } });
  await prisma.eventParticipant.upsert({
    where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
    create: { eventId: event.id, playerId: player.id, status: 'CONFIRMED' },
    update: { status: 'CONFIRMED' },
  });

  await updateEventMessage(client, interaction.guild, event.id);
  return interaction.update({ content: `Inscrição confirmada: ${slot.party} - ${slot.position}. ${slot.label}`, components: [] });
}

async function leaveEvent(interaction, client, eventId) {
  const prisma = client.prisma;
  const event = await getEvent(prisma, eventId, interaction.guild.id);
  if (!event || event.status !== 'OPEN') {
    return interaction.reply({ embeds: [errorEmbed('Evento indisponível', 'Já não podes sair deste evento.')], ephemeral: true });
  }

  const slot = event.slots.find((item) => item.player?.discordId === interaction.user.id);
  if (!slot) {
    return interaction.reply({ embeds: [warningEmbed('Sem inscrição', 'Não estavas inscrito neste evento.')], ephemeral: true });
  }

  await prisma.eventSlot.update({ where: { id: slot.id }, data: { playerId: null } });
  if (slot.playerId) {
    await prisma.eventParticipant.updateMany({ where: { eventId: event.id, playerId: slot.playerId }, data: { status: 'LEFT' } });
  }

  await updateEventMessage(client, interaction.guild, event.id);
  return interaction.reply({ embeds: [successEmbed('Saíste do evento', `Slot libertado: ${slot.party} - ${slot.position}. ${slot.label}`)], ephemeral: true });
}

async function cancelEvent(interaction, client, eventId) {
  const event = await getEvent(client.prisma, eventId, interaction.guild.id);
  if (!event) return interaction.reply({ embeds: [errorEmbed('Evento não encontrado', 'Não encontrei esse evento.')], ephemeral: true });
  if (event.createdBy !== interaction.user.id && !isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas o criador ou um admin pode cancelar.')], ephemeral: true });
  }

  await client.prisma.event.update({ where: { id: event.id }, data: { status: 'CANCELLED' } });
  await updateEventMessage(client, interaction.guild, event.id);
  return interaction.reply({ embeds: [successEmbed('Evento cancelado', `**${event.name}** foi cancelado.`)], ephemeral: true });
}

module.exports = {
  createSlotsFromClasses,
  getEvent,
  legacyEventEmbed,
  legacyEventComponents,
  publishLegacyEvent,
  updateEventMessage,
  showPartySelect,
  showSlotSelect,
  joinSlot,
  leaveEvent,
  cancelEvent,
};
