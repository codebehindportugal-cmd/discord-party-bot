require("dotenv").config();
const { REST } = require("discord.js");

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.DISCORD_CLIENT_ID?.trim();

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 10) return "(too short)";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

(async () => {
  if (!token || !clientId) {
    console.error("DISCORD_TOKEN ou DISCORD_CLIENT_ID em falta no ambiente deste terminal.");
    process.exit(1);
  }

  if (token.startsWith("Bot ")) {
    console.error('DISCORD_TOKEN tem o prefixo "Bot ". Remove esse prefixo.');
    process.exit(1);
  }

  console.log(`DISCORD_CLIENT_ID: ${clientId}`);
  console.log(`DISCORD_TOKEN: ${mask(token)}`);

  const rest = new REST().setToken(token);

  try {
    const botUser = await rest.get("/users/@me");
    console.log(`Token aceite pelo Discord. Bot: ${botUser.username} (${botUser.id})`);

    if (botUser.id !== clientId) {
      console.error("Aviso: o DISCORD_CLIENT_ID nao e igual ao ID do bot autenticado.");
      console.error("Usa o Application ID da mesma aplicacao Discord. Em muitos bots, esse ID coincide com o ID do bot.");
      process.exit(1);
    }
  } catch (error) {
    if (error?.status === 401) {
      console.error("O Discord rejeitou este DISCORD_TOKEN com 401 Unauthorized.");
      console.error("Este terminal nao esta a usar o token correto, ou o token foi regenerado/invalidado.");
      process.exit(1);
    }

    console.error("Erro ao validar token Discord:", error);
    process.exit(1);
  }
})();
