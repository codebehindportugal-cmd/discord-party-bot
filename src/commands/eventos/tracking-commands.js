const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');
const { pauseTracking, resumeTracking } = require('../../services/voiceTracker');

const ADJUST_REASONS = [
  'Crash/reconnect',
  'Bot reiniciado',
  'Jogador movido manualmente',
  'Correção de pausa',
  'Erro de tracking',
];

function filterTextChoices(values, focused) {
  const text = String(focused || '').toLowerCase();
  return values
    .filter(value => value.toLowerCase().includes(text))
    .slice(0, 25)
    .map(value => ({ name: value, value }));
}

// /pausar-tracking
const pausarTracking = {
  data: new SlashCommandBuilder()
    .setName('pausar-tracking')
    .setDescription('Pausa o registo de tempo (pausa da raid)')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'IN_PROGRESS' },
      include: { game: true }, take: 10,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }
    const eventId = interaction.options.getString('evento_id');
    pauseTracking(client, eventId);
    await interaction.reply({
      embeds: [successEmbed('⏸️ Tracking Pausado', 'O registo de tempo foi pausado. Os jogadores podem sair sem perder tempo acumulado.')],
      ephemeral: true,
    });
  },
};

// /retomar-tracking
const retomarTracking = {
  data: new SlashCommandBuilder()
    .setName('retomar-tracking')
    .setDescription('Retoma o registo de tempo após pausa')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'IN_PROGRESS' },
      include: { game: true }, take: 10,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }
    const eventId = interaction.options.getString('evento_id');
    resumeTracking(client, eventId);
    await interaction.reply({
      embeds: [successEmbed('▶️ Tracking Retomado', 'O registo de tempo foi retomado!')],
      ephemeral: true,
    });
  },
};

// /ajustar-tempo
const ajustarTempo = {
  data: new SlashCommandBuilder()
    .setName('ajustar-tempo')
    .setDescription('Ajusta manualmente o tempo de um jogador (para casos de crash)')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    )
    .addUserOption(opt =>
      opt.setName('jogador').setDescription('Jogador a ajustar').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('minutos').setDescription('Minutos a adicionar (negativo para subtrair)').setRequired(true)
        .addChoices(
          { name: '+5 minutos', value: 5 },
          { name: '+10 minutos', value: 10 },
          { name: '+15 minutos', value: 15 },
          { name: '+30 minutos', value: 30 },
          { name: '-5 minutos', value: -5 },
          { name: '-10 minutos', value: -10 },
          { name: '-15 minutos', value: -15 },
        )
    )
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do ajuste (para log)').setRequired(false).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'motivo') {
      return interaction.respond(filterTextChoices(ADJUST_REASONS, focused.value));
    }

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: { in: ['IN_PROGRESS', 'CALCULATING'] } },
      include: { game: true }, take: 10,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('evento_id');
    const targetUser = interaction.options.getUser('jogador');
    const minutos = interaction.options.getInteger('minutos');
    const motivo = interaction.options.getString('motivo') || 'Ajuste manual';

    // Atualizar na sessão de memória
    const sessions = client.voiceSessions.get(eventId);
    if (sessions && sessions.has(targetUser.id)) {
      const s = sessions.get(targetUser.id);
      sessions.set(targetUser.id, { ...s, totalMinutes: Math.max(0, s.totalMinutes + minutos) });
    }

    // Log da ação
    await prisma.auditLog.create({
      data: {
        serverId: server.id,
        userId: interaction.user.id,
        action: 'ADJUST_TIME',
        metadata: { eventId, targetUserId: targetUser.id, minutes: minutos, motivo },
      },
    });

    const sinal = minutos >= 0 ? '+' : '';
    await interaction.editReply({
      embeds: [
        successEmbed(
          'Tempo Ajustado',
          `Tempo de <@${targetUser.id}> ajustado em **${sinal}${minutos} minutos**.\nMotivo: *${motivo}*`
        )
      ],
    });
  },
};

module.exports = { pausarTracking, retomarTracking, ajustarTempo };
