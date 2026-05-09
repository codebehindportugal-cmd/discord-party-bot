const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { COLORS, successEmbed, errorEmbed, warningEmbed, eventEmbed } = require('../utils/embeds');
const { isAdmin, getPlanLimits } = require('../utils/permissions');
const { notifyNewEvent } = require('../services/notificationService');
const {
  createSlotsFromClasses,
  publishLegacyEvent,
  showPartySelect,
  showSlotSelect,
  joinSlot,
  leaveEvent,
  closeEvent,
  cancelEvent,
} = require('../services/eventPanel');

const DEFAULT_LANGUAGE = (process.env.DEFAULT_LANGUAGE || 'pt').toUpperCase();
const BOT_NAME = process.env.BOT_NAME || 'MordsFocas';
const BOT_LOGO_URL = process.env.BOT_LOGO_URL || null;

function panelEmbed() {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(BOT_NAME)
    .setDescription('Painel rápido para gerir eventos, jogadores, jogos e configuração do bot.')
    .addFields(
      { name: 'Jogadores', value: 'Usa **Registar** para escolher jogo e classe sem escrever IDs.', inline: true },
      { name: 'Eventos', value: 'Usa **Criar Evento** e **Eventos** para gerir inscrições.', inline: true },
      { name: 'Admins', value: 'Usa **Configurar**, **Jogo** e **Classe** para preparar o servidor.', inline: true },
    )
    .setFooter({ text: 'Os /comandos continuam disponíveis para utilizadores avançados.' })
    .setTimestamp();

  if (BOT_LOGO_URL) embed.setThumbnail(BOT_LOGO_URL);
  return embed;
}

function panelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('plb:register').setLabel('Registar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('plb:list_events').setLabel('Eventos').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('plb:create_event').setLabel('Criar Evento').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('plb:help').setLabel('/comandos').setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('plb:setup').setLabel('Configurar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('plb:add_game').setLabel('Jogo').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('plb:add_class').setLabel('Classe').setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function ensureServer(prisma, guild) {
  return prisma.server.upsert({
    where: { discordId: guild.id },
    update: { name: guild.name },
    create: {
      discordId: guild.id,
      name: guild.name,
      plan: 'FREE',
      language: DEFAULT_LANGUAGE,
    },
  });
}

async function sendPanel(channel) {
  return channel.send({ embeds: [panelEmbed()], components: panelComponents() });
}

function commandHelpEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('/comandos disponíveis')
    .setDescription('Podes usar botões/forms ou continuar com slash commands.')
    .addFields(
      { name: 'Jogadores', value: '`/registar`, `/perfil`' },
      { name: 'Eventos', value: '`/criar-evento`, `/listar-eventos`, `/entrar-evento`, `/iniciar-evento`, `/encerrar-evento`, `/ver-tempo`' },
      { name: 'Loot', value: '`/adicionar-loot`, `/calcular-split`, `/confirmar-split`' },
      { name: 'Admin', value: '`/config-canal`, `/adicionar-jogo`, `/adicionar-classe`, `/stats-servidor`' },
    )
    .setTimestamp();
}

function parsePtDate(value) {
  const [datePart, timePart = '20:00'] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

async function getServerOrReply(interaction, prisma) {
  const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
  if (!server) {
    await interaction.reply({ embeds: [errorEmbed('Servidor não configurado', 'Usa o painel de configuração primeiro.')], ephemeral: true });
    return null;
  }
  return server;
}

async function showSetup(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas administradores podem configurar o bot.')], ephemeral: true });
  }

  const rows = [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('plb:setup:announceChanId')
        .setPlaceholder('Canal de anúncios')
        .setChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('plb:setup:eventsChanId')
        .setPlaceholder('Canal de eventos')
        .setChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('plb:setup:logsChanId')
        .setPlaceholder('Canal de logs')
        .setChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('plb:setup:voiceCategoryId')
        .setPlaceholder('Categoria de voz dos eventos')
        .setChannelTypes(ChannelType.GuildCategory),
    ),
  ];

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(COLORS.info).setTitle('Configuração do bot').setDescription('Escolhe os canais/categoria abaixo.')],
    components: rows,
    ephemeral: true,
  });
}

async function saveChannelConfig(interaction, client) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas administradores podem configurar o bot.')], ephemeral: true });
  }

  const field = interaction.customId.split(':')[2];
  const channelId = interaction.values[0];

  await client.prisma.server.upsert({
    where: { discordId: interaction.guildId },
    update: { [field]: channelId },
    create: {
      discordId: interaction.guildId,
      name: interaction.guild.name,
      language: DEFAULT_LANGUAGE,
      [field]: channelId,
    },
  });

  return interaction.reply({ embeds: [successEmbed('Configuração guardada', `Campo atualizado para <#${channelId}>.`)], ephemeral: true });
}

