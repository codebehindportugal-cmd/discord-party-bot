const { errorEmbed } = require('../utils/embeds');
const { handlePanelInteraction } = require('../interactions/panel');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (await handlePanelInteraction(interaction, client)) return;
    } catch (error) {
      console.error('Erro numa interação do painel:', error);

      const reply = {
        embeds: [errorEmbed('Erro Inesperado', 'Ocorreu um erro ao processar esta ação. Tenta novamente.')],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
      return;
    }

    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.isAutocomplete()) {
      try {
        if (command.autocomplete) {
          await command.autocomplete(interaction, client);
        } else {
          await interaction.respond([]);
        }
      } catch (error) {
        console.error(`Erro no autocomplete /${interaction.commandName}:`, error);
        await interaction.respond([]).catch(() => {});
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Erro no comando /${interaction.commandName}:`, error);

      const reply = {
        embeds: [errorEmbed('Erro Inesperado', 'Ocorreu um erro ao executar este comando. Tenta novamente.')],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
