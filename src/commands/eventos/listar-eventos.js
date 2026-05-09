const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listar-eventos')
    .setDescription('Lista todos os eventos ativos')
    .addStringOption(opt =>
      opt.setName('status').setDescription('Filtrar por status').setRequired(false)
        .addChoices(
          { name: '🟢 Abertos', value: 'OPEN' },
          { name: '🔴 Em Progresso', value: 'IN_PROGRESS' },
          { name: '✅ Todos', value: 'ALL' },
        )
    ),

  async execute(interaction, client) {
    const prisma = client.prisma;
    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Erro', 'Servidor não configurado.')] });

    const statusFilter = interaction.options.getString('status') || 'OPEN';
    const whereStatus = statusFilter === 'ALL'
      ? { in: ['OPEN', 'IN_PROGRESS'] }
      : statusFilter;

    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: whereStatus },
      include: {
        game: true,
        _count: { select: { participants: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    if (events.length === 0) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle('📋 Sem Eventos')
          .setDescription('Não há eventos ativos de momento.\nUsa `/criar-evento` para criar um!')
          .setTimestamp()],
      });
    }

    const statusEmoji = { OPEN: '🟢', IN_PROGRESS: '🔴', CALCULATING: '🟡', COMPLETED: '✅', CANCELLED: '❌' };

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle('📋 Eventos Ativos');

    for (const e of events) {
      const vagas = `${e._count.participants}/${e.maxSlots}`;
      const timestamp = `<t:${Math.floor(new Date(e.scheduledAt).getTime() / 1000)}:R>`;
      embed.addFields({
        name: `${statusEmoji[e.status]} ${e.game.emoji} ${e.name}`,
        value: `📅 ${timestamp} | 👥 ${vagas} vagas | ID: \`${e.id}\``,
      });
    }

    embed.setFooter({ text: 'Usa /entrar-evento [id] para te inscrever' }).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
