const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed, COLORS } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Mostra o perfil de um jogador')
    .addUserOption(opt =>
      opt.setName('jogador').setDescription('Jogador (deixa vazio para ver o teu)').setRequired(false)
    ),

  async execute(interaction, client) {
    const prisma = client.prisma;
    const target = interaction.options.getUser('jogador') || interaction.user;

    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Erro', 'Servidor não configurado.')] });

    const players = await prisma.player.findMany({
      where: { discordId: target.id, serverId: server.id },
      include: { game: true, class: true },
    });

    if (players.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed('Não Registado', `<@${target.id}> não está registado neste servidor.\nUsa \`/registar\` para começar!`)],
      });
    }

    const totalEarnings = players.reduce((acc, p) => acc + p.totalEarnings, 0);
    const totalMinutes = players.reduce((acc, p) => acc + p.totalMinutes, 0);
    const totalEvents = players.reduce((acc, p) => acc + p.eventsCount, 0);

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`👤 Perfil — ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Ganhos Totais', value: `**${totalEarnings.toFixed(0)} ${server.currencySymbol}**`, inline: true },
        { name: '⚔️ Eventos', value: `**${totalEvents}**`, inline: true },
        { name: '⏱️ Tempo em Raids', value: `**${h}h ${m}m**`, inline: true },
      );

    for (const p of players) {
      embed.addFields({
        name: `${p.game.emoji} ${p.game.name}`,
        value: `Classe: ${p.class?.emoji || ''} **${p.class?.name || 'Sem classe'}** (${p.class?.role || '-'})\nGanhos: **${p.totalEarnings.toFixed(0)} ${server.currencySymbol}**`,
        inline: true,
      });
    }

    embed.setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
