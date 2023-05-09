const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("testing!"),
  async execute(interaction) {
    const sent = await interaction.reply(`Hi! ${interaction.member.displayName}`);
  },
};
