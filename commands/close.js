const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const pollCollector = require('../pollCollector');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Close')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions("0"),
    async execute(interaction) {
        const eventOriginId = interaction.targetMessage.id;
        const poll = pollCollector.findPoll(eventOriginId);
        if (!poll) {
            return interaction.reply({
                content: `This message is not associated with a poll in my database. Ping mFsGiant if this is an error.`,
                ephemeral: true
            });
        };

        poll.hidden = false;

        poll.message.edit(poll.buildPoll(true));

        return interaction.reply({
            content: `Poll "${poll.title}" closed.`,
            ephemeral: true
        })
    }
}