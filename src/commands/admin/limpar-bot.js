const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, warningEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpar-bot')
    .setDescription('Apaga mensagens recentes do MordsFocas no canal atual')
    .addIntegerOption((opt) =>
      opt
        .setName('quantidade')
        .setDescription('Numero de mensagens recentes a verificar')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Sem permissao', 'Apenas administradores podem limpar mensagens do bot.')],
        ephemeral: true,
      });
    }

    const botMember = interaction.guild.members.me;
    const canManageMessages = botMember.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageMessages);
    if (!canManageMessages) {
      return interaction.reply({
        embeds: [errorEmbed('Sem permissao no canal', 'Preciso da permissao "Gerir Mensagens" neste canal.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger('quantidade') || 50;
    const messages = await interaction.channel.messages.fetch({ limit });
    const botMessages = messages.filter((message) => message.author.id === client.user.id);

    if (!botMessages.size) {
      return interaction.editReply({
        embeds: [warningEmbed('Nada para limpar', `Nao encontrei mensagens minhas nas ultimas ${limit} mensagens.`)],
      });
    }

    const deleted = await interaction.channel.bulkDelete(botMessages, true);

    return interaction.editReply({
      embeds: [successEmbed('Mensagens limpas', `Apaguei ${deleted.size} mensagem(ns) do bot neste canal.`)],
    });
  },
};
