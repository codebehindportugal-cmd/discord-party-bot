const DEFAULT_FEATURES = {
  antispam: {
    enabled: false,
    messageLimit: 5,
    timeWindowSeconds: 10,
    muteDurationsSeconds: [300, 600, 1800, 3600, 14400, 28800, 86400],
  },
  albion: {
    enabled: false,
  },
};

function mergeConfig(key, feature) {
  const defaults = DEFAULT_FEATURES[key] || { enabled: false };
  return {
    ...defaults,
    ...(feature?.config || {}),
    enabled: Boolean(feature?.enabled),
  };
}

async function getFeatureConfig(client, guildId, key) {
  if (!guildId || !client.prisma) return mergeConfig(key);

  const server = await client.prisma.server.findUnique({
    where: { discordId: guildId },
    include: { features: { where: { key } } },
  });

  return mergeConfig(key, server?.features?.[0]);
}

async function isFeatureEnabled(client, guildId, key) {
  const config = await getFeatureConfig(client, guildId, key);
  return Boolean(config.enabled);
}

module.exports = {
  DEFAULT_FEATURES,
  getFeatureConfig,
  isFeatureEnabled,
};
