const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');
const { freezeEventTimes, clearEvent } = require('../../services/voiceTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('encerrar-evento')
    .setDescription('Encerra o evento, congela os tempos e prepara o split')
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'IN_PROGRESS' },
      include: { game: true },
      take: 25,
    });
    await interaction.respond(
      events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissão', 'Apenas administradores podem encerrar eventos.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id, status: 'IN_PROGRESS' },
    });

    if (!event) {
      return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Nenhum evento em progresso com esse ID.')] });
    }

    // ─── Congelar tempos ──────────────────────────────────────────────────────
    const finalTimes = await freezeEventTimes(client, prisma, eventId);

    // ─── Eliminar canal de voz ────────────────────────────────────────────────
    if (event.voiceChannelId) {
      const voiceChannel = interaction.guild.channels.cache.get(event.voiceChannelId);
      if (voiceChannel) {
        // Mover todos para fora antes de apagar
        for (const [, member] of voiceChannel.members) {
          await member.voice.disconnect().catch(() => {});
        }
        await voiceChannel.delete().catch(() => {});
      }
    }

    // ─── Atualizar status ─────────────────────────────────────────────────────
    await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'CALCULATING',
        endedAt: new Date(),
        voiceChannelId: null,
      },
    });

    // Limpar da memória
    clearEvent(client, eventId);

    const playerCount = finalTimes.length;
    const totalMinutes = finalTimes.reduce((acc, t) => acc + t.totalMinutes, 0);
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Evento Encerrado!',
          `**${event.name}** foi encerrado.\n\n👥 **${playerCount}** jogadores participaram.\n⏱️ Tempo total acumulado: **${h}h ${m}m**\n\nAdiciona o loot com \`/adicionar-loot\` e depois usa \`/calcular-split\` para ver a divisão.`
        )
      ],
    });
  },
};
