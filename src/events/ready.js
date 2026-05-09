module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`\n🤖 Bot online como: ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);

    client.user.setPresence({
      activities: [{ name: '⚔️ Party Loot Manager', type: 3 }],
      status: 'online',
    });
  },
};
