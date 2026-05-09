const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed } = require('./embeds');

const PLAN_LIMITS = {
  FREE: {
    maxPlayers: parseInt(process.env.FREE_MAX_PLAYERS) || 5,
    maxEvents: parseInt(process.env.FREE_MAX_EVENTS) || 1,
    maxGames: parseInt(process.env.FREE_MAX_GAMES) || 1,
  },
  PRO: {
    maxPlayers: parseInt(process.env.PRO_MAX_PLAYERS) || 20,
    maxEvents: parseInt(process.env.PRO_MAX_EVENTS) || 999,
    maxGames: parseInt(process.env.PRO_MAX_GAMES) || 2,
  },
  PREMIUM: {
    maxPlayers: 99999,
    maxEvents: 99999,
    maxGames: 99999,
  },
};

function isAdmin(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

async function checkSubscription(interaction, server, feature) {
  const limits = getPlanLimits(server.plan);

  // Verificar expiração
  if (server.planExpiresAt && new Date(server.planExpiresAt) < new Date() && server.plan !== 'FREE') {
    await interaction.reply({
      embeds: [errorEmbed(
        'Subscrição Expirada',
        `A tua subscrição **${server.plan}** expirou.\nVisita o nosso site para renovar e continuar a usar todas as funcionalidades!`,
      )],
      ephemeral: true,
    });
    return false;
  }

  return { limits };
}

module.exports = { isAdmin, getPlanLimits, checkSubscription };
