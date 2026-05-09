/**
 * SplitCalculator — Calcula divisão de loot por tempo de voz
 */

/**
 * Calcula o split baseado em tempo
 * @param {Array} timesData - [{ discordId, totalMinutes }]
 * @param {number} totalGold - Total de gold/loot a distribuir
 * @param {Object} config - Configurações do servidor
 * @param {Object} players - Map discordId -> player (com class.role)
 * @returns {Array} splits - [{ discordId, minutes, percentage, amount }]
 */
function calculateTimeSplit(timesData, totalGold, config = {}, players = {}) {
  const {
    minTimeMinutes = 0,
    maxPercentage = null,
    roleBonus = null,
  } = config;

  // 1. Filtrar por tempo mínimo
  let eligible = timesData.filter(p => p.totalMinutes >= minTimeMinutes);

  if (eligible.length === 0) {
    // Se ninguém atingiu o mínimo, inclui todos
    eligible = timesData;
  }

  // 2. Aplicar bónus de role se configurado
  const weighted = eligible.map(p => {
    let multiplier = 1.0;
    const player = players[p.discordId];
    if (roleBonus && player?.class?.role) {
      const role = player.class.role.toLowerCase();
      multiplier = roleBonus[role] || 1.0;
    }
    return {
      ...p,
      weightedMinutes: p.totalMinutes * multiplier,
      multiplier,
    };
  });

  // 3. Calcular total ponderado
  const totalWeighted = weighted.reduce((acc, p) => acc + p.weightedMinutes, 0);

  if (totalWeighted === 0) {
    // Divisão igual se não há tempo
    const equalShare = totalGold / eligible.length;
    return eligible.map(p => ({
      discordId: p.discordId,
      minutes: p.totalMinutes,
      percentage: 100 / eligible.length,
      amount: equalShare,
      multiplier: 1,
    }));
  }

  // 4. Calcular percentagens
  let splits = weighted.map(p => ({
    discordId: p.discordId,
    minutes: p.totalMinutes,
    rawPercentage: (p.weightedMinutes / totalWeighted) * 100,
    multiplier: p.multiplier,
  }));

  // 5. Aplicar cap máximo se configurado
  if (maxPercentage && maxPercentage > 0) {
    splits = applyCap(splits, maxPercentage);
  }

  // 6. Calcular valores finais
  return splits.map(s => ({
    discordId: s.discordId,
    minutes: s.minutes,
    percentage: s.rawPercentage,
    amount: (s.rawPercentage / 100) * totalGold,
    multiplier: s.multiplier,
  }));
}

/**
 * Aplica um cap máximo de % redistribuindo o excesso proporcionalmente
 */
function applyCap(splits, maxPercentage) {
  let capped = splits.map(s => ({ ...s, capped: false }));
  let iterations = 0;

  while (iterations < 10) {
    const overCapped = capped.filter(s => s.rawPercentage > maxPercentage && !s.capped);
    if (overCapped.length === 0) break;

    let excessTotal = 0;
    overCapped.forEach(s => {
      excessTotal += s.rawPercentage - maxPercentage;
      s.rawPercentage = maxPercentage;
      s.capped = true;
    });

    // Redistribuir excesso pelos não capped
    const notCapped = capped.filter(s => !s.capped);
    if (notCapped.length === 0) break;

    const totalNotCapped = notCapped.reduce((acc, s) => acc + s.rawPercentage, 0);
    notCapped.forEach(s => {
      s.rawPercentage += (s.rawPercentage / totalNotCapped) * excessTotal;
    });

    iterations++;
  }

  return capped;
}

/**
 * Divisão igual simples
 */
function calculateEqualSplit(players, totalGold) {
  const share = totalGold / players.length;
  return players.map(p => ({
    discordId: p.discordId,
    minutes: 0,
    percentage: 100 / players.length,
    amount: share,
    multiplier: 1,
  }));
}

/**
 * Formata preview do split para exibição
 */
function formatSplitPreview(splits, server) {
  return splits
    .sort((a, b) => b.minutes - a.minutes)
    .map((s, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      const h = Math.floor(s.minutes / 60);
      const m = Math.round(s.minutes % 60);
      const time = h > 0 ? `${h}h${m}m` : `${m}m`;
      const bonus = s.multiplier > 1 ? ` ×${s.multiplier}` : '';
      return `${medal} <@${s.discordId}> — ${time}${bonus} → **${s.amount.toFixed(0)} ${server.currencySymbol}** (${s.percentage.toFixed(1)}%)`;
    })
    .join('\n');
}

module.exports = {
  calculateTimeSplit,
  calculateEqualSplit,
  formatSplitPreview,
};
