const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../PendingPicks");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Returns a list of your queued picks"),

	async execute(interaction) {
		const user = getUser(interaction.user.username);
		if (!user || user.picks.length === 0) {
			await interaction.reply({
				content: `You do not have any queued picks.`,
				ephemeral: true
			});
			return;
		}
		const picks = user.picks;
		await interaction.reply({
			content: `Your queued picks are:\n${picks.join("\n")}`,
			ephemeral: true
		});
	}
};
