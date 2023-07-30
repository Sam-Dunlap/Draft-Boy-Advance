const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../PendingPicks");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Deletes one of your queued picks.")
		.addStringOption(option =>
			option
				.setName("deletedmon")
				.setDescription("the pokemon you want to delete")
				.setRequired(true)
		),

	async execute(interaction) {
		const user = getUser(interaction.user.username);
		const mon = interaction.options.getString("deletedmon").toUpperCase();
		if (!user) {
			await interaction.reply({
				content:
					"You have not locked in any picks yet. To queue a pick, use /pick while it is not your turn to draft.",
				ephemeral: true
			});
			return;
		}
		if (user.deletePickByName(mon)) {
			await interaction.reply({
				content: `${mon} has been removed from your queued picks.`,
				ephemeral: true
			});
			return;
		}
		await interaction.reply({
			content: `I couldn't find ${mon} in your queued picks. Please check your current queued picks with /check and try again.`,
			ephemeral: true
		});
	}
};
