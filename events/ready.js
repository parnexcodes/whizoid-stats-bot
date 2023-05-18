const { Events } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const logger = require("../utils/winston");
const prisma = require("../utils/prisma")

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    const guild = client.guilds.cache.get("639085571029073936");
    const roleId = "1018810863198674976";

    logger.info('Refreshing User list.')
    let res = await guild.members.fetch().then((members) => {
      members
        .filter((mmbr) => mmbr.roles.cache.get(roleId))
        .map(async (m) => {
          const createUser = await prisma.user.upsert({
            create: {
              user_id: m.user.tag
            },
            update: {
              user_id: m.user.tag
            },
            where: {
              user_id: m.user.tag
            },
            select: {
              _count: true
            }
          })
        });
    });
    logger.info(`Refreshed!`);
  },
};