function addGameModal() {
  return new ModalBuilder()
    .setCustomId('plb:add_game_modal')
    .setTitle('Adicionar jogo')
    .addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nome do jogo').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('🎮')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('imageUrl').setLabel('URL da imagem').setStyle(TextInputStyle.Short).setRequired(false)),
    );
}

async function handleAddGameModal(interaction, client) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas admins podem adicionar jogos.')], ephemeral: true });
  }

  const prisma = client.prisma;
  const server = await getServerOrReply(interaction, prisma);
  if (!server) return;

  const limits = getPlanLimits(server.plan);
  const gameCount = await prisma.game.count({ where: { serverId: server.id } });
  if (gameCount >= limits.maxGames) {
    return interaction.reply({ embeds: [errorEmbed('Limite de jogos atingido', `O plano ${server.plan} permite ${limits.maxGames} jogo(s).`)], ephemeral: true });
  }

  const name = interaction.fields.getTextInputValue('name');
  const emoji = interaction.fields.getTextInputValue('emoji') || '🎮';
  const imageUrl = interaction.fields.getTextInputValue('imageUrl') || null;

  const game = await prisma.game.create({ data: { name, emoji, imageUrl, serverId: server.id } });
  return interaction.reply({ embeds: [successEmbed('Jogo criado', `${game.emoji} **${game.name}** foi adicionado.`)], ephemeral: true });
}

async function showGameSelect(interaction, client, customId, placeholder) {
  const server = await getServerOrReply(interaction, client.prisma);
  if (!server) return;

  const games = await client.prisma.game.findMany({
    where: { OR: [{ serverId: server.id }, { isGlobal: true }], active: true },
    take: 25,
  });

  if (games.length === 0) {
    return interaction.reply({ embeds: [warningEmbed('Sem jogos', 'Um admin precisa criar um jogo primeiro.')], ephemeral: true });
  }

  return interaction.reply({
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customId)
          .setPlaceholder(placeholder)
          .addOptions(games.map(game => ({ label: game.name.slice(0, 100), value: game.id, emoji: game.emoji || undefined }))),
      ),
    ],
    ephemeral: true,
  });
}

async function showClassRoleSelect(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas admins podem adicionar classes.')], ephemeral: true });
  }

  const gameId = interaction.values[0];
  return interaction.reply({
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`plb:add_class_role:${gameId}`)
          .setPlaceholder('Escolhe a role da classe')
          .addOptions(
            { label: 'Tank', value: 'TANK', emoji: '🛡️' },
            { label: 'Heal', value: 'HEAL', emoji: '💚' },
            { label: 'DPS', value: 'DPS', emoji: '⚔️' },
            { label: 'Support', value: 'SUPPORT', emoji: '🔮' },
          ),
      ),
    ],
    ephemeral: true,
  });
}

function addClassModal(gameId, role) {
  return new ModalBuilder()
    .setCustomId(`plb:add_class_modal:${gameId}:${role}`)
    .setTitle('Adicionar classe')
    .addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nome da classe').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('⚔️')),
    );
}

async function handleAddClassModal(interaction, client) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas admins podem adicionar classes.')], ephemeral: true });
  }

  const [, , gameId, role] = interaction.customId.split(':');
  const name = interaction.fields.getTextInputValue('name');
  const emoji = interaction.fields.getTextInputValue('emoji') || { TANK: '🛡️', HEAL: '💚', DPS: '⚔️', SUPPORT: '🔮' }[role] || '⚔️';

  const classRow = await client.prisma.class.create({ data: { name, role, emoji, gameId }, include: { game: true } });
  return interaction.reply({ embeds: [successEmbed('Classe criada', `${emoji} **${name}** (${role}) em **${classRow.game.name}**.`)], ephemeral: true });
}

function createEventModal(gameId) {
  return new ModalBuilder()
    .setCustomId(`plb:create_event_modal:${gameId}`)
    .setTitle('Criar evento')
    .addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nome do evento').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Data DD/MM/AAAA HH:MM').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('vazio cria agora')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('duration').setLabel('Duração em minutos').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('60')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('imageUrl').setLabel('Imagem URL opcional').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(false)),
    );
}

