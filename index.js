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
  const getData = await prisma.stats.findFirst({
    where: {
      date: new Date().toLocaleDateString(),
    },
  });

  let channel = client.channels.cache.get("1105837319543590912");

  const exampleEmbed = new EmbedBuilder();
  exampleEmbed.setColor(0x0099ff);
  exampleEmbed.setTitle("Stats");
  exampleEmbed.setDescription(`Stats of all users!`);
  exampleEmbed.addFields({
    name: "Date",
    value: "**" + new Date().toLocaleDateString() + "**",
  });
  for (const data of getData.log) {
    exampleEmbed.addFields(
      { name: "User", value: data.user_id, inline: true },
      { name: "Total Time", value: data.worked_time, inline: true }
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
