const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const prisma = require("../../utils/prisma");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View Stats of the member!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to see stats of")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("Enter date for which you want the stats")
        .setRequired(false)
    ),
  async execute(interaction) {
    let role = interaction.member.roles.cache.find((r) =>
      JSON.parse(process.env.ADMIN_ROLES).includes(r.name)
    );
    if (!role) {
      return interaction.reply("You're not allowed to use this command!");
    }
    await interaction.reply("Fetching data from db ...");
    const getData = await prisma.stats.findFirst({
      where: {
        date: interaction.options.getString("date")
          ? interaction.options.getString("date")
          : new Date().toLocaleDateString(),
      },
    });

    if (!getData) {
      return interaction.editReply("No entry found in db!");
    }

    if (interaction.options.getUser("user")) {
      var newArray = getData.log.filter(function (el) {
        return (
          el.user_id ==
          `${interaction.options.getUser("user").username}#${
            interaction.options.getUser("user").discriminator
          }`
        );
      });

      const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Stats")
        .setDescription(
          `Stats of ${interaction.options.getUser("user").username}`
        )
        .addFields(
          { name: "User", value: newArray[0].user_id },
          {
            name: "Date",
            value: interaction.options.getString("date")
              ? interaction.options.getString("date")
              : new Date().toLocaleDateString(),
          },
          { name: "Total Time", value: newArray[0].worked_time, inline: true }
        )
        .addFields(
          {
            name: "Join",
            value: "```json\n" + JSON.stringify(newArray[0].log.join) + "\n```",
          },
          {
            name: "Move",
            value: "```json\n" + JSON.stringify(newArray[0].log.move) + "\n```",
          },
          {
            name: "Leave",
            value:
              "```json\n" + JSON.stringify(newArray[0].log.leave) + "\n```",
          }
        )
        .setImage(
          `https://cdn.discordapp.com/avatars/${
            interaction.options.getUser("user").id
          }${interaction.options.getUser("user").avatar}.png`
        )
        .setTimestamp()
        .setFooter({
          text: "Bot made by parnex#4104",
        });

      await interaction.editReply(
        `Stats for ${interaction.options.getUser("user")}`
      );

      await interaction.editReply({
        embeds: [exampleEmbed],
      });
    } else {
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

      await interaction.editReply(`Stats for all users!`);

      await interaction.editReply({
        embeds: [exampleEmbed],
      });
    }
  },
};
