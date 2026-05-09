const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/embeds');
const BOT_LOGO_URL = process.env.BOT_LOGO_URL || null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comandos')
    .setDescription('Mostra os comandos principais do bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle('Comandos do MordsFocas')
      .setDescription('Podes usar estes comandos ou o painel com botões.')
      .addFields(
        { name: 'Jogadores', value: '`/registar` - escolher jogo e classe\n`/perfil` - ver estatísticas' },
        { name: 'Eventos', value: '`/criar-evento`, `/listar-eventos`, `/entrar-evento`, `/iniciar-evento`, `/encerrar-evento`, `/ver-tempo`' },
        { name: 'Loot', value: '`/adicionar-loot`, `/calcular-split`, `/confirmar-split`' },
        { name: 'Admin', value: '`/painel`, `/config-canal`, `/adicionar-jogo`, `/adicionar-classe`, `/stats-servidor`, `/modulos`' },
        { name: 'Ajuda', value: '`/faq`, `/explicacoes`, `/comandos`' },
        { name: 'Módulos extra', value: '`/albion jogador`, `/albion guilda`, `/albion mortes`, `/albion kills`, `/albion batalha`' },
      )
      .setTimestamp();

    if (BOT_LOGO_URL) embed.setThumbnail(BOT_LOGO_URL);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