async function handleCreateEventModal(interaction, client) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas administradores podem criar eventos.')], ephemeral: true });
  }

  const prisma = client.prisma;
  const server = await getServerOrReply(interaction, prisma);
  if (!server) return;

  const limits = getPlanLimits(server.plan);
  const activeEvents = await prisma.event.count({ where: { serverId: server.id, status: { in: ['OPEN', 'IN_PROGRESS'] } } });
  if (activeEvents >= limits.maxEvents) {
    return interaction.reply({ embeds: [errorEmbed('Limite de eventos atingido', `O plano ${server.plan} permite ${limits.maxEvents} evento(s) ativo(s).`)], ephemeral: true });
  }

  const gameId = interaction.customId.split(':')[2];
  const name = interaction.fields.getTextInputValue('name');
  const dateValue = interaction.fields.getTextInputValue('date');
  const durationValue = interaction.fields.getTextInputValue('duration') || '60';
  const imageUrl = interaction.fields.getTextInputValue('imageUrl') || null;
  const description = interaction.fields.getTextInputValue('description') || null;
  const scheduledAt = dateValue?.trim() ? parsePtDate(dateValue) : new Date();
  const durationMinutes = Math.max(5, Math.min(1440, Number(durationValue) || 60));

  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
    return interaction.reply({ embeds: [errorEmbed('Data inválida', 'Usa o formato DD/MM/AAAA HH:MM com uma data futura, ou deixa vazio para criar agora.')], ephemeral: true });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return interaction.reply({ embeds: [errorEmbed('Jogo não encontrado', 'Escolhe outro jogo.')], ephemeral: true });

  const event = await prisma.event.create({
    data: {
      name,
      description: imageUrl ? `${description || ''}\nImagem: ${imageUrl}`.trim() : description,
      lootType: 'TIME_BASED',
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

  return interaction.reply({ embeds: [successEmbed('Evento criado', `**${event.name}** foi criado e publicado no canal de eventos. ID: \`${event.id}\``)], ephemeral: true });
}

function eventJoinComponents(eventId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`plb:join_event:${eventId}`).setLabel('Entrar no evento').setStyle(ButtonStyle.Success),
    ),
  ];
}

async function showEvents(interaction, client) {
  const server = await getServerOrReply(interaction, client.prisma);
  if (!server) return;

  const events = await client.prisma.event.findMany({
    where: { serverId: server.id, status: 'OPEN' },
    include: { game: true, _count: { select: { participants: true } } },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });

  if (events.length === 0) {
    return interaction.reply({ embeds: [warningEmbed('Sem eventos', 'Não há eventos abertos de momento.')], ephemeral: true });
  }

  const embed = new EmbedBuilder().setColor(COLORS.info).setTitle('Eventos abertos');
  for (const event of events) {
    embed.addFields({
      name: `${event.game.emoji} ${event.name}`,
      value: `<t:${Math.floor(new Date(event.scheduledAt).getTime() / 1000)}:F> | ${event._count.participants}/${event.maxSlots} vagas`,
    });
  }

  const row = new ActionRowBuilder().addComponents(
    events.map(event => new ButtonBuilder().setCustomId(`plb:event_join:${event.id}`).setLabel(event.name.slice(0, 80)).setStyle(ButtonStyle.Success)),
  );

  return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function joinEvent(interaction, client, eventId) {
  const prisma = client.prisma;
  const server = await getServerOrReply(interaction, prisma);
  if (!server) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, serverId: server.id, status: 'OPEN' },
    include: { game: true, _count: { select: { participants: true } } },
  });

  if (!event) return interaction.reply({ embeds: [errorEmbed('Evento não encontrado', 'Evento não existe ou não está aberto.')], ephemeral: true });
  if (event._count.participants >= event.maxSlots) return interaction.reply({ embeds: [warningEmbed('Evento cheio', 'Não há vagas disponíveis.')], ephemeral: true });

  const player = await prisma.player.findFirst({ where: { discordId: interaction.user.id, serverId: server.id, gameId: event.gameId } });
  if (!player) return interaction.reply({ embeds: [errorEmbed('Não registado', `Regista-te em **${event.game.name}** primeiro pelo botão Registar.`)], ephemeral: true });

  const existing = await prisma.eventParticipant.findUnique({ where: { eventId_playerId: { eventId, playerId: player.id } } });
  if (existing) {
    await prisma.eventParticipant.update({ where: { eventId_playerId: { eventId, playerId: player.id } }, data: { status: 'CONFIRMED' } });
  } else {
    await prisma.eventParticipant.create({ data: { eventId, playerId: player.id, status: 'CONFIRMED' } });
  }

  return interaction.reply({ embeds: [successEmbed('Inscrição confirmada', `Entraste em **${event.game.emoji} ${event.name}**.`)], ephemeral: true });
}

async function showClassSelectForRegistration(interaction, client) {
  const gameId = interaction.values[0];
  const classes = await client.prisma.class.findMany({ where: { gameId }, take: 25 });
  if (classes.length === 0) {
    return interaction.reply({ embeds: [warningEmbed('Sem classes', 'Um admin precisa criar classes para este jogo primeiro.')], ephemeral: true });
  }

  return interaction.reply({
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`plb:register_class:${gameId}`)
          .setPlaceholder('Escolhe a tua classe')
          .addOptions(classes.map(classRow => ({ label: `${classRow.name} (${classRow.role})`.slice(0, 100), value: classRow.id, emoji: classRow.emoji || undefined }))),
      ),
    ],
    ephemeral: true,
  });
}

