const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, splitEmbed, COLORS } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');
const { calculateTimeSplit, calculateEqualSplit, formatSplitPreview } = require('../../services/splitCalculator');
const { notifyPlayerSplit } = require('../../services/notificationService');
const { EmbedBuilder } = require('discord.js');

const LOOT_NAME_SUGGESTIONS = [
  'Gold',
  'BoE Item',
  'Rare Drop',
  'Crafting Material',
  'Mount',
  'Consumables',
];

function filterTextChoices(values, focused) {
  const text = String(focused || '').toLowerCase();
  return values
    .filter(value => value.toLowerCase().includes(text))
    .slice(0, 25)
    .map(value => ({ name: value, value }));
}

// ─── /adicionar-loot ──────────────────────────────────────────────────────────
const adicionarLoot = {
  data: new SlashCommandBuilder()
    .setName('adicionar-loot')
    .setDescription('Adiciona gold ou item ao loot do evento')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    )
    .addNumberOption(opt =>
      opt.setName('valor').setDescription('Quantidade de gold ou valor do item').setRequired(true).setMinValue(0)
        .addChoices(
          { name: '1.000', value: 1000 },
          { name: '5.000', value: 5000 },
          { name: '10.000', value: 10000 },
          { name: '25.000', value: 25000 },
          { name: '50.000', value: 50000 },
        )
    )
    .addStringOption(opt =>
      opt.setName('tipo').setDescription('Tipo').setRequired(false)
        .addChoices(
          { name: '💰 Gold', value: 'GOLD' },
          { name: '📦 Item', value: 'ITEM' },
        )
    )
    .addStringOption(opt =>
      opt.setName('nome').setDescription('Nome do item (se for item)').setRequired(false).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'nome') {
      return interaction.respond(filterTextChoices(LOOT_NAME_SUGGESTIONS, focused.value));
    }

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: { in: ['CALCULATING', 'IN_PROGRESS'] } },
      include: { game: true }, take: 25,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins podem adicionar loot.')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('evento_id');
    const valor = interaction.options.getNumber('valor');
    const tipo = interaction.options.getString('tipo') || 'GOLD';
    const nome = interaction.options.getString('nome');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id },
    });
    if (!event) return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Verifica o ID.')] });

    await prisma.lootEntry.create({
      data: { eventId, type: tipo, value: valor, currency: server.currency, name: nome },
    });

    // Total acumulado
    const entries = await prisma.lootEntry.findMany({ where: { eventId } });
    const total = entries.reduce((acc, e) => acc + e.value, 0);

    await interaction.editReply({
      embeds: [successEmbed(
        'Loot Adicionado',
        `${tipo === 'GOLD' ? '💰' : '📦'} **${nome || valor} ${server.currencySymbol}** adicionado.\n\nTotal acumulado: **${total.toFixed(0)} ${server.currencySymbol}**`
      )],
    });
  },
};

