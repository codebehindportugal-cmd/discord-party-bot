const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin, getPlanLimits } = require('../../utils/permissions');

const GAME_SUGGESTIONS = [
  'World of Warcraft',
  'Final Fantasy XIV',
  'Lost Ark',
  'Albion Online',
  'Guild Wars 2',
  'New World',
  'Elder Scrolls Online',
  'Black Desert Online',
  'Runescape',
  'Path of Exile',
];

const CLASS_SUGGESTIONS = {
  TANK: ['Warrior', 'Paladin', 'Guardian', 'Death Knight', 'Gunlancer'],
  HEAL: ['Priest', 'Druid', 'Shaman', 'White Mage', 'Scholar', 'Bard'],
  DPS: ['Mage', 'Rogue', 'Hunter', 'Warlock', 'Dragoon', 'Sorceress'],
  SUPPORT: ['Bard', 'Dancer', 'Controller', 'Enchanter', 'Support'],
};

function filterChoices(values, focused) {
  const text = String(focused || '').toLowerCase();
  return values
    .filter(value => value.toLowerCase().includes(text))
    .slice(0, 25)
    .map(value => ({ name: value, value }));
}

// ─── /adicionar-jogo ──────────────────────────────────────────────────────────
const adicionarJogo = {
  data: new SlashCommandBuilder()
    .setName('adicionar-jogo')
    .setDescription('Adiciona um novo jogo ao servidor')
    .addStringOption(opt => opt.setName('nome').setDescription('Nome do jogo').setRequired(true).setAutocomplete(true))
    .addStringOption(opt =>
      opt.setName('emoji').setDescription('Emoji do jogo').setRequired(false)
        .addChoices(
          { name: 'Genérico', value: '🎮' },
          { name: 'Raid', value: '⚔️' },
          { name: 'Defesa', value: '🛡️' },
          { name: 'Boss', value: '🐉' },
          { name: 'Fantasia', value: '✨' },
        )
    )
    .addStringOption(opt => opt.setName('imagem_url').setDescription('URL da imagem/thumbnail do jogo').setRequired(false)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name === 'nome') {
      return interaction.respond(filterChoices(GAME_SUGGESTIONS, focused.value));
    }
    return interaction.respond([]);
  },

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Erro', 'Servidor não configurado.')] });

    const limits = getPlanLimits(server.plan);
    const gameCount = await prisma.game.count({ where: { serverId: server.id } });

    if (gameCount >= limits.maxGames) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Limite de Jogos Atingido',
          `O plano **${server.plan}** permite no máximo **${limits.maxGames}** jogo(s).\nFaz upgrade para adicionar mais jogos!`
        )],
      });
    }

    const nome = interaction.options.getString('nome');
    const emoji = interaction.options.getString('emoji') || '🎮';
    const imageUrl = interaction.options.getString('imagem_url');

    const game = await prisma.game.create({
      data: {
        name: nome,
        emoji,
        imageUrl,
        serverId: server.id,
      },
    });

    await interaction.editReply({
      embeds: [successEmbed(
        'Jogo Adicionado!',
        `${emoji} **${nome}** foi adicionado.\n\nAgora usa \`/adicionar-classe\` para criar as classes deste jogo.\nID: \`${game.id}\``
      )],
    });
  },
};

// ─── /adicionar-classe ────────────────────────────────────────────────────────
const adicionarClasse = {
  data: new SlashCommandBuilder()
    .setName('adicionar-classe')
    .setDescription('Adiciona uma classe a um jogo')
    .addStringOption(opt =>
      opt.setName('jogo').setDescription('Jogo').setRequired(true).setAutocomplete(true)
    )
    .addStringOption(opt => opt.setName('nome').setDescription('Nome da classe').setRequired(true).setAutocomplete(true))
    .addStringOption(opt =>
      opt.setName('role').setDescription('Role da classe').setRequired(true)
        .addChoices(
          { name: '🛡️ Tank', value: 'TANK' },
          { name: '💚 Heal', value: 'HEAL' },
          { name: '⚔️ DPS', value: 'DPS' },
          { name: '🔮 Support', value: 'SUPPORT' },
        )
    )
    .addStringOption(opt =>
      opt.setName('emoji').setDescription('Emoji da classe').setRequired(false)
        .addChoices(
          { name: 'Tank', value: '🛡️' },
          { name: 'Heal', value: '💚' },
          { name: 'DPS', value: '⚔️' },
          { name: 'Support', value: '🔮' },
          { name: 'Ranged', value: '🎯' },
          { name: 'Magic', value: '🔥' },
        )
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'nome') {
      const role = interaction.options.getString('role') || 'DPS';
      return interaction.respond(filterChoices(CLASS_SUGGESTIONS[role] || CLASS_SUGGESTIONS.DPS, focused.value));
    }

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const games = await prisma.game.findMany({
      where: { OR: [{ serverId: server.id }, { isGlobal: true }], active: true },
    });
    await interaction.respond(
      games.filter(g => g.name.toLowerCase().includes(String(focused.value).toLowerCase()))
        .slice(0, 25)
        .map(g => ({ name: `${g.emoji} ${g.name}`, value: g.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const jogoId = interaction.options.getString('jogo');
    const nome = interaction.options.getString('nome');
    const role = interaction.options.getString('role');
    const emoji = interaction.options.getString('emoji') || { TANK: '🛡️', HEAL: '💚', DPS: '⚔️', SUPPORT: '🔮' }[role];

    const classe = await prisma.class.create({
      data: { name: nome, role, emoji, gameId: jogoId },
      include: { game: true },
    });

    await interaction.editReply({
      embeds: [successEmbed(
        'Classe Adicionada!',
        `${emoji} **${nome}** (${role}) adicionada ao jogo **${classe.game.name}**.`
      )],
    });
  },
};

module.exports = { adicionarJogo, adicionarClasse };
