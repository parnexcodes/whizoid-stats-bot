const { SlashCommandBuilder } = require("@discordjs/builders");
const prisma = require("../../utils/prisma");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register yourself!"),
  async execute(interaction) {
    let role = interaction.member.roles.cache.find((r) =>
      JSON.parse(process.env.ALLOWED_ROLE).includes(r.name)
    );
    if (!role) {
      return interaction.reply("You're not allowed to use this command!");
    }
    await interaction.reply("Checking user in db!");
    const checkUser = await prisma.user.findFirst({
      where: {
        user_id: interaction.user.tag,
      },
    });
    if (!checkUser) {
      const createUser = await prisma.user.create({
        data: {
          user_id: interaction.user.tag,
          stats: {},
        },
      });
      await interaction.editReply(
        `${interaction.user} has been successfully registered in db!`
      );
    } else {
      await interaction.editReply(
        `${interaction.user} already registered in db!`
      );
    }
  },
};
