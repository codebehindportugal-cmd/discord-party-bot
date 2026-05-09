const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/embeds');

const LABELS = {
  antispam: 'Anti-spam',
  albion: 'Albion Online',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modulos')
    .setDescription('Mostra os módulos ligados pelo site para este servidor'),

  async execute(interaction, client) {
    const server = await client.prisma.server.findUnique({
      where: { discordId: interaction.guild.id },
      include: { features: true },
    });

    const features = server?.features || [];
    const rows = ['antispam', 'albion'].map((key) => {
      const feature = features.find((item) => item.key === key);
      return `${feature?.enabled ? 'Ativo' : 'Inativo'} - ${LABELS[key]}`;
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle('Módulos deste servidor')
      .setDescription(rows.join('\n'))
      .setFooter({ text: 'Os módulos são geridos no site em /admin.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
