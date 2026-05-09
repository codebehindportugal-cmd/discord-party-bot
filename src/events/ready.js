module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`\nBot online como: ${client.user.tag}`);
    console.log(`Servidores: ${client.guilds.cache.size}`);

    client.user.setPresence({
      activities: [{ name: 'MordsFocas', type: 3 }],
      status: 'online',
    });
  },
};
