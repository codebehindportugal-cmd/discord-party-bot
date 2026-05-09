const { SlashCommandBuilder } = require('discord.js');
const { showPartySelect } = require('../../services/eventPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('entrar-evento')
    .setDescription('Escolhe uma party e um slot para entrares num evento')
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const server = await client.prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);

    const events = await client.prisma.event.findMany({
      where: { serverId: server.id, status: 'OPEN' },
      include: { game: true },
      orderBy: { scheduledAt: 'asc' },
      take: 25,
    });

    return interaction.respond(
      events.map((event) => ({
        name: `${event.game.emoji} ${event.name} - ${new Date(event.scheduledAt).toLocaleDateString('pt-PT')}`,
        value: event.id,
      }))
    );
  },

  async execute(interaction, client) {
    return showPartySelect(interaction, client, interaction.options.getString('id'));
  },
};
