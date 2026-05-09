const voiceTracker = require('../services/voiceTracker');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const prisma = client.prisma;
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId || newState.member?.user?.bot) return;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    // Nada mudou
    if (oldChannelId === newChannelId) return;

    // ─── Encontrar evento associado ao canal ──────────────────────────────────
    async function findEventByChannel(channelId) {
      if (!channelId) return null;
      return prisma.event.findFirst({
        where: {
          voiceChannelId: channelId,
          status: 'IN_PROGRESS',
        },
      });
    }

    // ─── Saiu de um canal ─────────────────────────────────────────────────────
    if (oldChannelId) {
      const event = await findEventByChannel(oldChannelId);
      if (event) {
        // Detectar se é crash (força maior) ou saída voluntária
        const isCrash = newChannelId === null && !newState.selfDeaf && !newState.selfMute;
        await voiceTracker.playerLeft(client, prisma, event.id, userId, isCrash);
      }
    }

    // ─── Entrou num canal ─────────────────────────────────────────────────────
    if (newChannelId) {
      const event = await findEventByChannel(newChannelId);
      if (event) {
        await voiceTracker.playerJoined(client, prisma, event.id, userId);
      }
    }
  },
};
