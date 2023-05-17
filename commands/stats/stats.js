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

    if (interaction.options.getUser("user")) {
      const getData = await prisma.user.findFirst({
        where: {
          user_id: `${interaction.options.getUser("user").username}#${
            interaction.options.getUser("user").discriminator
          }`,
        },
        include: {
          stats: true,
        },
      });

      const filterDate = getData.stats.filter((e) => {
        return (e.date = interaction.options.getString("date")
          ? interaction.options.getString("date")
          : new Date().toLocaleDateString());
      });

      if (!getData) {
        return interaction.editReply("No data found in db!");
      }

      const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Stats")
        .setDescription(
          `Stats of ${interaction.options.getUser("user").username}`
        )
        .addFields(
          { name: "User", value: getData.user_id },
          {
            name: "Date",
            value: filterDate[0].date,
          },
          { name: "Total Time", value: filterDate[0].total_time, inline: true }
        )
        .setImage(
          `https://cdn.discordapp.com/avatars/${
            interaction.options.getUser("user").id
          }/${interaction.options.getUser("user").avatar}.png`
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
      const getAllUsersData = await prisma.user.findMany({
        include: {
          stats: true,
        },
        // orderBy: {
        //   stats: {
        //     date: "asc",
        //   },
        // },
        where: {
          stats: {
            some: {
              date: interaction.options.getString("date")
                ? interaction.options.getString("date")
                : new Date().toLocaleDateString(),
            },
          },
        },
      });

      if (getAllUsersData.length == 0) {
        return interaction.editReply("No data found in db!");
      }

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

      await interaction.editReply(`Stats for all users!`);

      await interaction.editReply({
        embeds: [exampleEmbed],
      });
    }
  },
};
