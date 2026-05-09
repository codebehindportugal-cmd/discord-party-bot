const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/embeds');
const { isFeatureEnabled } = require('../../services/features');

const GAMEINFO_URL = 'https://gameinfo.albiononline.com/api/gameinfo';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'accept': 'application/json' },
  });

  if (!response.ok) return null;
  return response.json();
}

function number(value) {
  return Number(value || 0).toLocaleString('pt-PT');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('albion')
    .setDescription('Consulta dados públicos do Albion Online')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('jogador')
        .setDescription('Consulta um jogador')
        .addStringOption((option) => option.setName('nome').setDescription('Nome do jogador').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('guilda')
        .setDescription('Consulta uma guilda')
        .addStringOption((option) => option.setName('nome').setDescription('Nome da guilda').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('mortes')
        .setDescription('Mostra mortes recentes de um jogador')
        .addStringOption((option) => option.setName('nome').setDescription('Nome do jogador').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('kills')
        .setDescription('Mostra kills recentes de um jogador')
        .addStringOption((option) => option.setName('nome').setDescription('Nome do jogador').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('batalha')
        .setDescription('Consulta uma batalha por ID')
        .addStringOption((option) => option.setName('id').setDescription('ID da batalha').setRequired(true)),
    ),

  async execute(interaction, client) {
    if (!(await isFeatureEnabled(client, interaction.guild.id, 'albion'))) {
      return interaction.reply({
        content: 'O módulo Albion está desligado neste servidor. Liga-o no site em /admin.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const name = interaction.options.getString('nome');

    if (subcommand === 'jogador') {
      const data = await fetchJson(`${GAMEINFO_URL}/search?q=${encodeURIComponent(name)}`);
      const player = data?.players?.[0];
      if (!player) return interaction.editReply('Jogador não encontrado.');

      const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`Jogador: ${player.Name}`)
        .addFields(
          { name: 'ID', value: player.Id || '-', inline: false },
          { name: 'Guilda', value: player.GuildName || 'Nenhuma', inline: true },
          { name: 'Aliança', value: player.AllianceName || 'Nenhuma', inline: true },
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'guilda') {
      const data = await fetchJson(`${GAMEINFO_URL}/search?q=${encodeURIComponent(name)}`);
      const guild = data?.guilds?.[0];
      if (!guild) return interaction.editReply('Guilda não encontrada.');

      const embed = new EmbedBuilder()
        .setColor(COLORS.gold)
        .setTitle(`Guilda: ${guild.Name}`)
        .addFields(
          { name: 'ID', value: guild.Id || '-', inline: false },
          { name: 'Fundador', value: guild.FounderName || 'Desconhecido', inline: true },
          { name: 'Aliança', value: guild.AllianceName || 'Nenhuma', inline: true },
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'batalha') {
      const battleId = interaction.options.getString('id');
      const data = await fetchJson(`${GAMEINFO_URL}/battles/${encodeURIComponent(battleId)}`);
      if (!data) return interaction.editReply('Batalha não encontrada.');

      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle(`Batalha ${data.id}`)
        .setDescription(`${number(data.totalFame)} fama | ${number(data.totalKills)} kills`)
        .addFields({ name: 'Participantes', value: String(data.players?.length || 0), inline: true })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    const data = await fetchJson(`${GAMEINFO_URL}/search?q=${encodeURIComponent(name)}`);
    const player = data?.players?.[0];
    if (!player) return interaction.editReply('Jogador não encontrado.');

    const endpoint = subcommand === 'kills' ? 'kills' : 'deaths';
    const events = await fetchJson(`${GAMEINFO_URL}/players/${player.Id}/${endpoint}`);
    if (!events?.length) return interaction.editReply(`Sem dados recentes para ${player.Name}.`);

    const embed = new EmbedBuilder()
      .setColor(subcommand === 'kills' ? COLORS.gold : COLORS.error)
      .setTitle(`${subcommand === 'kills' ? 'Kills' : 'Mortes'} recentes de ${player.Name}`)
      .setTimestamp();

    for (const event of events.slice(0, 5)) {
      const target = subcommand === 'kills' ? event.Victim : event.Killer;
      embed.addFields({
        name: subcommand === 'kills' ? 'Kill' : 'Morte',
        value: `${target?.Name || 'Desconhecido'} | Fama: ${number(event.TotalVictimKillFame)}`,
        inline: false,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  },
};
