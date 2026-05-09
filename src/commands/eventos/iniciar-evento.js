const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isAdmin } = require('../../utils/permissions');
const { initEvent } = require('../../services/voiceTracker');
const { notifyEventStarting } = require('../../services/notificationService');
const { updateEventMessage } = require('../../services/eventPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iniciar-evento')
    .setDescription('Inicia um evento e cria o canal de voz')
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID do evento').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const prisma = client.prisma;
    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.respond([]);
    const events = await prisma.event.findMany({
      where: { serverId: server.id, status: 'OPEN' },
      include: { game: true },
      take: 25,
    });
    await interaction.respond(
      events.map(e => ({ name: `${e.game.emoji} ${e.name} — ${new Date(e.scheduledAt).toLocaleDateString('pt-PT')}`, value: e.id }))
    );
  },

  async execute(interaction, client) {
    const prisma = client.prisma;

    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissão', 'Apenas administradores podem iniciar eventos.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId } });
    if (!server) return interaction.editReply({ embeds: [errorEmbed('Servidor nao configurado', 'Usa o painel de configuracao primeiro.')] });
    const eventId = interaction.options.getString('id');

    const event = await prisma.event.findFirst({
      where: { id: eventId, serverId: server.id, status: 'OPEN' },
      include: { game: true, participants: { include: { player: true } } },
    });

    if (!event) {
      return interaction.editReply({ embeds: [errorEmbed('Evento não encontrado', 'Evento não existe ou já foi iniciado.')] });
    }

    // ─── Criar canal de voz ───────────────────────────────────────────────────
    const voiceName = `⚔️ ${event.name}`;
    const botMember = interaction.guild.members.me;

    let voiceChannel;
    try {
      const createOptions = {
        name: voiceName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.Connect], // por padrão, ninguém entra
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
          },
        ],
      };

      // Adicionar permissão para cada participante confirmado
      for (const p of event.participants) {
        createOptions.permissionOverwrites.push({
          id: p.player.discordId,
          allow: [PermissionFlagsBits.Connect],
        });
      }

      if (server.voiceCategoryId) {
        createOptions.parent = server.voiceCategoryId;
      }

      voiceChannel = await interaction.guild.channels.create(createOptions);
    } catch (err) {
      console.error('Erro ao criar canal de voz:', err);
      return interaction.editReply({
        embeds: [errorEmbed('Erro ao criar canal', 'Não foi possível criar o canal de voz. Verifica as permissões do bot.')],
      });
    }

    // ─── Atualizar evento ─────────────────────────────────────────────────────
    await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        voiceChannelId: voiceChannel.id,
      },
    });
    await updateEventMessage(client, interaction.guild, event.id);

    // ─── Iniciar tracking em memória ──────────────────────────────────────────
    initEvent(client, event.id);

    // ─── Notificar participantes ──────────────────────────────────────────────
    if (event.participants.length > 0) {
      notifyEventStarting(client, event.participants, event, voiceChannel).catch(() => {});
    }

    // ─── Anunciar no canal ────────────────────────────────────────────────────
    const announceChannel = server.announceChanId
      ? interaction.guild.channels.cache.get(server.announceChanId)
      : null;

    if (announceChannel) {
      await announceChannel.send({
        content: event.participants.map(p => `<@${p.player.discordId}>`).join(' '),
        embeds: [
          successEmbed(
            `${event.game.emoji} ${event.name} — A Começar!`,
            `O evento iniciou! Entra no canal de voz <#${voiceChannel.id}> para participar.\n⏱️ O teu tempo começa a contar quando entras no voice.`
          )
        ],
      }).catch(() => {});
    }

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Evento Iniciado!',
          `Canal de voz criado: <#${voiceChannel.id}>\n${event.participants.length} participantes notificados.\n\nUsa \`/ver-tempo ${event.id}\` para ver o tracking ao vivo.`
        )
      ],
    });
  },
};
