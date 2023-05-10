const { Events } = require("discord.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
