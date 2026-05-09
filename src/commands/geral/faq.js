const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/embeds');
const BOT_LOGO_URL = process.env.BOT_LOGO_URL || null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Mostra perguntas frequentes sobre o bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle('FAQ do MordsFocas')
      .setDescription('Respostas rápidas para os problemas mais comuns.')
      .addFields(
        {
          name: 'Como crio eventos?',
          value: 'Usa `/painel` ou `/criar-evento`. Também podes usar o botão "Criar Evento" no canal do bot.',
        },
        {
          name: 'Como os jogadores entram?',
          value: 'Podem usar `/registar` primeiro e depois `/entrar-evento`, ou os botões/listas do painel.',
        },
        {
          name: 'Como funciona o split?',
          value: 'Depois do evento, adiciona loot com `/adicionar-loot`, calcula com `/calcular-split` e confirma com `/confirmar-split`.',
        },
        {
          name: 'Porque não vejo jogos/classes?',
          value: 'O admin deve criar jogos/classes no site ou pelo painel do bot. Os dados vêm da base de dados do site.',
        },
        {
          name: 'Como ativo Albion ou anti-spam?',
          value: 'Vai ao site em `/admin`, escolhe o servidor e liga os módulos pretendidos.',
        },
      )
      .setTimestamp();

    if (BOT_LOGO_URL) embed.setThumbnail(BOT_LOGO_URL);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
