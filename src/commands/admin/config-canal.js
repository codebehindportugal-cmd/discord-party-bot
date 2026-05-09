const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');

const DEFAULT_LANGUAGE = (process.env.DEFAULT_LANGUAGE || 'pt').toUpperCase();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-canal')
    .setDescription('Configura os canais do bot')
    .addStringOption(opt =>
      opt.setName('tipo').setDescription('Tipo de canal').setRequired(true)
        .addChoices(
          { name: '📢 Anúncios', value: 'announceChanId' },
          { name: '📋 Eventos', value: 'eventsChanId' },
          { name: '📜 Logs', value: 'logsChanId' },
        )
    )
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Canal a configurar').setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addChannelOption(opt =>
      opt.setName('categoria_voz').setDescription('Categoria para criar canais de voz (opcional)').setRequired(false)
        .addChannelTypes(ChannelType.GuildCategory)
    ),

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissão', 'Apenas administradores podem configurar o bot.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const tipo = interaction.options.getString('tipo');
    const canal = interaction.options.getChannel('canal');
    const categoriaVoz = interaction.options.getChannel('categoria_voz');

    const updateData = { [tipo]: canal.id };
    if (categoriaVoz) updateData.voiceCategoryId = categoriaVoz.id;

    await prisma.server.upsert({
      where: { discordId: interaction.guildId },
      update: updateData,
      create: {
        discordId: interaction.guildId,
        name: interaction.guild.name,
        language: DEFAULT_LANGUAGE,
        ...updateData,
      },
    });

    const tipoLabel = {
      announceChanId: '📢 Anúncios',
      eventsChanId: '📋 Eventos',
      logsChanId: '📜 Logs',
    };

    let desc = `Canal de **${tipoLabel[tipo]}** definido para <#${canal.id}>.`;
    if (categoriaVoz) desc += `\nCategoria de voz definida para **${categoriaVoz.name}**.`;

    await interaction.editReply({ embeds: [successEmbed('Canal Configurado!', desc)] });
  },
};