// ─── /calcular-split ──────────────────────────────────────────────────────────
const calcularSplit = {
  data: new SlashCommandBuilder()
    .setName('calcular-split')
    .setDescription('Calcula a divisão do loot por tempo de voz (preview)')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'CALCULATING' },
      include: { game: true }, take: 25,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('evento_id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id, status: 'CALCULATING' },
      include: { game: true },
    });
    if (!event) return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Evento não está em fase de cálculo.')] });

    // Buscar loot total
    const lootEntries = await prisma.lootEntry.findMany({ where: { eventId } });
    const totalGold = lootEntries.reduce((acc, e) => acc + e.value, 0);
    if (totalGold === 0) {
      return interaction.editReply({ embeds: [errorEmbed('Sem Loot', 'Adiciona gold com `/adicionar-loot` primeiro.')] });
    }

    // Buscar sessões de voz
    const sessions = await prisma.voiceSession.findMany({
      where: { eventId },
      include: { player: { include: { class: true } } },
    });

    const aggregated = {};
    for (const s of sessions) {
      const did = s.player.discordId;
      if (!aggregated[did]) aggregated[did] = { discordId: did, totalMinutes: 0, player: s.player };
      aggregated[did].totalMinutes += s.durationMinutes;
    }

    const timesData = Object.values(aggregated);
    if (timesData.length === 0) {
      return interaction.editReply({ embeds: [errorEmbed('Sem Dados de Voz', 'Nenhum tempo de voz registado.')] });
    }

    const playersMap = {};
    timesData.forEach(t => { playersMap[t.discordId] = t.player; });

    const splits = calculateTimeSplit(timesData, totalGold, {
      minTimeMinutes: server.minTimeMinutes,
      maxPercentage: server.maxPercentage,
      roleBonus: server.roleBonus,
    }, playersMap);

    const preview = formatSplitPreview(splits, server);

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(`💰 Preview do Split — ${event.name}`)
      .setDescription(preview)
      .addFields(
        { name: '💰 Total', value: `${totalGold.toFixed(0)} ${server.currencySymbol}`, inline: true },
        { name: '👥 Jogadores', value: `${splits.length}`, inline: true },
      )
      .setFooter({ text: 'Usa /confirmar-split para finalizar e enviar DMs' })
      .setTimestamp();

    // Guardar splits temporários
    await prisma.lootSplit.deleteMany({ where: { eventId } });
    for (const s of splits) {
      const player = await prisma.player.findFirst({
        where: { discordId: s.discordId, serverId: server.id },
      });
      if (!player) continue;
      await prisma.lootSplit.create({
        data: {
          eventId,
          playerId: player.id,
          amount: s.amount,
          percentage: s.percentage,
          minutes: s.minutes,
        },
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

// ─── /confirmar-split ─────────────────────────────────────────────────────────
const confirmarSplit = {
  data: new SlashCommandBuilder()
    .setName('confirmar-split')
    .setDescription('Confirma e publica o split final, enviando DM a cada jogador')
    .addStringOption(opt =>
      opt.setName('evento_id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'CALCULATING' },
      include: { game: true }, take: 25,
    });
    await interaction.respond(events.map(e => ({ name: `${e.game.emoji} ${e.name}`, value: e.id })));
  },

  async execute(interaction, client) {
    const prisma = client.prisma;
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas admins.')], ephemeral: true });
    }
    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    const eventId = interaction.options.getString('evento_id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id, status: 'CALCULATING' },
      include: { game: true },
    });
    if (!event) return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Corre `/calcular-split` primeiro.')] });

    const splits = await prisma.lootSplit.findMany({
      where: { eventId },
      include: { player: true },
    });

    if (splits.length === 0) {
      return interaction.editReply({ embeds: [errorEmbed('Sem Split', 'Corre `/calcular-split` primeiro.')] });
    }

    // Publicar embed final
    const embedFinal = splitEmbed(event, splits.map(s => ({ ...s, player: s.player })), server);

    const announceChannel = server.announceChanId
      ? interaction.guild.channels.cache.get(server.announceChanId)
      : interaction.channel;

    if (announceChannel) {
      await announceChannel.send({ embeds: [embedFinal] }).catch(() => {});
    }

    // Confirmar splits e atualizar estatísticas dos jogadores
    for (const s of splits) {
      await prisma.lootSplit.update({
        where: { id: s.id },
        data: { confirmed: true, confirmedAt: new Date() },
      });
      await prisma.player.update({
        where: { id: s.playerId },
        data: {
          totalEarnings: { increment: s.amount },
          totalMinutes: { increment: Math.round(s.minutes) },
          eventsCount: { increment: 1 },
        },
      });

      // Enviar DM individual
      notifyPlayerSplit(client, { discordId: s.player.discordId, ...s }, event, server).catch(() => {});
    }

    // Marcar evento como concluído
    await prisma.event.update({
      where: { id: event.id },
      data: { status: 'COMPLETED' },
    });

    await interaction.editReply({
      embeds: [successEmbed(
        'Split Confirmado!',
        `O loot de **${event.name}** foi distribuído!\n✅ ${splits.length} jogadores receberão DM com os seus ganhos.`
      )],
    });
  },
};

module.exports = { adicionarLoot, calcularSplit, confirmarSplit };