async function finishRegistration(interaction, client) {
  const prisma = client.prisma;
  const gameId = interaction.customId.split(':')[2];
  const classId = interaction.values[0];
  const server = await getServerOrReply(interaction, prisma);
  if (!server) return;

  const limits = getPlanLimits(server.plan);
  const playerCount = await prisma.player.count({ where: { serverId: server.id } });
  if (playerCount >= limits.maxPlayers) {
    return interaction.reply({ embeds: [errorEmbed('Limite de jogadores atingido', `O plano ${server.plan} permite ${limits.maxPlayers} jogadores.`)], ephemeral: true });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  const classRow = await prisma.class.findUnique({ where: { id: classId } });
  if (!game || !classRow) return interaction.reply({ embeds: [errorEmbed('Não encontrado', 'Jogo ou classe não encontrados.')], ephemeral: true });

  await prisma.player.upsert({
    where: { discordId_serverId_gameId: { discordId: interaction.user.id, serverId: server.id, gameId } },
    update: { classId, username: interaction.user.username },
    create: { discordId: interaction.user.id, username: interaction.user.username, serverId: server.id, gameId, classId },
  });

  return interaction.reply({ embeds: [successEmbed('Registo concluído', `Ficaste registado como **${classRow.emoji} ${classRow.name}** em **${game.emoji} ${game.name}**.`)], ephemeral: true });
}

async function handlePanelInteraction(interaction, client) {
  if (!interaction.customId?.startsWith('plb:')) return false;

  if (interaction.isButton()) {
    if (interaction.customId === 'plb:help') return interaction.reply({ embeds: [commandHelpEmbed()], ephemeral: true });
    if (interaction.customId === 'plb:setup') return showSetup(interaction);
    if (interaction.customId === 'plb:add_game') {
      if (!isAdmin(interaction.member)) return interaction.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas admins podem adicionar jogos.')], ephemeral: true });
      return interaction.showModal(addGameModal());
    }
    if (interaction.customId === 'plb:add_class') return showGameSelect(interaction, client, 'plb:add_class_game', 'Escolhe o jogo da classe');
    if (interaction.customId === 'plb:create_event') return showGameSelect(interaction, client, 'plb:create_event_game', 'Escolhe o jogo do evento');
    if (interaction.customId === 'plb:register') return showGameSelect(interaction, client, 'plb:register_game', 'Escolhe o teu jogo');
    if (interaction.customId === 'plb:list_events') return showEvents(interaction, client);
    if (interaction.customId.startsWith('plb:join_event:')) return joinEvent(interaction, client, interaction.customId.split(':')[2]);
    if (interaction.customId.startsWith('plb:event_join:')) return showPartySelect(interaction, client, interaction.customId.split(':')[2]);
    if (interaction.customId.startsWith('plb:event_leave:')) return leaveEvent(interaction, client, interaction.customId.split(':')[2]);
    if (interaction.customId.startsWith('plb:event_close:')) return closeEvent(interaction, client, interaction.customId.split(':')[2]);
    if (interaction.customId.startsWith('plb:event_cancel:')) return cancelEvent(interaction, client, interaction.customId.split(':')[2]);
  }

  if (interaction.isChannelSelectMenu() && interaction.customId.startsWith('plb:setup:')) {
    return saveChannelConfig(interaction, client);
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'plb:add_class_game') return showClassRoleSelect(interaction);
    if (interaction.customId.startsWith('plb:add_class_role:')) {
      const gameId = interaction.customId.split(':')[2];
      const role = interaction.values[0];
      return interaction.showModal(addClassModal(gameId, role));
    }
    if (interaction.customId === 'plb:create_event_game') return interaction.showModal(createEventModal(interaction.values[0]));
    if (interaction.customId === 'plb:register_game') return showClassSelectForRegistration(interaction, client);
    if (interaction.customId.startsWith('plb:register_class:')) return finishRegistration(interaction, client);
    if (interaction.customId.startsWith('plb:event_party:')) return showSlotSelect(interaction, client, interaction.customId.split(':')[2], interaction.values[0]);
    if (interaction.customId.startsWith('plb:event_slot:')) return joinSlot(interaction, client, interaction.customId.split(':')[2], interaction.values[0]);
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'plb:add_game_modal') return handleAddGameModal(interaction, client);
    if (interaction.customId.startsWith('plb:add_class_modal:')) return handleAddClassModal(interaction, client);
    if (interaction.customId.startsWith('plb:create_event_modal:')) return handleCreateEventModal(interaction, client);
  }

  return false;
}

module.exports = {
  handlePanelInteraction,
  panelComponents,
  panelEmbed,
  sendPanel,
};
