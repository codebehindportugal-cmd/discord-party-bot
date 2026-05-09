const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/permissions');
const { COLORS, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats-servidor')
    .setDescription('Mostra estatísticas gerais do servidor'),

  async execute(interaction, client) {
    const prisma = client.prisma;
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }

    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Erro', 'Servidor não configurado.')] });

    const [playerCount, gameCount, eventCount, completedEvents, totalSplits] = await Promise.all([
      prisma.player.count({ where: { serverId: server.id } }),
      prisma.game.count({ where: { serverId: server.id } }),
      prisma.event.count({ where: { serverId: server.id } }),
      prisma.event.count({ where: { serverId: server.id, status: 'COMPLETED' } }),
      prisma.lootSplit.aggregate({
        where: { event: { serverId: server.id }, confirmed: true },
        _sum: { amount: true },
      }),
    ]);

    const topPlayers = await prisma.player.findMany({
      where: { serverId: server.id },
      orderBy: { totalEarnings: 'desc' },
      take: 3,
      include: { game: true, class: true },
    });

    const planEmoji = { FREE: '🆓', PRO: '⭐', PREMIUM: '👑' };
    const totalGold = totalSplits._sum.amount || 0;

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`📊 Estatísticas — ${interaction.guild.name}`)
      .addFields(
        { name: '📦 Plano', value: `${planEmoji[server.plan]} **${server.plan}**`, inline: true },
        { name: '👥 Jogadores', value: `**${playerCount}**`, inline: true },
        { name: '🎮 Jogos', value: `**${gameCount}**`, inline: true },
        { name: '⚔️ Eventos Totais', value: `**${eventCount}**`, inline: true },
        { name: '✅ Eventos Completos', value: `**${completedEvents}**`, inline: true },
        { name: '💰 Gold Distribuído', value: `**${totalGold.toFixed(0)} ${server.currencySymbol}**`, inline: true },
      );

    if (topPlayers.length > 0) {
      const topStr = topPlayers
        .map((p, i) => `${['🥇', '🥈', '🥉'][i]} <@${p.discordId}> — **${p.totalEarnings.toFixed(0)} ${server.currencySymbol}**`)
        .join('\n');
      embed.addFields({ name: '🏆 Top Jogadores', value: topStr });
    }

    embed.setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
