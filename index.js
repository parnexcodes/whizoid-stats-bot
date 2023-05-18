const fs = require("node:fs");
const path = require("node:path");
const cron = require("node-cron");
const prisma = require("./utils/prisma");
const { EmbedBuilder } = require("discord.js");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  GuildMember,
} = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

cron.schedule("5 22 * * *", async () => {
  const getAllUsersData = await prisma.user.findMany({
    include: {
      stats: true,
    },
    where: {
      stats: {
        some: {
          date: new Date().toLocaleDateString(),
        },
      },
    },
  });

  cron.schedule("10 22 * * *", async () => {
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
  })

  let channel = client.channels.cache.get(process.env.LOG_CHANNELID);

  const exampleEmbed = new EmbedBuilder();
  exampleEmbed.setColor(0x0099ff);
  exampleEmbed.setTitle("Stats");
  exampleEmbed.setDescription(`Stats of all users!`);

  for (const data of getAllUsersData) {
    exampleEmbed.addFields(
      { name: "User", value: data.user_id, inline: true },
      { name: "Date", value: data.stats[0].date, inline: true },
      { name: "Total Time", value: data.stats[0].total_time, inline: true }
    );
  }
  exampleEmbed.setTimestamp();
  exampleEmbed.setFooter({
    text: "Bot made by parnex#4104",
  });

  await channel.send({
    embeds: [exampleEmbed],
  });
});

client.login(DISCORD_TOKEN);
