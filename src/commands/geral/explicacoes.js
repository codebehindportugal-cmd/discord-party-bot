const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('explicacoes')
    .setDescription('Explica os comandos disponíveis no bot'),

  async execute(interaction, client) {
    const commands = [...client.commands.values()]
      .map((command) => command.data)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle('Explicações dos comandos')
      .setDescription('Lista curta dos comandos registados neste bot.')
      .setTimestamp();

    for (const command of commands.slice(0, 25)) {
      embed.addFields({
        name: `/${command.name}`,
        value: command.description || 'Sem descrição.',
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
