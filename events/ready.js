const { Events } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const logger = require('../utils/winston')

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`)
    // console.log();
  },
};
