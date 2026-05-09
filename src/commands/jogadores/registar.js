const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getPlanLimits } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registar')
    .setDescription('Regista-te como jogador neste servidor')
    .addStringOption(opt =>
      opt.setName('jogo').setDescription('Jogo em que queres participar').setRequired(true).setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('classe').setDescription('A tua classe no jogo').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const focused = interaction.options.getFocused(true);
    const guildId = interaction.guildId;

    if (focused.name === 'jogo') {
      const games = await prisma.game.findMany({
        where: { OR: [{ serverId: null, isGlobal: true }, { server: { discordId: guildId } }], active: true },
      });
      await interaction.respond(
        games.filter(g => g.name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(g => ({ name: `${g.emoji} ${g.name}`, value: g.id }))
      );
    }

    if (focused.name === 'classe') {
      const jogoId = interaction.options.getString('jogo');
      if (!jogoId) return interaction.respond([]);
      const classes = await prisma.class.findMany({ where: { gameId: jogoId } });
      await interaction.respond(
        classes.filter(c => c.name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(c => ({ name: `${c.emoji} ${c.name} (${c.role})`, value: c.id }))
      );
    }
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    const guildId = interaction.guildId;
    const discordId = interaction.user.id;
    const jogoId = interaction.options.getString('jogo');
    const classeId = interaction.options.getString('classe');

    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Servidor não configurado', 'Usa `/config-canal` para configurar o bot.')] });

    // Verificar limite de jogadores do plano
    const limits = getPlanLimits(server.plan);
    const playerCount = await prisma.player.count({ where: { serverId: server.id } });

    if (playerCount >= limits.maxPlayers) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Limite de Jogadores Atingido',
          `O plano **${server.plan}** permite no máximo **${limits.maxPlayers}** jogadores.\nFaz upgrade no nosso site para adicionar mais!`
        )],
      });
    }

    const game = await prisma.game.findUnique({ where: { id: jogoId } });
    const classe = await prisma.class.findUnique({ where: { id: classeId }, include: { game: true } });

    if (!game || !classe) {
      return interaction.editReply({ embeds: [errorEmbed('Não encontrado', 'Jogo ou classe não encontrados.')] });
    }

    // Upsert jogador
    const player = await prisma.player.upsert({
      where: {
        discordId_serverId_gameId: {
          discordId,
          serverId: server.id,
          gameId: jogoId,
        },
      },
      update: { classId: classeId, username: interaction.user.username },
      create: {
        discordId,
        username: interaction.user.username,
        serverId: server.id,
        gameId: jogoId,
        classId: classeId,
      },
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Registo Concluído!',
          `Estás registado como **${classe.emoji} ${classe.name}** em **${game.emoji} ${game.name}**.\nSerás notificado quando novos eventos forem criados!`
        )
      ],
    });
  },
};
