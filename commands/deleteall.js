const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../PendingPicks");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteall')
        .setDescription('clears all queued picks')
        ,
    async execute(interaction) {
        const user = getUser(interaction.user.username);
        if (!user) {
            await interaction.reply({content: 'You have not locked in any picks to delete.', ephemeral: true});
            return;
        };

        const deletedPicks = user.deleteAllPicks();
        await interaction.reply({content: `You have deleted the following Pokemon from your queue\n ${deletedPicks.join('\n')}`, ephemeral: true});
    }
}