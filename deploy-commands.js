require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error("DISCORD_TOKEN e DISCORD_CLIENT_ID sao obrigatorios no .env ou nas variaveis do Plesk.");
  process.exit(1);
}

if (token.startsWith("Bot ")) {
  console.error('DISCORD_TOKEN deve ser apenas o token, sem o prefixo "Bot ".');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(path.join(folderPath, file));
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        console.log(`OK ${command.data.name}`);
      }
    } catch (error) {
      // Skip re-export files that do not export command data directly.
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`\nA registar ${commands.length} comandos slash...`);

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Comandos registados com sucesso!");
  } catch (error) {
    if (error?.status === 401) {
      console.error("Discord devolveu 401 Unauthorized.");
      console.error('Confirma no Plesk que DISCORD_TOKEN e o token atual do Bot, sem aspas e sem "Bot " no inicio.');
      console.error("Confirma tambem que DISCORD_CLIENT_ID e o Application ID da mesma aplicacao Discord.");
      process.exit(1);
    }

    console.error("Erro ao registar comandos:", error);
    process.exit(1);
  }
})();
