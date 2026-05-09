const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, warningEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('entrar-evento')
    .setDescription('Inscreve-te num evento')
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'OPEN' },
      include: { game: true },
      take: 25,
    });
    await interaction.respond(
      events.map(e => ({ name: `${e.game.emoji} ${e.name} — ${new Date(e.scheduledAt).toLocaleDateString('pt-PT')}`, value: e.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id, status: 'OPEN' },
      include: {
        game: true,
        participants: true,
        _count: { select: { participants: true } },
      },
    });

    if (!event) {
      return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Evento não existe ou não está aberto.')] });
    }

    if (event._count.participants >= event.maxSlots) {
      return interaction.editReply({ embeds: [warningEmbed('Evento Cheio', 'Não há vagas disponíveis neste evento.')] });
    }

    // Encontrar o player registado neste jogo
    const player = await prisma.player.findFirst({
      where: { discordId: interaction.user.id, serverId: server.id, gameId: event.gameId },
    });

    if (!player) {
      return interaction.editReply({
        embeds: [errorEmbed('Não Registado', `Não estás registado em **${event.game.name}**.\nUsa \`/registar\` primeiro.`)],
      });
    }

    // Verificar se já está inscrito
    const existing = await prisma.eventParticipant.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
    });

    if (existing) {
      if (existing.status === 'CONFIRMED') {
        return interaction.editReply({ embeds: [warningEmbed('Já Inscrito', 'Já estás inscrito neste evento!')] });
      }
      await prisma.eventParticipant.update({
        where: { eventId_playerId: { eventId, playerId: player.id } },
        data: { status: 'CONFIRMED' },
      });
    } else {
      await prisma.eventParticipant.create({
        data: { eventId, playerId: player.id, status: 'CONFIRMED' },
      });
    }

    const totalNow = event._count.participants + 1;

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Inscrição Confirmada!',
          `Estás inscrito em **${event.game.emoji} ${event.name}**!\n📅 ${new Date(event.scheduledAt).toLocaleString('pt-PT')}\n👥 Vagas: ${totalNow}/${event.maxSlots}`
        )
      ],
    });
  },
};
