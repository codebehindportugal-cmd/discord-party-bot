const { SlashCommandBuilder } = require('discord.js');
const { sendPanel } = require('../../interactions/panel');
const { errorEmbed, successEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Publica o painel com botões no canal atual'),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas administradores podem publicar o painel.')], ephemeral: true });
    }

    await sendPanel(interaction.channel);
    await interaction.reply({ embeds: [successEmbed('Painel publicado', 'O painel foi enviado para este canal.')], ephemeral: true });
  },
};
