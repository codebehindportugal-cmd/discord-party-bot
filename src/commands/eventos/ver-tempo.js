const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, voiceTimeEmbed } = require('../../utils/embeds');
const { getEventTimes } = require('../../services/voiceTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ver-tempo')
    .setDescription('Mostra o tempo de cada jogador no voice em tempo real')
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: { in: ['IN_PROGRESS', 'CALCULATING'] } },
      include: { game: true },
      take: 25,
    });
    await interaction.respond(
      events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id },
    });

    if (!event) {
      return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Verifica o ID do evento.')] });
    }

    const times = getEventTimes(client, eventId);

    if (times.length === 0 && event.status === 'CALCULATING') {
      // Evento encerrado — buscar do banco de dados
      const sessions = await prisma.voiceSession.findMany({
        where: { eventId },
        include: { player: true },
      });

      const aggregated = {};
      for (const s of sessions) {
        const did = s.player.discordId;
        aggregated[did] = (aggregated[did] || 0) + s.durationMinutes;
      }

      const dbTimes = Object.entries(aggregated).map(([discordId, totalMinutes]) => ({
        discordId,
        totalMinutes,
        isActive: false,
      }));

      return interaction.editReply({ embeds: [voiceTimeEmbed(event, dbTimes)] });
    }

    await interaction.editReply({ embeds: [voiceTimeEmbed(event, times)] });
  },
};
