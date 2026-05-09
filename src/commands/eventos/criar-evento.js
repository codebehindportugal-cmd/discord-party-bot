const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin, getPlanLimits } = require('../../utils/permissions');
const { notifyNewEvent } = require('../../services/notificationService');
const { createSlotsFromClasses, publishLegacyEvent } = require('../../services/eventPanel');

const EVENT_NAME_SUGGESTIONS = [
  'Raid Semanal',
  'Dungeon Farm',
  'World Boss',
  'Progressao',
  'Loot Run',
  'Treino de Guild',
  'GANK',
  'DG avaloniana',
];

function dateSuggestions() {
  const base = new Date();
  const presets = [
    { label: 'Hoje 21:00', offset: 0, hour: 21 },
    { label: 'Amanha 21:00', offset: 1, hour: 21 },
    { label: 'Sabado 21:00', weekday: 6, hour: 21 },
    { label: 'Domingo 20:00', weekday: 0, hour: 20 },
  ];

  return presets.map((preset) => {
    const date = new Date(base);
    if ('weekday' in preset) {
      const delta = (preset.weekday - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + delta);
    } else {
      date.setDate(date.getDate() + preset.offset);
    }
    date.setHours(preset.hour, 0, 0, 0);
    const value = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:00`;
    return { name: `${preset.label} - ${value}`, value };
  });
}

function parsePtDate(value) {
  const text = String(value || '').trim();
  if (!text || ['agora', 'now', 'hoje'].includes(text.toLowerCase())) {
    return new Date(Date.now() + 1000);
  }

  const match = text.match(/^(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) return new Date(NaN);

  const first = Number(match[1]);
  const second = Number(match[2]);
  const third = Number(match[3]);
  const hour = Number(match[4] || 20);
  const minute = Number(match[5] || 0);

  const yearFirst = match[1].length === 4;
  const year = yearFirst ? first : third;
  const month = second;
  const day = yearFirst ? third : first;

  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return new Date(NaN);
  }

  return new Date(year, month - 1, day, hour, minute);
}

function filterTextChoices(values, focused) {
  const text = String(focused || '').toLowerCase();
  return values
    .filter((value) => value.toLowerCase().includes(text))
    .slice(0, 25)
    .map((value) => ({ name: value, value }));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('criar-evento')
    .setDescription('Cria um novo evento no formato de parties e slots')
    .addStringOption((opt) =>
      opt.setName('nome').setDescription('Nome do evento').setRequired(true).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt.setName('jogo').setDescription('Jogo do evento').setRequired(true).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt.setName('data').setDescription('Data e hora').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption((opt) =>
      opt.setName('duracao').setDescription('Duracao em minutos').setRequired(false).setMinValue(5).setMaxValue(1440)
        .addChoices(
          { name: '30 minutos', value: 30 },
          { name: '60 minutos', value: 60 },
          { name: '90 minutos', value: 90 },
          { name: '120 minutos', value: 120 },
        )
    )
    .addStringOption((opt) =>
      opt.setName('tipo_loot').setDescription('Tipo de divisao de loot').setRequired(false)
        .addChoices(
          { name: 'Por tempo de voz', value: 'TIME_BASED' },
          { name: 'Divisao igual', value: 'EQUAL' },
          { name: 'Loot council', value: 'LOOT_COUNCIL' },
        )
    )
    .addStringOption((opt) =>
      opt.setName('descricao').setDescription('Descricao do evento').setRequired(false).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt.setName('imagem').setDescription('URL opcional da imagem').setRequired(false)
    ),

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'nome') {
      return interaction.respond(filterTextChoices(EVENT_NAME_SUGGESTIONS, focused.value));
    }

    if (focused.name === 'data') {
      return interaction.respond(dateSuggestions()
        .filter((option) => option.name.toLowerCase().includes(String(focused.value).toLowerCase()))
        .slice(0, 25));
    }

    if (focused.name === 'descricao') {
      return interaction.respond(filterTextChoices([
        'Evento de guild com split por tempo de voice.',
        'Farm rapido com tracking automatico.',
        'Progressao com prioridade a jogadores confirmados.',
        'Loot council ativo para itens raros.',
      ], focused.value));
    }

    if (focused.name !== 'jogo') return interaction.respond([]);

    const games = await client.prisma.game.findMany({
      where: { OR: [{ isGlobal: true }, { server: { discordId: interaction.guildId } }], active: true },
    });
    return interaction.respond(
      games
        .filter((game) => game.name.toLowerCase().includes(String(focused.value).toLowerCase()))
        .slice(0, 25)
        .map((game) => ({ name: `${game.emoji} ${game.name}`, value: game.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissao', 'Apenas administradores podem criar eventos.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Erro', 'Servidor nao configurado.')] });

    const limits = getPlanLimits(server.plan);
    const activeEvents = await prisma.event.count({
      where: { serverId: server.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    if (activeEvents >= limits.maxEvents) {
      return interaction.editReply({
        embeds: [errorEmbed('Limite de eventos atingido', `O plano ${server.plan} permite ${limits.maxEvents} evento(s) ativo(s).`)],
      });
    }

    let scheduledAt = parsePtDate(interaction.options.getString('data'));
    if (Number.isNaN(scheduledAt.getTime())) {
      return interaction.editReply({ embeds: [errorEmbed('Data invalida', 'Usa o formato DD/MM/AAAA HH:MM com uma data futura.')] });
    }

    if (scheduledAt < new Date()) {
      scheduledAt = new Date(Date.now() + 1000);
    }

    const gameId = interaction.options.getString('jogo');
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) return interaction.editReply({ embeds: [errorEmbed('Jogo nao encontrado', 'O jogo selecionado nao existe.')] });

    const durationMinutes = interaction.options.getInteger('duracao') || 60;
    const description = interaction.options.getString('descricao');
    const imageUrl = interaction.options.getString('imagem');

    const event = await prisma.event.create({
      data: {
        name: interaction.options.getString('nome'),
        description: imageUrl ? `${description || ''}\nImagem: ${imageUrl}`.trim() : description,
        lootType: interaction.options.getString('tipo_loot') || 'TIME_BASED',
        scheduledAt,
        endedAt: new Date(scheduledAt.getTime() + durationMinutes * 60000),
        maxSlots: 50,
        serverId: server.id,
        gameId,
        createdBy: interaction.user.id,
      },
    });

    await createSlotsFromClasses(prisma, event.id, gameId);
    await publishLegacyEvent(client, interaction.guild, event.id);

    const players = await prisma.player.findMany({ where: { serverId: server.id, gameId } });
    if (players.length > 0) {
      notifyNewEvent(client, players, event, game, server).catch(() => {});
    }

    return interaction.editReply({
      embeds: [successEmbed('Evento criado', `**${event.name}** foi publicado com parties e slots.\nID: \`${event.id}\``)],
    });
  },
};
