/**
 * VoiceTracker — Serviço central de tracking de tempo no voice chat
 *
 * Estrutura em memória:
 * client.voiceSessions = Map {
 *   eventId -> Map {
 *     discordId -> { joinedAt: Date, totalMinutes: number, sessionId: string }
 *   }
 * }
 */

const CRASH_TOLERANCE_MS = (parseInt(process.env.CRASH_TOLERANCE_MINUTES) || 5) * 60 * 1000;

// Mapa para rastrear desconexões recentes (possíveis crashes)
const recentDisconnects = new Map(); // discordId_eventId -> { disconnectedAt, totalMinutes, sessionId }

/**
 * Inicia tracking para um evento
 */
function initEvent(client, eventId) {
  if (!client.voiceSessions.has(eventId)) {
    client.voiceSessions.set(eventId, new Map());
  }
}

/**
 * Regista entrada no voice
 */
async function playerJoined(client, prisma, eventId, discordId) {
  initEvent(client, eventId);
  const sessions = client.voiceSessions.get(eventId);
  const key = `${discordId}_${eventId}`;

  // Verificar se é reconexão após crash
  const recentDisc = recentDisconnects.get(key);
  if (recentDisc && (Date.now() - recentDisc.disconnectedAt) < CRASH_TOLERANCE_MS) {
    // Reconexão rápida — restaurar sessão sem penalizar
    sessions.set(discordId, {
      joinedAt: new Date(),
      totalMinutes: recentDisc.totalMinutes,
      sessionId: recentDisc.sessionId,
      isCrashRecovery: true,
    });
    recentDisconnects.delete(key);
    console.log(`🔄 Reconexão detectada: ${discordId} no evento ${eventId}`);
    return;
  }

  // Nova sessão
  const session = await prisma.voiceSession.create({
    data: {
      eventId,
      player: {
        connect: {
          discordId_serverId_gameId: undefined, // será resolvido via discordId + eventId
        },
      },
      joinedAt: new Date(),
    },
  }).catch(() => ({ id: `temp_${Date.now()}` })); // fallback se player não encontrado ainda

  sessions.set(discordId, {
    joinedAt: new Date(),
    totalMinutes: 0,
    sessionId: session.id,
    isCrashRecovery: false,
  });

  console.log(`🎙️ ${discordId} entrou no voice do evento ${eventId}`);
}

/**
 * Regista saída do voice
 */
async function playerLeft(client, prisma, eventId, discordId, isCrash = false) {
  const sessions = client.voiceSessions.get(eventId);
  if (!sessions || !sessions.has(discordId)) return;

  const session = sessions.get(discordId);
  const minutesThisSession = (Date.now() - session.joinedAt.getTime()) / 60000;
  const totalMinutes = session.totalMinutes + minutesThisSession;

  // Guardar no banco
  try {
    if (session.sessionId && !session.sessionId.startsWith('temp_')) {
      await prisma.voiceSession.update({
        where: { id: session.sessionId },
        data: {
          leftAt: new Date(),
          durationMinutes: minutesThisSession,
          isCrash,
        },
      });
    }
  } catch (e) {
    console.error('Erro ao salvar sessão de voz:', e.message);
  }

  if (isCrash) {
    // Guardar para possível reconexão
    recentDisconnects.set(`${discordId}_${eventId}`, {
      disconnectedAt: Date.now(),
      totalMinutes,
      sessionId: session.sessionId,
    });
    // Limpar após tolerância
    setTimeout(() => {
      recentDisconnects.delete(`${discordId}_${eventId}`);
    }, CRASH_TOLERANCE_MS + 5000);
  }

  // Atualizar com novo total acumulado
  sessions.set(discordId, {
    ...session,
    joinedAt: null,
    totalMinutes,
  });

  console.log(`🔇 ${discordId} saiu do voice do evento ${eventId} — ${totalMinutes.toFixed(1)} min total`);
}

/**
 * Retorna tempo atual de todos os jogadores num evento
 */
function getEventTimes(client, eventId) {
  const sessions = client.voiceSessions.get(eventId);
  if (!sessions) return [];

  const now = Date.now();
  return Array.from(sessions.entries()).map(([discordId, session]) => {
    let current = session.totalMinutes;
    const isActive = session.joinedAt !== null;
    if (isActive) {
      current += (now - session.joinedAt.getTime()) / 60000;
    }
    return { discordId, totalMinutes: current, isActive };
  });
}

/**
 * Congela todos os tempos ao encerrar o evento
 */
async function freezeEventTimes(client, prisma, eventId) {
  const sessions = client.voiceSessions.get(eventId);
  if (!sessions) return [];

  const now = Date.now();
  const finalTimes = [];

  for (const [discordId, session] of sessions.entries()) {
    let total = session.totalMinutes;
    if (session.joinedAt) {
      // Ainda em voz quando evento encerrou
      total += (now - session.joinedAt.getTime()) / 60000;
      await playerLeft(client, prisma, eventId, discordId, false);
    }
    finalTimes.push({ discordId, totalMinutes: total });
  }

  return finalTimes;
}

/**
 * Pausa o tracking (ex: pausa da raid)
 */
function pauseTracking(client, eventId) {
  const sessions = client.voiceSessions.get(eventId);
  if (!sessions) return;

  const now = Date.now();
  for (const [discordId, session] of sessions.entries()) {
    if (session.joinedAt) {
      const elapsed = (now - session.joinedAt.getTime()) / 60000;
      sessions.set(discordId, {
        ...session,
        joinedAt: null,
        totalMinutes: session.totalMinutes + elapsed,
        paused: true,
      });
    }
  }
  console.log(`⏸️ Tracking pausado para evento ${eventId}`);
}

/**
 * Retoma o tracking
 */
function resumeTracking(client, eventId) {
  const sessions = client.voiceSessions.get(eventId);
  if (!sessions) return;

  for (const [discordId, session] of sessions.entries()) {
    if (session.paused) {
      sessions.set(discordId, {
        ...session,
        joinedAt: new Date(),
        paused: false,
      });
    }
  }
  console.log(`▶️ Tracking retomado para evento ${eventId}`);
}

/**
 * Limpar evento da memória
 */
function clearEvent(client, eventId) {
  client.voiceSessions.delete(eventId);
}

module.exports = {
  initEvent,
  playerJoined,
  playerLeft,
  getEventTimes,
  freezeEventTimes,
  pauseTracking,
  resumeTracking,
  clearEvent,
};
