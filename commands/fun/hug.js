const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug Someone')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to hug')
                .setRequired(true)
        ),
    async execute(interaction) {
        return interaction.reply(`${interaction.user} hugs ${interaction.options.getUser('user')}`)
    },
};